"""
Main script for Raspberry Pi - Rash Driving Detection WITH CAMERA

This script runs on the Raspberry Pi, reads sensor data, detects
rash driving events, captures video evidence, and sends alerts to the backend.

Usage: python main_pi.py
"""

import os
import sys
import time
import requests
import threading
import base64
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sensors.mpu6050 import MPU6050
from sensors.gps import GPSModule

# Try to import camera
try:
    from sensors.camera import CameraModule
    CAMERA_AVAILABLE = True
except ImportError:
    CAMERA_AVAILABLE = False
    print("Warning: Camera module not available (OpenCV not installed)")

# Load configuration
load_dotenv()

# Configuration
SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:5000')
BUS_REGISTRATION = os.getenv('BUS_REGISTRATION', 'KL-01-TEST-001')
SAMPLE_RATE = float(os.getenv('SAMPLE_RATE', '0.1'))  # 100ms = 10Hz
ENABLE_CAMERA = os.getenv('ENABLE_CAMERA', 'true').lower() == 'true'

# Detection thresholds (in g-force)
THRESHOLD_HARSH_BRAKE = -1.5
THRESHOLD_HARSH_ACCEL = 1.0
THRESHOLD_AGGRESSIVE_TURN = 0.8

# Cooldown between events (seconds)
EVENT_COOLDOWN = 5.0


class RashDrivingDetector:
    """Detects rash driving behaviors from sensor data."""
    
    def __init__(self):
        self.last_event_time = 0
    
    def analyze(self, accel):
        """
        Analyze acceleration data for rash driving events.
        
        Args:
            accel: dict with x, y, z acceleration values in g
            
        Returns:
            dict or None: Event data if detected, None otherwise
        """
        # Check cooldown
        if time.time() - self.last_event_time < EVENT_COOLDOWN:
            return None
        
        event = None
        
        # Harsh braking (negative X acceleration)
        if accel['x'] < THRESHOLD_HARSH_BRAKE:
            event = {
                'type': 'HARSH_BRAKE',
                'severity': 'HIGH' if accel['x'] < -1.8 else 'MEDIUM',
                'value': accel['x']
            }
        
        # Harsh acceleration (positive X acceleration)
        elif accel['x'] > THRESHOLD_HARSH_ACCEL:
            event = {
                'type': 'HARSH_ACCEL',
                'severity': 'MEDIUM',
                'value': accel['x']
            }
        
        # Aggressive turn (Y acceleration)
        elif abs(accel['y']) > THRESHOLD_AGGRESSIVE_TURN:
            event = {
                'type': 'AGGRESSIVE_TURN',
                'severity': 'HIGH' if abs(accel['y']) > 1.0 else 'MEDIUM',
                'value': accel['y']
            }
        
        if event:
            self.last_event_time = time.time()
        
        return event


def send_event(event_data, gps_data, accel, video_path=None, snapshot_path=None):
    """Send a detected event to the backend server."""
    try:
        payload = {
            'bus_registration': BUS_REGISTRATION,
            'event_type': event_data['type'],
            'severity': event_data['severity'],
            'acceleration_x': accel['x'],
            'acceleration_y': accel['y'],
            'acceleration_z': accel['z'],
            'speed': gps_data.get('speed'),
            'location': {
                'lat': gps_data.get('latitude'),
                'lng': gps_data.get('longitude')
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Add video evidence info if available
        if video_path:
            payload['video_path'] = video_path
        if snapshot_path:
            payload['snapshot_path'] = snapshot_path
            # Optionally include base64 encoded snapshot
            try:
                with open(snapshot_path, 'rb') as f:
                    payload['snapshot_base64'] = base64.b64encode(f.read()).decode('utf-8')
            except Exception:
                pass
        
        response = requests.post(
            f"{SERVER_URL}/api/events",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 201:
            print(f"  ✅ Event sent: {event_data['type']}")
            return True
        else:
            print(f"  ⚠️ Server returned {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Failed to send event: {e}")
        return False


def upload_video(event_id, video_path):
    """Upload video file to server in background."""
    try:
        with open(video_path, 'rb') as f:
            files = {'video': (os.path.basename(video_path), f, 'video/mp4')}
            response = requests.post(
                f"{SERVER_URL}/api/events/{event_id}/video",
                files=files,
                timeout=60
            )
            if response.status_code == 200:
                print(f"  📹 Video uploaded for event {event_id}")
                return True
    except Exception as e:
        print(f"  ⚠️ Video upload failed: {e}")
    return False


def send_location_update(gps_data):
    """Send periodic location update to the server."""
    try:
        if not gps_data.get('latitude') or not gps_data.get('longitude'):
            return False
        
        payload = {
            'lat': gps_data['latitude'],
            'lng': gps_data['longitude'],
            'speed': gps_data.get('speed'),
        }
        
        # We need bus_id, so use registration endpoint
        response = requests.post(
            f"{SERVER_URL}/api/buses",
            json={'registration_number': BUS_REGISTRATION},
            timeout=5
        )
        
        return response.status_code in [200, 201, 409]
        
    except Exception as e:
        return False


def main():
    """Main loop for the Raspberry Pi detector."""
    print("\n" + "="*60)
    print("🚌 RASH DRIVING DETECTION SYSTEM")
    print("   Raspberry Pi Hardware Mode (with Camera)")
    print("="*60)
    print(f"Server: {SERVER_URL}")
    print(f"Bus: {BUS_REGISTRATION}")
    print(f"Sample Rate: {SAMPLE_RATE}s ({1/SAMPLE_RATE:.0f} Hz)")
    print(f"Camera: {'Enabled' if ENABLE_CAMERA and CAMERA_AVAILABLE else 'Disabled'}")
    print("="*60)
    
    # Initialize sensors
    print("\nInitializing sensors...")
    
    try:
        mpu = MPU6050()
    except Exception as e:
        print(f"❌ MPU-6050 initialization failed: {e}")
        print("   Check I2C connection and run: sudo i2cdetect -y 1")
        sys.exit(1)
    
    try:
        gps = GPSModule()
        print("Waiting for GPS fix (move outdoors if needed)...")
        gps.wait_for_fix(timeout=30)
    except Exception as e:
        print(f"⚠️ GPS initialization failed: {e}")
        print("   Continuing without GPS...")
        gps = None
    
    # Initialize camera
    camera = None
    if ENABLE_CAMERA and CAMERA_AVAILABLE:
        try:
            camera = CameraModule(output_dir="recordings")
            if camera.camera:
                camera.start_buffer_recording()
                print("📹 Camera initialized and recording to buffer")
            else:
                print("⚠️ No camera detected, continuing without video")
                camera = None
        except Exception as e:
            print(f"⚠️ Camera initialization failed: {e}")
            camera = None
    
    # Initialize detector
    detector = RashDrivingDetector()
    
    print("\n" + "="*60)
    print("✅ System ready! Monitoring for rash driving...")
    print("   Press Ctrl+C to stop")
    print("="*60 + "\n")
    
    iteration = 0
    events_detected = 0
    last_location_update = 0
    LOCATION_UPDATE_INTERVAL = 10  # seconds
    
    try:
        while True:
            iteration += 1
            
            # Read sensors
            accel = mpu.read_acceleration()
            gps_data = gps.read() if gps else {}
            
            # Analyze for events
            event = detector.analyze(accel)
            
            if event:
                events_detected += 1
                severity_emoji = "🔴" if event['severity'] == 'HIGH' else "🟡"
                print(f"{severity_emoji} DETECTED: {event['type']} (value: {event['value']:.2f}g)")
                
                # Capture video evidence
                video_path = None
                snapshot_path = None
                
                if camera:
                    # Take snapshot immediately
                    snapshot_path = camera.capture_snapshot(event['type'])
                    
                    # Save video clip (includes buffer + few seconds after)
                    video_path = camera.save_clip(event['type'], duration_after=5)
                
                # Send event to server
                send_event(event, gps_data, accel, video_path, snapshot_path)
            
            # Periodic location update
            if time.time() - last_location_update > LOCATION_UPDATE_INTERVAL:
                if gps_data.get('latitude'):
                    send_location_update(gps_data)
                    last_location_update = time.time()
            
            # Debug output every 50 iterations
            if iteration % 50 == 0:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] "
                      f"Accel: X={accel['x']:+.2f}g | "
                      f"Events: {events_detected} | "
                      f"GPS: {'✓' if gps_data.get('has_fix') else '✗'} | "
                      f"Cam: {'✓' if camera else '✗'}")
            
            time.sleep(SAMPLE_RATE)
            
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("System stopped.")
        print(f"Total events detected: {events_detected}")
        print("="*60 + "\n")
    finally:
        mpu.close()
        if gps:
            gps.close()
        if camera:
            camera.close()


if __name__ == "__main__":
    main()
