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
from datetime import datetime

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

# ─── Detection Thresholds (must match main_pi.py) ───────────────────────────

THRESHOLD_HARSH_BRAKE = -1.5       # g-force, triggers HARSH_BRAKE
THRESHOLD_HARSH_BRAKE_HIGH = -1.8  # g-force, HIGH severity
THRESHOLD_HARSH_ACCEL = 1.0        # g-force, triggers HARSH_ACCEL
THRESHOLD_AGGRESSIVE_TURN = 0.8    # g-force Y-axis
THRESHOLD_AGGRESSIVE_TURN_HIGH = 1.0

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


# ─── Bus Simulator ───────────────────────────────────────────────────────────

class BusSimulator:
    """Simulates a single bus following a fixed route with realistic sensors."""

    def __init__(self, bus_id, registration, route_name, waypoints):
        self.bus_id = bus_id
        self.registration = registration
        self.route_name = route_name

        # Route waypoints (fixed, loops continuously)
        self.waypoints = waypoints
        self.current_wp = 0

        # Current position — starts at first waypoint
        self.lat = waypoints[0][0]
        self.lng = waypoints[0][1]
        self.heading = 0.0

        # Speed (km/h) — simulated with smooth Kalman-like drift
        self.speed = random.uniform(25, 40)
        self.target_speed = self.speed

        # Cooldown tracking (mirrors EVENT_COOLDOWN in main_pi.py)
        self.last_event_time = 0

    def update_position(self):
        """Move the bus towards the next waypoint along the fixed route."""
        target_lat, target_lng = self.waypoints[self.current_wp]

        dlat = target_lat - self.lat
        dlng = target_lng - self.lng
        distance = math.sqrt(dlat ** 2 + dlng ** 2)

        # If close to waypoint, advance to next (wrap around for loop)
        if distance < 0.002:
            self.current_wp = (self.current_wp + 1) % len(self.waypoints)
            # Pick a new target speed for the next leg
            self.target_speed = random.uniform(25, 55)
            return

        # Move towards target — speed controls step size
        speed_factor = 0.0005 * (self.speed / 30)
        self.lat += dlat / distance * speed_factor
        self.lng += dlng / distance * speed_factor

        # Update heading (degrees)
        self.heading = math.degrees(math.atan2(dlng, dlat)) % 360

        # Smooth speed towards target (Kalman-like drift)
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
                # Generate braking g-force that actually exceeds the threshold
                accel_x = random.uniform(-2.2, THRESHOLD_HARSH_BRAKE - 0.05)
                event = {
                    'type': 'HARSH_BRAKE',
                    'severity': 'HIGH' if accel_x < THRESHOLD_HARSH_BRAKE_HIGH else 'MEDIUM',
                    'value': round(accel_x, 3)
                }

            elif event_type == 'HARSH_ACCEL':
                accel_x = random.uniform(THRESHOLD_HARSH_ACCEL + 0.05, 1.6)
                event = {
                    'type': 'HARSH_ACCEL',
                    'severity': 'MEDIUM',  # always MEDIUM per main_pi.py
                    'value': round(accel_x, 3)
                }

            elif event_type == 'AGGRESSIVE_TURN':
                direction = random.choice([-1, 1])
                accel_y = random.uniform(THRESHOLD_AGGRESSIVE_TURN + 0.05, 1.3) * direction
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
