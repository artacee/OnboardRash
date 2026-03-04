"""
Bus Simulator for Rash Driving Detection System

Generates realistic driving data and sends it to the backend,
allowing full system testing without physical IoT hardware.

Each bus follows a FIXED route (real towns along Kerala NH roads)
and loops continuously.  Event thresholds, cooldowns, and payloads
mirror the actual hardware pipeline (main_pi.py + sensor drivers).

Run: python simulator/simulator.py
"""

import time
import random
import math
import requests
import json
import os
import hashlib
from datetime import datetime
from pathlib import Path

# Try to load environment variables (optional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ─── Configuration ───────────────────────────────────────────────────────────

SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:5000')
SIMULATION_INTERVAL = float(os.getenv('SIMULATION_INTERVAL', '2.0'))
EVENT_PROBABILITY = float(os.getenv('EVENT_PROBABILITY', '0.15'))
API_KEY = os.getenv('API_KEY', 'default-secure-key-123')
OSRM_BASE = os.getenv('OSRM_BASE', 'https://router.project-osrm.org')
ROUTE_CACHE_FILE = Path(__file__).parent / 'cached_routes.json'

# ─── Detection Thresholds (must match main_pi.py) ───────────────────────────

# Bus-realistic g-force thresholds (recalibrated from sports-car values)
THRESHOLD_HARSH_BRAKE = -0.45      # g-force, triggers HARSH_BRAKE
THRESHOLD_HARSH_BRAKE_HIGH = -0.6  # g-force, HIGH severity
THRESHOLD_HARSH_ACCEL = 0.35       # g-force, triggers HARSH_ACCEL
THRESHOLD_AGGRESSIVE_TURN = 0.4    # g-force Y-axis
THRESHOLD_AGGRESSIVE_TURN_HIGH = 0.55

# Ultrasonic (cm)
OVERTAKING_CLOSE_CM = 100          # HIGH severity
OVERTAKING_WARNING_CM = 150        # MEDIUM severity
OVERTAKING_MIN_SPEED = 10.0        # km/h — only detect when moving

# Tailgating (camera area %)
TAILGATE_AREA_HIGH = 15            # HIGH severity
TAILGATE_AREA_WARNING = 10         # MEDIUM severity (warning)

# Cooldown
EVENT_COOLDOWN = 5.0               # seconds between events per bus

# ─── Fixed Routes (real towns along Kerala NH roads) ─────────────────────────

# Route 1: Kollam ↔ Trivandrum (NH-66, ~70 km)
# Kollam → Paravur → Varkala → Attingal → Kallambalam → Trivandrum → (loop back)
ROUTE_KOLLAM_TVM = [
    (8.8932, 76.6141),   # Kollam KSRTC Bus Stand
    (8.8145, 76.6530),   # Paravur Junction
    (8.7333, 76.7167),   # Varkala
    (8.6947, 76.8150),   # Attingal
    (8.6200, 76.8350),   # Kallambalam
    (8.5241, 76.9366),   # Trivandrum Central
    (8.6200, 76.8350),   # Kallambalam (return)
    (8.6947, 76.8150),   # Attingal (return)
    (8.7333, 76.7167),   # Varkala (return)
    (8.8145, 76.6530),   # Paravur Junction (return)
]

# Route 2: Kollam ↔ Kochi (NH-66, ~140 km)
# Kollam → Karunagappally → Kayamkulam → Alappuzha → Cherthala → Aroor → Kochi → (loop back)
ROUTE_KOLLAM_KOCHI = [
    (8.9100, 76.5900),   # Kollam (Chinnakada)
    (9.0550, 76.5350),   # Karunagappally
    (9.1750, 76.5000),   # Kayamkulam
    (9.4981, 76.3388),   # Alappuzha (Alleppey)
    (9.6800, 76.3350),   # Cherthala
    (9.8500, 76.3100),   # Aroor
    (9.9312, 76.2673),   # Kochi (Ernakulam South)
    (9.8500, 76.3100),   # Aroor (return)
    (9.6800, 76.3350),   # Cherthala (return)
    (9.4981, 76.3388),   # Alappuzha (return)
    (9.1750, 76.5000),   # Kayamkulam (return)
    (9.0550, 76.5350),   # Karunagappally (return)
]

# Route 3: Kollam ↔ Alappuzha (NH-66, ~55 km)
# Kollam → Karunagappally → Kayamkulam → Haripad → Alappuzha → (loop back)
ROUTE_KOLLAM_ALAPPUZHA = [
    (8.8800, 76.6300),   # Kollam (Asramam)
    (9.0550, 76.5350),   # Karunagappally
    (9.1750, 76.5000),   # Kayamkulam
    (9.2800, 76.4600),   # Haripad
    (9.4981, 76.3388),   # Alappuzha
    (9.2800, 76.4600),   # Haripad (return)
    (9.1750, 76.5000),   # Kayamkulam (return)
    (9.0550, 76.5350),   # Karunagappally (return)
]


# ─── OSRM Road-Snap Helpers ─────────────────────────────────────────────────

def _waypoints_hash(waypoints):
    """Deterministic hash of waypoint list for cache key."""
    key = json.dumps(waypoints, sort_keys=True)
    return hashlib.md5(key.encode()).hexdigest()[:12]


def _load_route_cache():
    """Load cached OSRM routes from disk."""
    if ROUTE_CACHE_FILE.exists():
        try:
            with open(ROUTE_CACHE_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def _save_route_cache(cache):
    """Persist OSRM route cache to disk."""
    try:
        with open(ROUTE_CACHE_FILE, 'w') as f:
            json.dump(cache, f)
    except IOError as e:
        print(f"  ⚠️  Could not save route cache: {e}")


def fetch_osrm_route(waypoints, route_name="route"):
    """
    Fetch a road-snapped route from OSRM for the given waypoints.

    Calls OSRM's /route/v1/driving endpoint with the waypoints.
    Returns a dense list of (lat, lng) tuples that follow actual roads.
    Results are cached to disk so subsequent runs don't hit the API.

    Falls back to original sparse waypoints if OSRM is unreachable.
    """
    cache_key = _waypoints_hash(waypoints)
    cache = _load_route_cache()

    # Check cache first
    if cache_key in cache:
        coords = [tuple(c) for c in cache[cache_key]]
        print(f"  📦 Loaded cached OSRM route for {route_name}: {len(coords)} points")
        return coords

    # Build OSRM coordinate string: lng,lat;lng,lat;...
    # OSRM uses (longitude, latitude) order
    coord_str = ";".join(f"{lng},{lat}" for lat, lng in waypoints)
    url = f"{OSRM_BASE}/route/v1/driving/{coord_str}?overview=full&geometries=geojson&steps=false"

    try:
        print(f"  🌐 Fetching OSRM route for {route_name}...")
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        if data.get('code') != 'Ok' or not data.get('routes'):
            print(f"  ⚠️  OSRM returned no route for {route_name}, using sparse waypoints")
            return list(waypoints)

        # OSRM GeoJSON coordinates are [lng, lat] — flip to (lat, lng)
        geojson_coords = data['routes'][0]['geometry']['coordinates']
        dense_coords = [(coord[1], coord[0]) for coord in geojson_coords]

        # Cache to disk
        cache[cache_key] = dense_coords
        _save_route_cache(cache)

        print(f"  ✅ OSRM route for {route_name}: {len(dense_coords)} road-snapped points "
              f"(was {len(waypoints)} sparse waypoints)")
        return dense_coords

    except requests.RequestException as e:
        print(f"  ⚠️  OSRM fetch failed for {route_name}: {e}")
        print(f"       Falling back to {len(waypoints)} sparse waypoints")
        return list(waypoints)


def get_road_snapped_route(waypoints, route_name="route"):
    """
    Get a road-snapped route for a looping bus route.

    For looping routes (A→B→C→B→A), we fetch the one-way route and
    its reverse separately, then concatenate for a smooth loop.
    This avoids OSRM trying to create a round trip in one request, which
    can produce weird U-turns.
    """
    # Find the midpoint (furthest destination) — typically where the route reverses
    n = len(waypoints)

    # Try to detect if this is a there-and-back route by checking if later waypoints
    # match earlier ones (reversed). If so, split and fetch each half.
    half = n // 2
    is_loop = n >= 6  # All our routes are loops

    if is_loop:
        # Forward leg: first half + 1 (include the turnaround point)
        forward_wps = waypoints[:half + 1]
        # Return leg: from turnaround back
        return_wps = waypoints[half:]

        forward = fetch_osrm_route(forward_wps, f"{route_name} (forward)")
        backward = fetch_osrm_route(return_wps, f"{route_name} (return)")

        # Concatenate, skipping the duplicate midpoint
        if len(backward) > 1:
            dense = forward + backward[1:]
        else:
            dense = forward + backward
        return dense
    else:
        return fetch_osrm_route(waypoints, route_name)


# ─── Bus Simulator ───────────────────────────────────────────────────────────

class BusSimulator:
    """Simulates a single bus following a fixed route with realistic sensors."""

    def __init__(self, bus_id, registration, route_name, waypoints):
        self.bus_id = bus_id
        self.registration = registration
        self.route_name = route_name

        # Fetch road-snapped dense waypoints via OSRM (cached to disk)
        self.original_waypoints = waypoints
        self.waypoints = get_road_snapped_route(waypoints, route_name)
        self.is_road_snapped = len(self.waypoints) > len(waypoints)
        self.current_wp = 0

        # Current position — starts at first waypoint
        self.lat = self.waypoints[0][0]
        self.lng = self.waypoints[0][1]
        self.heading = 0.0

        # Speed (km/h) — simulated with smooth Kalman-like drift
        self.speed = random.uniform(25, 40)
        self.target_speed = self.speed

        # Cooldown tracking (mirrors EVENT_COOLDOWN in main_pi.py)
        self.last_event_time = 0

    def update_position(self):
        """Move the bus towards the next waypoint along the route.

        With OSRM road-snapped routes, waypoints are very dense (10-50m apart)
        so we step through multiple points per tick based on current speed.
        With sparse fallback waypoints, behaviour is unchanged from before.
        """
        if self.is_road_snapped:
            # Dense road-snapped route: step through multiple points per tick
            # At ~40 km/h = ~11 m/s, in 2s interval = ~22m. Dense points are ~20-60m apart.
            # Step 1-3 waypoints per tick depending on speed.
            steps = max(1, int(self.speed / 25))  # faster = more steps
            for _ in range(steps):
                target_lat, target_lng = self.waypoints[self.current_wp]
                dlat = target_lat - self.lat
                dlng = target_lng - self.lng
                distance = math.sqrt(dlat ** 2 + dlng ** 2)

                if distance < 0.0003:  # ~33m — close enough, advance to next point
                    self.current_wp = (self.current_wp + 1) % len(self.waypoints)
                    self.lat = target_lat
                    self.lng = target_lng
                    continue

                # Interpolate smoothly towards next dense point
                speed_factor = 0.0004 * (self.speed / 30)
                move = min(speed_factor / distance, 1.0)  # don't overshoot
                self.lat += dlat * move
                self.lng += dlng * move
                break  # moved, wait for next tick

            # Heading from current pos to the next waypoint (or the one after)
            look_ahead = min(self.current_wp + 2, len(self.waypoints) - 1)
            ahead_lat, ahead_lng = self.waypoints[look_ahead]
            dlat_h = ahead_lat - self.lat
            dlng_h = ahead_lng - self.lng
            if abs(dlat_h) > 1e-8 or abs(dlng_h) > 1e-8:
                self.heading = math.degrees(math.atan2(dlng_h, dlat_h)) % 360

        else:
            # Sparse fallback waypoints: original behaviour
            target_lat, target_lng = self.waypoints[self.current_wp]
            dlat = target_lat - self.lat
            dlng = target_lng - self.lng
            distance = math.sqrt(dlat ** 2 + dlng ** 2)

            if distance < 0.002:
                self.current_wp = (self.current_wp + 1) % len(self.waypoints)
                self.target_speed = random.uniform(25, 55)
                return

            speed_factor = 0.0005 * (self.speed / 30)
            self.lat += dlat / distance * speed_factor
            self.lng += dlng / distance * speed_factor
            self.heading = math.degrees(math.atan2(dlng, dlat)) % 360

        # Smooth speed towards target (Kalman-like drift)
        # Occasionally pick a new target speed to simulate traffic
        if random.random() < 0.05:
            self.target_speed = random.uniform(25, 55)
        self.speed += (self.target_speed - self.speed) * 0.1
        self.speed += random.gauss(0, 0.5)
        self.speed = max(10, min(65, self.speed))

    def _cooldown_ok(self):
        """Check if enough time has passed since the last event."""
        return (time.time() - self.last_event_time) >= EVENT_COOLDOWN

    def generate_sensor_reading(self):
        """
        Generate realistic sensor data and optionally a driving event.

        Returns:
            (sensor_data dict, event dict or None)
        """
        # ── Normal driving — small random accelerations ──────────────────
        accel_x = random.gauss(0, 0.15)   # forward / backward
        accel_y = random.gauss(0, 0.10)   # left / right
        accel_z = random.gauss(1.0, 0.05) # gravity

        event = None

        # ── Random chance of a rash event ────────────────────────────────
        if random.random() < EVENT_PROBABILITY and self._cooldown_ok():
            event_type = random.choices(
                ['HARSH_BRAKE', 'HARSH_ACCEL', 'AGGRESSIVE_TURN',
                 'TAILGATING', 'CLOSE_OVERTAKING'],
                weights=[30, 25, 20, 15, 10],
                k=1
            )[0]

            if event_type == 'HARSH_BRAKE':
                # Generate braking g-force that exceeds the threshold
                # Bus range: -0.45 to -0.8g (emergency-stop territory)
                accel_x = random.uniform(-0.8, THRESHOLD_HARSH_BRAKE - 0.02)
                event = {
                    'type': 'HARSH_BRAKE',
                    'severity': 'HIGH' if accel_x < THRESHOLD_HARSH_BRAKE_HIGH else 'MEDIUM',
                    'value': round(accel_x, 3)
                }

            elif event_type == 'HARSH_ACCEL':
                # Bus range: 0.35 to 0.55g (aggressive pull-away)
                accel_x = random.uniform(THRESHOLD_HARSH_ACCEL + 0.02, 0.55)
                event = {
                    'type': 'HARSH_ACCEL',
                    'severity': 'MEDIUM',  # always MEDIUM per main_pi.py
                    'value': round(accel_x, 3)
                }

            elif event_type == 'AGGRESSIVE_TURN':
                direction = random.choice([-1, 1])
                # Bus range: 0.4 to 0.6g lateral (near-rollover territory)
                accel_y = random.uniform(THRESHOLD_AGGRESSIVE_TURN + 0.02, 0.6) * direction
                event = {
                    'type': 'AGGRESSIVE_TURN',
                    'severity': 'HIGH' if abs(accel_y) > THRESHOLD_AGGRESSIVE_TURN_HIGH else 'MEDIUM',
                    'value': round(accel_y, 3)
                }

            elif event_type == 'TAILGATING':
                # Simulate camera-based detection: generate area% and distance
                area_percent = random.uniform(TAILGATE_AREA_WARNING + 1, 25)
                estimated_distance = max(5, 100 - (area_percent * 3))
                event = {
                    'type': 'TAILGATING',
                    'severity': 'HIGH' if area_percent >= TAILGATE_AREA_HIGH else 'MEDIUM',
                    'area_percent': round(area_percent, 1),
                    'estimated_distance': round(estimated_distance, 0),
                    'value': round(area_percent, 1)
                }

            elif event_type == 'CLOSE_OVERTAKING':
                # Only when speed > 10 km/h (matches main_pi.py line 247)
                if self.speed > OVERTAKING_MIN_SPEED:
                    distance_cm = random.uniform(50, OVERTAKING_WARNING_CM - 5)
                    event = {
                        'type': 'CLOSE_OVERTAKING',
                        'severity': 'HIGH' if distance_cm < OVERTAKING_CLOSE_CM else 'MEDIUM',
                        'distance': round(distance_cm, 1),
                        'value': round(distance_cm, 1)
                    }

            # Record cooldown timestamp
            if event:
                self.last_event_time = time.time()

        return {
            'acceleration_x': round(accel_x, 3),
            'acceleration_y': round(accel_y, 3),
            'acceleration_z': round(accel_z, 3),
            'speed': round(self.speed, 1),
            'location': {
                'lat': round(self.lat, 6),
                'lng': round(self.lng, 6)
            }
        }, event


# ─── Network Helpers ─────────────────────────────────────────────────────────

def send_location_update(bus, sensor_data):
    """POST location to /api/buses/<id>/location."""
    try:
        response = requests.post(
            f"{SERVER_URL}/api/buses/{bus.bus_id}/location",
            json={
                'lat': sensor_data['location']['lat'],
                'lng': sensor_data['location']['lng'],
                'speed': sensor_data['speed'],
                'heading': round(bus.heading, 1)
            },
            headers={'X-API-Key': API_KEY},
            timeout=5
        )
        return response.status_code == 200
    except Exception as e:
        print(f"  ⚠️  Location update failed: {e}")
        return False


def send_event(bus, sensor_data, event):
    """POST driving event to /api/events."""
    try:
        payload = {
            'bus_id': bus.bus_id,
            'bus_registration': bus.registration,
            'event_type': event['type'],
            'severity': event['severity'],
            'acceleration_x': sensor_data['acceleration_x'],
            'acceleration_y': sensor_data['acceleration_y'],
            'acceleration_z': sensor_data['acceleration_z'],
            'speed': sensor_data['speed'],
            'location': sensor_data['location'],
            'timestamp': datetime.utcnow().isoformat()
        }

        response = requests.post(
            f"{SERVER_URL}/api/events",
            json=payload,
            headers={'X-API-Key': API_KEY},
            timeout=5
        )
        return response.status_code == 201
    except Exception as e:
        print(f"  ⚠️  Event send failed: {e}")
        return False


# ─── Main Loop ───────────────────────────────────────────────────────────────

def main():
    """Main simulation loop."""
    print("\n" + "=" * 60)
    print("🚌 RASH DRIVING SIMULATOR")
    print("=" * 60)
    print(f"  Server   : {SERVER_URL}")
    print(f"  Interval : {SIMULATION_INTERVAL}s")
    print(f"  Event %  : {EVENT_PROBABILITY * 100:.0f}%")
    print(f"  Cooldown : {EVENT_COOLDOWN}s between events per bus")
    print("=" * 60)

    # ── Create simulated buses (match init_db sample buses) ──────────
    buses = [
        BusSimulator(1, "KL-01-AB-1234", "Kollam → Trivandrum", ROUTE_KOLLAM_TVM),
        BusSimulator(2, "KL-01-CD-5678", "Kollam → Kochi",      ROUTE_KOLLAM_KOCHI),
        BusSimulator(3, "KL-01-EF-9012", "Kollam → Alappuzha",  ROUTE_KOLLAM_ALAPPUZHA),
    ]

    print("\n  Buses:")
    for b in buses:
        print(f"    [{b.bus_id}] {b.registration}  —  {b.route_name}")

    print("\n" + "=" * 60)
    print("  Starting simulation... Press Ctrl+C to stop.\n")

    iteration = 0
    events_sent = 0

    try:
        while True:
            iteration += 1
            print(f"\n--- Tick {iteration} ({datetime.now().strftime('%H:%M:%S')}) ---")

            for bus in buses:
                # Move along route
                bus.update_position()

                # Generate sensor data + possible event
                sensor_data, event = bus.generate_sensor_reading()

                # Send location update every tick
                send_location_update(bus, sensor_data)

                if event:
                    success = send_event(bus, sensor_data, event)
                    if success:
                        events_sent += 1
                        sev = "🔴" if event['severity'] == 'HIGH' else "🟡"
                        extra = ""
                        if event['type'] == 'TAILGATING':
                            extra = f" (area {event.get('area_percent', '?')}%)"
                        elif event['type'] == 'CLOSE_OVERTAKING':
                            extra = f" ({event.get('distance', '?')} cm)"
                        print(f"  {sev} {bus.registration}: {event['type']} [{event['severity']}]{extra}")
                else:
                    wp = bus.waypoints[bus.current_wp]
                    print(f"  ✅ {bus.registration}: {bus.speed:.0f} km/h "
                          f"→ WP{bus.current_wp} ({wp[0]:.4f}, {wp[1]:.4f})")

            print(f"\n  Total events: {events_sent}")
            time.sleep(SIMULATION_INTERVAL)

    except KeyboardInterrupt:
        print("\n\n" + "=" * 60)
        print("  Simulation stopped.")
        print(f"  Total iterations : {iteration}")
        print(f"  Total events sent: {events_sent}")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
