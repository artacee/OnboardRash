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

Usage:
    python main_pi.py                        # interactive prompt (default)
    python main_pi.py --no-prompt              # skip prompt, use .env values
    python main_pi.py --server http://x.x.x.x:5000   # override server URL
    python main_pi.py --auto-network           # auto-connect WiFi first
"""

import os
import sys
import time
import argparse
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

# Try to import camera, tailgating detector, and OpenCV
CV2_AVAILABLE = False
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    pass

try:
    from sensors.camera import CameraModule
    from sensors.tailgating import TailgatingDetector
    CAMERA_AVAILABLE = True
except ImportError:
    CAMERA_AVAILABLE = False
    print("Warning: Camera module/OpenCV not available")

# Load configuration
load_dotenv()

# ── CLI argument parsing ────────────────────────────────────────
def _parse_args():
    p = argparse.ArgumentParser(
        description='OnboardRash — Raspberry Pi rash driving detector'
    )
    p.add_argument('--server', metavar='URL',
                   help='Override SERVER_URL (e.g. http://192.168.43.2:5000)')
    p.add_argument('--gps-port', metavar='PORT', type=int,
                   help='Override PHONE_GPS_PORT (default: 8081)')
    p.add_argument('--bus', metavar='REG',
                   help='Override BUS_REGISTRATION')
    p.add_argument('--no-prompt', action='store_true',
                   help='Skip interactive startup prompt')
    p.add_argument('--auto-network', action='store_true',
                   help='Run network_setup.py to auto-connect WiFi first')
    return p.parse_args()

_cli = _parse_args()

# Configuration — .env first, then CLI overrides
SERVER_URL = _cli.server or os.getenv('SERVER_URL', 'http://localhost:5000')
BUS_REGISTRATION = _cli.bus or os.getenv('BUS_REGISTRATION', 'KL-01-TEST-001')
SAMPLE_RATE = float(os.getenv('SAMPLE_RATE', '0.1'))  # 100ms = 10Hz
ENABLE_CAMERA = os.getenv('ENABLE_CAMERA', 'false').lower() == 'true'
API_KEY = os.getenv('API_KEY', 'default-secure-key-123')

# Phone GPS receiver port
PHONE_GPS_PORT = _cli.gps_port or int(os.getenv('PHONE_GPS_PORT', '8081'))

# Resolved at startup — bus DB ID (not the same as registration number)
BUS_ID = None

# Detection thresholds (in g-force) — calibrated for heavy bus dynamics
# A loaded bus: emergency ABS stop ≈ 0.6-0.9g, aggressive accel ≈ 0.3-0.5g,
# lateral rollover begins ≈ 0.5g.  Previous values (1.5/1.0/0.8) were for sports cars.
THRESHOLD_HARSH_BRAKE = -0.45
THRESHOLD_HARSH_BRAKE_HIGH = -0.6
THRESHOLD_HARSH_ACCEL = 0.35
THRESHOLD_AGGRESSIVE_TURN = 0.4
THRESHOLD_AGGRESSIVE_TURN_HIGH = 0.55

# Cooldown between events (seconds) — now per event type
EVENT_COOLDOWN = 5.0

# Sensor mount orientation: 'default', '90cw', '90ccw', '180'
# Remap IMU axes when the Pi is mounted rotated relative to bus forward direction.
MOUNT_ORIENTATION = os.getenv('MOUNT_ORIENTATION', 'default')

# ── Network setup + interactive prompt ──────────────────────────
def _get_network_info():
    """Best-effort network info on Linux (Pi). Returns dict."""
    info = {'ssid': None, 'own_ip': None, 'gateway': None}
    try:
        from network_setup import NetSetup
        net = NetSetup()
        net.discover()
        return net.info
    except Exception:
        pass
    return info


def _auto_network():
    """Run network_setup to ensure Pi is connected. Returns info dict."""
    try:
        from network_setup import NetSetup
        net = NetSetup()
        net.ensure_connected()
        print()
        net.print_status()
        print()
        return net.info
    except ImportError:
        print("⚠️  network_setup.py not found — skipping auto-network")
        return {}
    except Exception as e:
        print(f"⚠️  auto-network failed: {e}")
        return {}


def _interactive_prompt():
    """
    Show current config and let user edit SERVER_URL / GPS port
    before the sensor loop starts.  Skipped with --no-prompt.
    """
    global SERVER_URL, PHONE_GPS_PORT, BUS_REGISTRATION

    net = _get_network_info()
    ssid = net.get('ssid') or '(unknown)'
    pi_ip = net.get('own_ip') or '(unknown)'
    gateway = net.get('gateway') or '(unknown)'
    iface = net.get('interface') or ''
    method = net.get('method') or ''

    # Build display
    def _box(lines, title='OnboardRash Pi Config'):
        width = max(len(l) for l in lines) + 4
        width = max(width, len(title) + 8)
        print(f"\n╔══ {title} {'═' * (width - len(title) - 6)}╗")
        for l in lines:
            print(f"║  {l.ljust(width - 4)}║")
        print(f"╚{'═' * (width - 1)}╝")

    net_label = '🔌 USB' if method == 'usb_tether' else f'📶 {ssid}'
    lines = [
        f"Network:       {net_label}  ({iface})",
        f"Pi IP:         {pi_ip}",
        f"Gateway:       {gateway}",
        f"",
        f"SERVER_URL:    {SERVER_URL}",
        f"GPS_PORT:      {PHONE_GPS_PORT}",
        f"BUS_REG:       {BUS_REGISTRATION}",
        f"API_KEY:       {API_KEY[:12]}{'…' if len(API_KEY) > 12 else ''}",
        f"CAMERA:        {'ON' if ENABLE_CAMERA else 'OFF'}",
    ]
    _box(lines)

    # Localhost warning
    if 'localhost' in SERVER_URL or '127.0.0.1' in SERVER_URL:
        print("\n  ⚠️  SERVER_URL points to localhost — this won't work on the Pi!")
        if gateway and gateway != '(unknown)':
            subnet_prefix = gateway.rsplit('.', 1)[0]
            print(f"     Hint: your subnet is {subnet_prefix}.x")
            print(f"     Try:  s http://{subnet_prefix}.<laptop_last_octet>:5000")

    print("\nCommands:")
    print("  ENTER       → start with current config")
    print("  s <url>     → change SERVER_URL")
    print("  p <port>    → change GPS receiver port")
    print("  b <reg>     → change bus registration")
    print("  q           → quit")

    while True:
        try:
            cmd = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nQuitting.")
            sys.exit(0)

        if cmd == '':
            break
        elif cmd.lower() == 'q':
            print("Quitting.")
            sys.exit(0)
        elif cmd.lower().startswith('s '):
            new_url = cmd[2:].strip()
            if new_url:
                SERVER_URL = new_url
                # Also update DataManager
                data_manager.server_url = SERVER_URL
                print(f"  ✓ SERVER_URL = {SERVER_URL}")
            else:
                print("  Usage: s http://192.168.x.x:5000")
        elif cmd.lower().startswith('p '):
            try:
                PHONE_GPS_PORT = int(cmd[2:].strip())
                print(f"  ✓ GPS_PORT = {PHONE_GPS_PORT}")
            except ValueError:
                print("  Usage: p 8081")
        elif cmd.lower().startswith('b '):
            new_reg = cmd[2:].strip()
            if new_reg:
                BUS_REGISTRATION = new_reg
                print(f"  ✓ BUS_REG = {BUS_REGISTRATION}")
            else:
                print("  Usage: b KL-01-XX-001")
        else:
            print("  Unknown command. Use s/p/b or ENTER to start.")

    print()  # Blank line before sensor init output


# ── Startup sequence ────────────────────────────────────────────
# 1. Auto-network (if requested)
if _cli.auto_network:
    _net_info = _auto_network()

# Initialize Data Manager (uses current SERVER_URL)
data_manager = DataManager(SERVER_URL, API_KEY)

# 2. Interactive prompt (unless --no-prompt)
if not _cli.no_prompt:
    _interactive_prompt()


def _remap_axes(accel, orientation):
    """Remap accelerometer axes based on sensor mount orientation."""
    x, y = accel['x'], accel['y']
    if orientation == '90cw':
        accel['x'], accel['y'] = y, -x
    elif orientation == '90ccw':
        accel['x'], accel['y'] = -y, x
    elif orientation == '180':
        accel['x'], accel['y'] = -x, -y
    return accel


def register_bus_with_backend():
    """
    Register this bus with the backend at startup.
    Retries up to 5 times with exponential backoff (3s, 6s, 12s, 24s, 48s).
    If all retries fail, a background thread keeps retrying every 30 seconds.
    Returns the backend-assigned integer bus ID (or None if offline).
    """
    global BUS_ID
    headers = {'X-API-Key': API_KEY, 'Content-Type': 'application/json'}
    payload = {'registration_number': BUS_REGISTRATION}

    def _attempt():
        """Single registration attempt. Returns id on success, None on failure."""
        try:
            resp = requests.post(f"{SERVER_URL}/api/buses", json=payload,
                                 headers=headers, timeout=5)
            if resp.status_code in (200, 201, 409):
                data = resp.json()
                bid = data.get('bus', {}).get('id')
                return bid
        except Exception as e:
            print(f"  ↳ Registration attempt failed: {e}")
        return None

    # --- Immediate retry loop (up to 5 attempts) ---
    wait = 3
    for attempt in range(1, 6):
        print(f"🚌 Registering bus (attempt {attempt}/5): {BUS_REGISTRATION}")
        bid = _attempt()
        if bid:
            BUS_ID = bid
            print(f"✅ Bus registered: {BUS_REGISTRATION} → backend ID {BUS_ID}")
            return BUS_ID
        if attempt < 5:
            print(f"   Retrying in {wait}s…")
            time.sleep(wait)
            wait *= 2  # Exponential backoff

    print("⚠️  Could not register bus after 5 attempts. "
          "Location updates will be skipped until registration succeeds.")
    print("   A background thread will keep retrying every 30 s.\n")

    # --- Background retry thread ---
    def _background_retry():
        global BUS_ID
        while BUS_ID is None:
            time.sleep(30)
            print("🔄 Background: retrying bus registration…")
            bid = _attempt()
            if bid:
                BUS_ID = bid
                print(f"✅ Background: bus registered → ID {BUS_ID}")

    t = threading.Thread(target=_background_retry, daemon=True)
    t.start()
    return None


class RashDrivingDetector:
    """Detects rash driving behaviors from sensor data."""
    
    def __init__(self):
        # Per-type cooldowns so a swerve right after a brake still fires
        self.last_event_times = {
            'HARSH_BRAKE': 0,
            'HARSH_ACCEL': 0,
            'AGGRESSIVE_TURN': 0,
        }
    
    def _cooldown_ok(self, event_type):
        return time.time() - self.last_event_times[event_type] >= EVENT_COOLDOWN

    def analyze(self, accel):
        """Analyze acceleration data for rash driving."""
        events = []
        
        # Harsh braking (negative X acceleration)
        if accel['x'] < THRESHOLD_HARSH_BRAKE and self._cooldown_ok('HARSH_BRAKE'):
            events.append({
                'type': 'HARSH_BRAKE',
                'severity': 'HIGH' if accel['x'] < THRESHOLD_HARSH_BRAKE_HIGH else 'MEDIUM',
                'value': accel['x']
            })
        
        # Harsh acceleration (positive X acceleration)
        if accel['x'] > THRESHOLD_HARSH_ACCEL and self._cooldown_ok('HARSH_ACCEL'):
            events.append({
                'type': 'HARSH_ACCEL',
                'severity': 'MEDIUM',
                'value': accel['x']
            })
        
        # Aggressive turn (Y acceleration)
        if abs(accel['y']) > THRESHOLD_AGGRESSIVE_TURN and self._cooldown_ok('AGGRESSIVE_TURN'):
            events.append({
                'type': 'AGGRESSIVE_TURN',
                'severity': 'HIGH' if abs(accel['y']) > THRESHOLD_AGGRESSIVE_TURN_HIGH else 'MEDIUM',
                'value': accel['y']
            })
        
        for ev in events:
            self.last_event_times[ev['type']] = time.time()
        
        # Return first event for backwards-compat; main loop now handles multi-event
        return events if events else None


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
        if event_data.get('gps_stale'):
            payload['gps_stale'] = True

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
    print("🚌 RASH DRIVING DETECTION SYSTEM v2.2")
    print("   Full Hardware Mode + Sensor Fusion (Kalman Filter)")
    print("="*60)
    print(f"Server: {SERVER_URL}")
    print(f"Bus: {BUS_REGISTRATION}")
    if MOUNT_ORIENTATION != 'default':
        print(f"🧭 Sensor mount: {MOUNT_ORIENTATION}")
    
    # Initialize sensors
    print("\nInitializing sensors...")
    
    # 1. IMU (optional — script continues without it)
    try:
        mpu = MPU6050()
        print("✅ MPU-6050 initialized")
    except Exception as e:
        print(f"⚠️  MPU-6050 not available: {e}")
        print("   Running in GPS-only mode (no IMU/rash detection).")
        mpu = None
    
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
                tailgating_detector = TailgatingDetector(use_dnn=True)
            else:
                print("⚠️ No camera detected")
                camera = None
        except Exception as e:
            print(f"⚠️ Camera init failed: {e}")
            camera = None
    
    # Register bus with backend and get our DB ID
    register_bus_with_backend()

    # Initialize main rash driving detector
    rash_detector = RashDrivingDetector()
    
    print("\n" + "="*60)
    print("✅ System ready! Sensors calibrated.")
    print("\n   ⏳ STANDBY — Waiting for driver to start trip in app...")
    print("   (Event detection begins when driver taps Start Trip)")
    print("="*60 + "\n")
    
    iteration = 0
    events_detected = 0
    last_print = time.time()
    last_location_update = 0
    last_gps_time = time.time()
    LOCATION_UPDATE_INTERVAL = 2.0  # Send position to backend every 2 seconds

    # Per-type cooldowns for non-IMU detectors (IMU cooldowns are internal)
    last_overtaking_time = 0
    last_tailgating_time = 0

    # Z-axis bump suppression — skip IMU events for 300 ms after vertical spike
    _bump_suppress_until = 0.0
    _was_trip_active = False  # Track trip state transitions for log messages
    
    try:
        while True:
            iteration += 1
            current_time = time.time()
            
            # --- READ SENSORS ---
            accel = mpu.read_acceleration() if mpu else {'x': 0, 'y': 0, 'z': 0}
            gps_data = gps.read() if gps else {}

            # Remap IMU axes if sensor is mounted rotated
            if mpu and MOUNT_ORIENTATION != 'default':
                accel = _remap_axes(accel, MOUNT_ORIENTATION)

            # Z-axis bump suppression: if vertical shock detected, suppress
            # IMU-based event detection for 300 ms to avoid speed-bump false positives
            if mpu and abs(accel['z'] - 1.0) > 0.5:
                _bump_suppress_until = current_time + 0.3
            
            # --- SENSOR FUSION ---
            # Update state using GPS Speed first (so staleness is known for predict)
            if gps_data.get('speed') is not None:
                kf.update(gps_data['speed'])
                last_gps_time = current_time

            gps_stale_seconds = current_time - last_gps_time

            # Predict using IMU — but freeze if GPS stale >10 s to prevent drift
            if mpu and gps_stale_seconds <= 10.0:
                kf.predict(accel['x'])
            # else: GPS stale >10 s — skip predict to freeze speed estimate
                
            estimated_speed = kf.get_speed()
            
            # --- LIVE LOCATION UPDATE (for Live Map) ---
            if (current_time - last_location_update >= LOCATION_UPDATE_INTERVAL
                    and gps_data.get('latitude') and gps_data.get('longitude')
                    and BUS_ID is not None):
                try:
                    requests.post(
                        f"{SERVER_URL}/api/buses/{BUS_ID}/location",
                        json={
                            'lat': gps_data['latitude'],
                            'lng': gps_data['longitude'],
                            'speed': estimated_speed,
                            'heading': gps_data.get('heading', 0)
                        },
                        headers={'X-API-Key': API_KEY},
                        timeout=3
                    )
                except Exception:
                    pass  # Non-critical; don't block sensor loop
                last_location_update = current_time
            
            # --- Collect ALL detected events this tick (independent) ---
            # Only detect events when a trip is active (driver pressed Start Trip)
            trip_active = gps.trip_active if gps else False

            # Log trip state transitions
            if trip_active and not _was_trip_active:
                print("\n" + "━"*50)
                print("🟢 TRIP ACTIVE — Event detection ENABLED")
                print("━"*50 + "\n")
            elif not trip_active and _was_trip_active:
                print("\n" + "━"*50)
                print("🔴 TRIP ENDED — Event detection on STANDBY")
                print("━"*50 + "\n")
            _was_trip_active = trip_active

            tick_events = []

            if trip_active:
                # 1. ANALYZE RASH DRIVING (IMU) — may return multiple
                #    Suppressed for 300 ms after Z-axis bump (speed bump / pothole)
                if mpu and current_time >= _bump_suppress_until:
                    imu_events = rash_detector.analyze(accel)
                    if imu_events:
                        tick_events.extend(imu_events)

                # 2. ANALYZE OVERTAKING (Ultrasonic) — independent of IMU
                #    Speed gate at 15 km/h eliminates GPS noise at standstill
                if (overtaking_detector
                        and estimated_speed > 15.0
                        and current_time - last_overtaking_time >= EVENT_COOLDOWN):
                    ot_event = overtaking_detector.analyze()
                    if ot_event:
                        tick_events.append(ot_event)
                        last_overtaking_time = current_time

                # 3. ANALYZE TAILGATING (Front Camera) — independent of both
                if (tailgating_detector and camera
                        and current_time - last_tailgating_time >= EVENT_COOLDOWN):
                    frame = camera.capture_frame()
                    if frame is not None:
                        # Resize to 640×480 for CV (DNN only needs 300×300 anyway)
                        small = cv2.resize(frame, (640, 480)) if CV2_AVAILABLE else frame
                        tg_event = tailgating_detector.analyze_frame(small)
                        if tg_event:
                            tick_events.append(tg_event)
                            last_tailgating_time = current_time

            # --- HANDLE EVENTS (all of them) ---
            for event in tick_events:
                events_detected += 1
                # Tag event with GPS stale flag if applicable
                if gps_stale_seconds > 5.0:
                    event['gps_stale'] = True
                severity_emoji = "🔴" if event.get('severity') == 'HIGH' else "🟡"
                print(f"{severity_emoji} DETECTED: {event['type']}")
                
                # Capture evidence in background thread, THEN queue event with media paths.
                # This keeps the sensor loop non-blocking while ensuring media reaches the backend.
                if camera:
                    def _capture_and_send(evt=event, gps=gps_data.copy(), acc=accel.copy()):
                        snap = camera.capture_snapshot(evt['type'])
                        clip = camera.save_clip(evt['type'], duration_after=5)
                        if snap:
                            print(f"  📷 Snapshot ready: {snap}")
                        if clip:
                            print(f"  📹 Clip ready: {clip}")
                        # Queue the event WITH media paths (DataManager uploads them)
                        send_event(evt, gps, acc, video_path=clip, snapshot_path=snap)
                    threading.Thread(target=_capture_and_send, daemon=True).start()
                else:
                    # No camera — queue event immediately without evidence
                    send_event(event, gps_data, accel)
                
            # --- STATUS UPDATE ---
            if current_time - last_print > 5.0:
                if gps_data.get('has_fix'):
                    gps_status = f'⚠({int(gps_stale_seconds)}s)' if gps_stale_seconds > 5.0 else '✓'
                else:
                    gps_status = '✗'
                cam_status = '✓' if camera else '✗'
                trip_label = '🟢ACTIVE' if trip_active else '⏳STANDBY'
                print(f"[{datetime.now().strftime('%H:%M:%S')}] "
                      f"{trip_label} | "
                      f"Accel X:{accel['x']:.2f}g | "
                      f"Speed: {estimated_speed:.1f} km/h | "
                      f"GPS:{gps_status} Cam:{cam_status} | "
                      f"Events:{events_detected}")
                last_print = current_time
            
            time.sleep(SAMPLE_RATE)
            
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        if mpu: mpu.close()
        if gps: gps.close()
        if camera: camera.close()
        if overtaking_detector: ultrasonic.cleanup()
        data_manager.close()


if __name__ == "__main__":
    main()