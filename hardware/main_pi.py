"""
Main script for Raspberry Pi - Rash Driving Detection WITH ALL SENSORS

This script runs on the Raspberry Pi, reads sensor data, detects:
- Harsh Driving (IMU)
- Tailgating (Front Camera - Driver Tailgating Vehicle Ahead)
- Close Overtaking (Left Ultrasonic)
- Captures video evidence

Features:
- Sensor Fusion (Kalman Filter) for Speed vs Vibration
- Offline Support (Store & Forward)
- Night Vision Enhancement
- API Key Security

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
from sensors.ultrasonic import UltrasonicSensor, OvertakingDetector
from sensors.sensor_fusion import KalmanFilter
from sensors.phone_gps import PhoneGPSReceiver
from data_manager import DataManager

# Try to import camera and tailgating detector
try:
    from sensors.camera import CameraModule
    from sensors.tailgating import TailgatingDetector
    CAMERA_AVAILABLE = True
except ImportError:
    CAMERA_AVAILABLE = False
    print("Warning: Camera module/OpenCV not available")

# Load configuration
load_dotenv()

# Configuration
SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:5000')
BUS_REGISTRATION = os.getenv('BUS_REGISTRATION', 'KL-01-TEST-001')
SAMPLE_RATE = float(os.getenv('SAMPLE_RATE', '0.1'))  # 100ms = 10Hz
ENABLE_CAMERA = os.getenv('ENABLE_CAMERA', 'true').lower() == 'true'
API_KEY = os.getenv('API_KEY', 'default-secure-key-123')

# Phone GPS receiver port
PHONE_GPS_PORT = int(os.getenv('PHONE_GPS_PORT', '8081'))

# Detection thresholds (in g-force)
THRESHOLD_HARSH_BRAKE = -1.5
THRESHOLD_HARSH_ACCEL = 1.0
THRESHOLD_AGGRESSIVE_TURN = 0.8

# Cooldown between events (seconds)
EVENT_COOLDOWN = 5.0

# Initialize Data Manager
data_manager = DataManager(SERVER_URL, API_KEY)


class RashDrivingDetector:
    """Detects rash driving behaviors from sensor data."""
    
    def __init__(self):
        self.last_event_time = 0
    
    def analyze(self, accel):
        """Analyze acceleration data for rash driving."""
        # Check cooldown (global for all rash driving types)
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
    """
    Send a detected event to the backend server.
    Uses DataManager for robust queuing/syncing.
    """
    try:
        # Construct payload
        payload = {
            'bus_registration': BUS_REGISTRATION,
            'event_type': event_data['type'],
            'severity': event_data['severity'],
            'acceleration_x': accel.get('x', 0),
            'acceleration_y': accel.get('y', 0),
            'acceleration_z': accel.get('z', 0),
            'speed': gps_data.get('speed'),
            'location': {
                'lat': gps_data.get('latitude'),
                'lng': gps_data.get('longitude')
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if video_path:
            payload['video_path'] = video_path
        if snapshot_path:
            payload['snapshot_path'] = snapshot_path

        # Queue the event via DataManager (handles offline support)
        success = data_manager.queue_event(payload, video_path, snapshot_path)
        
        if success:
            print(f"  ✅ Event processed: {event_data['type']}")
            return True
        else:
            print(f"  ❌ Failed to queue event")
            return False
            
    except Exception as e:
        print(f"  ❌ Failed to process event: {e}")
        return False


def main():
    """Main loop for the Raspberry Pi detector."""
    print("\n" + "="*60)
    print("🚌 RASH DRIVING DETECTION SYSTEM v2.1")
    print("   Full Hardware Mode + Sensor Fusion (Kalman Filter)")
    print("="*60)
    print(f"Server: {SERVER_URL}")
    print(f"Bus: {BUS_REGISTRATION}")
    
    # Initialize sensors
    print("\nInitializing sensors...")
    
    # 1. IMU
    try:
        mpu = MPU6050()
    except Exception as e:
        print(f"❌ MPU-6050 failed: {e}. Check I2C.")
        sys.exit(1)
    
    # 2. GPS (phone companion app)
    gps = PhoneGPSReceiver(port=PHONE_GPS_PORT)
    print(f"📱 GPS Source: Driver Companion App (port {PHONE_GPS_PORT})")
        
    # 3. Kalman Filter (Sensor Fusion)
    kf = KalmanFilter(initial_speed=0)
    print("🧠 Sensor Fusion (Kalman Filter) initialized")
    
    # 4. Ultrasonic (Left Side)
    try:
        ultrasonic = UltrasonicSensor(name="left_side")
        overtaking_detector = OvertakingDetector(ultrasonic)
    except Exception as e:
        print(f"⚠️ Ultrasonic failed: {e}")
        overtaking_detector = None
    
    # 5. Camera & Tailgating
    camera = None
    tailgating_detector = None
    
    if ENABLE_CAMERA and CAMERA_AVAILABLE:
        try:
            camera = CameraModule(output_dir="recordings")
            if camera.camera:
                camera.start_buffer_recording()
                print("📹 Camera initialized (Front Facing)")
                
                # Initialize tailgating detector
                tailgating_detector = TailgatingDetector(use_cascade=True)
            else:
                print("⚠️ No camera detected")
                camera = None
        except Exception as e:
            print(f"⚠️ Camera init failed: {e}")
            camera = None
    
    # Initialize main rash driving detector
    rash_detector = RashDrivingDetector()
    
    print("\n" + "="*60)
    print("✅ System ready! Monitoring...")
    print("="*60 + "\n")
    
    iteration = 0
    events_detected = 0
    last_print = time.time()
    
    try:
        while True:
            iteration += 1
            current_time = time.time()
            
            # --- READ SENSORS ---
            accel = mpu.read_acceleration()
            gps_data = gps.read() if gps else {}
            
            # --- SENSOR FUSION ---
            # Predict state using Accelerometer (X-axis is forward)
            kf.predict(accel['x'])
            
            # Update state using GPS Speed (if available)
            if gps_data.get('speed') is not None:
                kf.update(gps_data['speed'])
                
            estimated_speed = kf.get_speed()
            
            # --- ANALYZE RASH DRIVING (IMU) ---
            event = rash_detector.analyze(accel)
            
            # --- ANALYZE OVERTAKING (Ultrasonic) ---
            # Use FUSED Speed for better accuracy (Robust against GPS dropouts)
            if not event and overtaking_detector and estimated_speed > 10.0:
                event = overtaking_detector.analyze()
            
            # --- ANALYZE TAILGATING (Front Camera) ---
            if not event and tailgating_detector and camera:
                frame = camera.get_current_frame()
                if frame is not None:
                    event = tailgating_detector.analyze_frame(frame)
            
            # --- HANDLE EVENT ---
            if event:
                events_detected += 1
                severity_emoji = "🔴" if event.get('severity') == 'HIGH' else "🟡"
                print(f"{severity_emoji} DETECTED: {event['type']}")
                
                # Capture evidence
                video_path = None
                snapshot_path = None
                
                if camera:
                    snapshot_path = camera.capture_snapshot(event['type'])
                    video_path = camera.save_clip(event['type'], duration_after=5)
                
                # Send to server (via DataManager)
                send_event(event, gps_data, accel, video_path, snapshot_path)
                
            # --- STATUS UPDATE ---
            if current_time - last_print > 5.0:
                gps_status = '✓' if gps_data.get('has_fix') else '✗'
                cam_status = '✓' if camera else '✗'
                print(f"[{datetime.now().strftime('%H:%M:%S')}] "
                      f"Accel X:{accel['x']:.2f}g | "
                      f"Speed: {estimated_speed:.1f} km/h (Fused) | "
                      f"Events:{events_detected}")
                last_print = current_time
            
            time.sleep(SAMPLE_RATE)
            
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        mpu.close()
        if gps: gps.close()
        if camera: camera.close()
        if overtaking_detector: ultrasonic.cleanup()
        data_manager.close()


if __name__ == "__main__":
    main()
