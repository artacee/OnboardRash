"""
Phone GPS Receiver — Drop-in replacement for NEO-6M serial GPS.

Runs a tiny Flask server on a configurable port (default 8081) that accepts
GPS POSTs from the Driver Companion App running on the driver's phone.

Exposes the exact same .read() interface as GPSModule, so main_pi.py can
swap between hardware GPS and phone GPS with zero logic changes.

The phone connects to the Pi via WiFi hotspot:
  Phone (hotspot) <--WiFi--> Pi (client)
  Phone POSTs to http://<pi_ip>:8081/gps every 500ms

Usage:
    gps = PhoneGPSReceiver(port=8081)
    data = gps.read()  # Same dict format as GPSModule
"""

from flask import Flask, request, jsonify
import threading
import time
import logging


class PhoneGPSReceiver:
    """Receives GPS data from phone app over local HTTP."""
    
    def __init__(self, port=8081):
        self.port = port
        self.latitude = None
        self.longitude = None
        self.speed = None
        self.heading = None
        self.accuracy = None
        self.last_update = 0
        self._update_count = 0
        
        self._start_server()
        print(f"📱 Phone GPS Receiver started on port {self.port}")
        print(f"   Waiting for phone app to connect...")
    
    def _start_server(self):
        """Start local HTTP server in a background daemon thread."""
        app = Flask(__name__)
        
        # Suppress Flask request logs to keep Pi console clean
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)
        
        @app.route('/gps', methods=['POST'])
        def receive_gps():
            data = request.get_json(silent=True)
            if not data:
                return jsonify({'error': 'No JSON data'}), 400
            
            self.latitude = data.get('latitude')
            self.longitude = data.get('longitude')
            self.speed = data.get('speed')
            self.heading = data.get('heading')
            self.accuracy = data.get('accuracy')
            self.last_update = time.time()
            self._update_count += 1
            
            # Print first reception and then every 100th
            if self._update_count == 1:
                print(f"📱 First GPS data received from phone!")
                print(f"   Position: {self.latitude}, {self.longitude}")
            
            return jsonify({'status': 'ok'})
        
        @app.route('/health', methods=['GET'])
        def health():
            age = time.time() - self.last_update if self.last_update else None
            return jsonify({
                'status': 'ok',
                'has_data': self.last_update > 0,
                'age_seconds': round(age, 1) if age else None,
                'update_count': self._update_count,
                'position': {
                    'lat': self.latitude,
                    'lng': self.longitude,
                    'speed': self.speed,
                } if self.latitude else None,
            })
        
        thread = threading.Thread(
            target=lambda: app.run(
                host='0.0.0.0',
                port=self.port,
                debug=False,
                use_reloader=False,
            ),
            daemon=True
        )
        thread.start()
    
    def read(self):
        """
        Read GPS data (same interface as GPSModule.read()).
        
        Returns:
            dict: GPS data matching GPSModule format:
                - latitude, longitude, speed, altitude
                - satellites, fix_quality, has_fix
        """
        # Consider data stale if no update in 5 seconds
        stale = (time.time() - self.last_update) > 5.0 if self.last_update else True
        has_fix = (not stale) and (self.latitude is not None)
        
        return {
            'latitude': self.latitude,
            'longitude': self.longitude,
            'speed': round(self.speed, 1) if self.speed is not None else None,
            'altitude': None,          # Phone could provide this, but not needed
            'satellites': None,         # Not available from phone API
            'fix_quality': 1 if has_fix else 0,
            'has_fix': has_fix,
        }
    
    def close(self):
        """No explicit cleanup needed — Flask server dies with daemon thread."""
        pass


# ==================== STANDALONE TEST ====================
if __name__ == '__main__':
    import json
    
    print("Testing PhoneGPSReceiver...")
    print("-" * 40)
    print("Server will start on port 8081.")
    print("Send a test POST with:")
    print('  curl -X POST http://localhost:8081/gps \\')
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"latitude": 8.89, "longitude": 76.61, "speed": 45.0}\'')
    print("-" * 40)
    
    gps = PhoneGPSReceiver(port=8081)
    
    try:
        while True:
            data = gps.read()
            status = "✅ FIX" if data['has_fix'] else "❌ NO FIX"
            if data['has_fix']:
                print(f"[{status}] Lat:{data['latitude']} Lng:{data['longitude']} "
                      f"Speed:{data['speed']} km/h")
            else:
                print(f"[{status}] Waiting for phone GPS data...")
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nStopped")
