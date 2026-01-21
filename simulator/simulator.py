"""
Bus Simulator for Rash Driving Detection System

This simulator generates realistic driving data and sends it to the backend,
allowing full system testing without physical IoT hardware.

Run: python simulator/simulator.py
"""

import time
import random
import math
import requests
import json
from datetime import datetime

# Configuration
SERVER_URL = "http://localhost:5000"
SIMULATION_INTERVAL = 2.0  # seconds between updates
EVENT_PROBABILITY = 0.15   # 15% chance of rash event per update
API_KEY = "default-secure-key-123"  # Must match backend


class BusSimulator:
    """Simulates a single bus with sensors."""
    
    def __init__(self, bus_id, registration, start_lat, start_lng):
        self.bus_id = bus_id
        self.registration = registration
        
        # Position and movement
        self.lat = start_lat
        self.lng = start_lng
        self.heading = random.uniform(0, 360)  # degrees
        self.speed = random.uniform(20, 40)    # km/h
        
        # Movement parameters
        self.route_points = self._generate_route()
        self.current_point_index = 0
        
    def _generate_route(self):
        """Generate a simple circular route around starting point."""
        points = []
        center_lat = self.lat
        center_lng = self.lng
        radius = 0.02  # ~2km radius
        
        for i in range(12):
            angle = (i / 12) * 2 * math.pi
            lat = center_lat + radius * math.sin(angle)
            lng = center_lng + radius * math.cos(angle)
            points.append((lat, lng))
        
        return points
    
    def update_position(self):
        """Move the bus along its route."""
        # Get next target point
        target = self.route_points[self.current_point_index]
        
        # Calculate direction to target
        dlat = target[0] - self.lat
        dlng = target[1] - self.lng
        distance = math.sqrt(dlat**2 + dlng**2)
        
        # If close to target, move to next point
        if distance < 0.001:
            self.current_point_index = (self.current_point_index + 1) % len(self.route_points)
            return
        
        # Move towards target
        speed_factor = 0.0005 * (self.speed / 30)  # Adjust based on speed
        self.lat += dlat * speed_factor
        self.lng += dlng * speed_factor
        
        # Update heading
        self.heading = math.degrees(math.atan2(dlng, dlat))
        
        # Vary speed slightly
        self.speed += random.uniform(-2, 2)
        self.speed = max(15, min(65, self.speed))  # Clamp between 15-65 km/h
    
    def generate_sensor_reading(self):
        """Generate realistic sensor data."""
        # Normal driving - small accelerations
        accel_x = random.gauss(0, 0.15)  # Forward/backward
        accel_y = random.gauss(0, 0.10)  # Left/right
        accel_z = random.gauss(1.0, 0.05)  # Gravity
        
        event = None
        
        # Random chance of rash driving event
        if random.random() < EVENT_PROBABILITY:
            event_type = random.choice(['HARSH_BRAKE', 'HARSH_ACCEL', 'AGGRESSIVE_TURN'])
            
            if event_type == 'HARSH_BRAKE':
                accel_x = random.uniform(-2.0, -1.5)  # Strong braking
                event = {
                    'type': 'HARSH_BRAKE',
                    'severity': 'HIGH' if accel_x < -1.8 else 'MEDIUM'
                }
            elif event_type == 'HARSH_ACCEL':
                accel_x = random.uniform(1.0, 1.5)  # Strong acceleration
                event = {
                    'type': 'HARSH_ACCEL',
                    'severity': 'MEDIUM'
                }
            elif event_type == 'AGGRESSIVE_TURN':
                accel_y = random.uniform(0.8, 1.2) * random.choice([-1, 1])  # Sharp turn
                event = {
                    'type': 'AGGRESSIVE_TURN',
                    'severity': 'MEDIUM' if abs(accel_y) < 1.0 else 'HIGH'
                }
        
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


def send_location_update(bus, sensor_data):
    """Send location update to server."""
    try:
        response = requests.post(
            f"{SERVER_URL}/api/buses/{bus.bus_id}/location",
            json={
                'lat': sensor_data['location']['lat'],
                'lng': sensor_data['location']['lng'],
                'speed': sensor_data['speed'],
                'heading': bus.heading
            },
            headers={'X-API-Key': API_KEY},
            timeout=5
        )
        return response.status_code == 200
    except Exception as e:
        print(f"  ⚠️ Location update failed: {e}")
        return False


def send_event(bus, sensor_data, event):
    """Send rash driving event to server."""
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
        print(f"  ⚠️ Event send failed: {e}")
        return False


def main():
    """Main simulation loop."""
    print("\n" + "="*60)
    print("RASH DRIVING SIMULATOR")
    print("="*60)
    print(f"Server: {SERVER_URL}")
    print(f"Update interval: {SIMULATION_INTERVAL}s")
    print(f"Event probability: {EVENT_PROBABILITY*100}%")
    print("="*60)
    print("\nStarting simulation... Press Ctrl+C to stop.\n")
    
    # Create simulated buses (using existing bus IDs from database)
    buses = [
        BusSimulator(1, "KL-01-AB-1234", 8.8932, 76.6141),  # Kollam
        BusSimulator(2, "KL-01-CD-5678", 8.9100, 76.5900),  # Nearby
        BusSimulator(3, "KL-01-EF-9012", 8.8800, 76.6300),  # Nearby
    ]
    
    iteration = 0
    events_sent = 0
    
    try:
        while True:
            iteration += 1
            print(f"\n--- Iteration {iteration} ({datetime.now().strftime('%H:%M:%S')}) ---")
            
            for bus in buses:
                # Update position
                bus.update_position()
                
                # Generate sensor reading
                sensor_data, event = bus.generate_sensor_reading()
                
                # Send location update
                send_location_update(bus, sensor_data)
                
                # If event detected, send it
                if event:
                    success = send_event(bus, sensor_data, event)
                    if success:
                        events_sent += 1
                        severity_label = "[HIGH]" if event['severity'] == 'HIGH' else "[MED]"
                        print(f"  {severity_label} {bus.registration}: {event['type']} ({event['severity']})")
                else:
                    print(f"  [BUS] {bus.registration}: Normal driving @ {sensor_data['speed']:.1f} km/h")
            
            print(f"\n  Total events sent: {events_sent}")
            time.sleep(SIMULATION_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("Simulation stopped.")
        print(f"Total iterations: {iteration}")
        print(f"Total events sent: {events_sent}")
        print("="*60 + "\n")


if __name__ == "__main__":
    main()
