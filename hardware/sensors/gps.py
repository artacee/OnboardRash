"""
GPS Module Driver for Raspberry Pi

Reads GPS data (latitude, longitude, speed) from a NEO-6M or similar GPS module.
Uses NMEA sentences over serial UART connection.

Connections:
- VCC → 5V (Pin 4)
- GND → GND (Pin 6)
- TX  → GPIO15/RX (Pin 10)
- RX  → GPIO14/TX (Pin 8)
"""

import serial
import time

# Default serial port for Raspberry Pi
DEFAULT_PORT = '/dev/serial0'
DEFAULT_BAUD = 9600


class GPSModule:
    """Driver for NEO-6M GPS module using NMEA protocol."""
    
    def __init__(self, port=DEFAULT_PORT, baudrate=DEFAULT_BAUD):
        """Initialize the GPS module."""
        self.serial = serial.Serial(
            port=port,
            baudrate=baudrate,
            timeout=1
        )
        
        self.latitude = None
        self.longitude = None
        self.speed = None  # km/h
        self.altitude = None
        self.satellites = 0
        self.fix_quality = 0
        self.timestamp = None
        
        print("GPS Module Connected")
    
    def _parse_nmea(self, sentence):
        """Parse an NMEA sentence and extract data."""
        try:
            parts = sentence.split(',')
            
            # GGA - Fix data
            if sentence.startswith('$GPGGA') or sentence.startswith('$GNGGA'):
                if len(parts) >= 10:
                    self.fix_quality = int(parts[6]) if parts[6] else 0
                    self.satellites = int(parts[7]) if parts[7] else 0
                    
                    if parts[2] and parts[4]:  # Has valid position
                        self.latitude = self._parse_coordinate(parts[2], parts[3])
                        self.longitude = self._parse_coordinate(parts[4], parts[5])
                    
                    if parts[9]:
                        self.altitude = float(parts[9])
            
            # RMC - Recommended Minimum
            elif sentence.startswith('$GPRMC') or sentence.startswith('$GNRMC'):
                if len(parts) >= 8:
                    if parts[2] == 'A':  # Active (valid fix)
                        if parts[3] and parts[5]:
                            self.latitude = self._parse_coordinate(parts[3], parts[4])
                            self.longitude = self._parse_coordinate(parts[5], parts[6])
                        
                        if parts[7]:
                            # Speed in knots, convert to km/h
                            self.speed = float(parts[7]) * 1.852
            
            # VTG - Velocity
            elif sentence.startswith('$GPVTG') or sentence.startswith('$GNVTG'):
                if len(parts) >= 8 and parts[7]:
                    self.speed = float(parts[7])  # Already in km/h
                    
        except (ValueError, IndexError) as e:
            pass  # Ignore parsing errors
    
    def _parse_coordinate(self, value, direction):
        """Convert NMEA coordinate (DDMM.MMMM) to decimal degrees."""
        if not value:
            return None
        
        # NMEA format: DDMM.MMMM for lat, DDDMM.MMMM for lon
        if len(value) > 10:  # Longitude
            degrees = float(value[:3])
            minutes = float(value[3:])
        else:  # Latitude
            degrees = float(value[:2])
            minutes = float(value[2:])
        
        decimal = degrees + (minutes / 60)
        
        if direction in ['S', 'W']:
            decimal = -decimal
        
        return round(decimal, 6)
    
    def read(self):
        """
        Read and parse GPS data.
        
        Returns:
            dict: GPS data including lat, lng, speed, satellites
        """
        try:
            # Read available lines
            for _ in range(10):  # Read up to 10 lines
                line = self.serial.readline().decode('ascii', errors='ignore').strip()
                if line.startswith('$'):
                    self._parse_nmea(line)
        except Exception as e:
            pass
        
        return {
            'latitude': self.latitude,
            'longitude': self.longitude,
            'speed': round(self.speed, 1) if self.speed else None,
            'altitude': self.altitude,
            'satellites': self.satellites,
            'fix_quality': self.fix_quality,
            'has_fix': self.fix_quality > 0
        }
    
    def wait_for_fix(self, timeout=60):
        """
        Wait for GPS to get a valid fix.
        
        Args:
            timeout: Maximum seconds to wait
            
        Returns:
            bool: True if fix obtained, False if timeout
        """
        print("Waiting for GPS fix...")
        start = time.time()
        
        while time.time() - start < timeout:
            data = self.read()
            if data['has_fix']:
                print(f"GPS Fix obtained! Satellites: {data['satellites']}")
                return True
            time.sleep(1)
        
        print("GPS fix timeout")
        return False
    
    def close(self):
        """Close the serial connection."""
        self.serial.close()


# Test code
if __name__ == "__main__":
    print("Testing GPS Module...")
    print("-" * 40)
    
    try:
        gps = GPSModule()
        
        # Wait for initial fix
        gps.wait_for_fix(timeout=30)
        
        while True:
            data = gps.read()
            
            if data['has_fix']:
                print(f"Position: {data['latitude']}, {data['longitude']}")
                print(f"Speed: {data['speed']} km/h")
                print(f"Satellites: {data['satellites']}")
            else:
                print("No GPS fix yet...")
            
            print("-" * 40)
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\nStopped")
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure serial is enabled and GPS module is connected correctly.")
