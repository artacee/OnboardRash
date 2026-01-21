"""
Ultrasonic Sensor Driver for Raspberry Pi

Detects nearby vehicles for close overtaking detection.
Uses HC-SR04 ultrasonic distance sensor.

For LEFT side detection (close overtaking):
- Mount sensor on left side of bus, facing outward
- Detects vehicles attempting unsafe overtaking

Connections:
- VCC → 5V (Pin 2)
- GND → GND (Pin 6)
- TRIG → GPIO23 (Pin 16)
- ECHO → GPIO24 (Pin 18) [Use voltage divider!]

IMPORTANT: Echo pin returns 5V but Pi GPIO is 3.3V tolerant!
Use voltage divider: ECHO → 1kΩ → GPIO24, GPIO24 → 2kΩ → GND
"""

import time
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False
    print("Warning: RPi.GPIO not available (not on Raspberry Pi)")


# Default GPIO pins
DEFAULT_TRIG = 23
DEFAULT_ECHO = 24

# Speed of sound in cm/s at room temperature
SPEED_OF_SOUND = 34300


class UltrasonicSensor:
    """Driver for HC-SR04 ultrasonic distance sensor."""
    
    def __init__(self, trig_pin=DEFAULT_TRIG, echo_pin=DEFAULT_ECHO, name="ultrasonic"):
        """
        Initialize the ultrasonic sensor.
        
        Args:
            trig_pin: GPIO pin for trigger
            echo_pin: GPIO pin for echo
            name: Sensor name for identification
        """
        self.trig_pin = trig_pin
        self.echo_pin = echo_pin
        self.name = name
        
        if not GPIO_AVAILABLE:
            print(f"⚠️ {name}: GPIO not available, using simulation mode")
            return
        
        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.trig_pin, GPIO.OUT)
        GPIO.setup(self.echo_pin, GPIO.IN)
        
        # Initialize trigger to low
        GPIO.output(self.trig_pin, False)
        time.sleep(0.1)
        
        print(f"Ultrasonic sensor '{name}' initialized (TRIG={trig_pin}, ECHO={echo_pin})")
    
    def measure_distance(self, timeout=0.1):
        """
        Measure distance to nearest object.
        
        Args:
            timeout: Maximum time to wait for echo
            
        Returns:
            float: Distance in centimeters, or None if timeout
        """
        if not GPIO_AVAILABLE:
            # Simulation mode - return random distance
            import random
            return random.uniform(50, 300)
        
        try:
            # Send trigger pulse (10µs)
            GPIO.output(self.trig_pin, True)
            time.sleep(0.00001)
            GPIO.output(self.trig_pin, False)
            
            # Wait for echo start
            pulse_start = time.time()
            timeout_start = pulse_start
            
            while GPIO.input(self.echo_pin) == 0:
                pulse_start = time.time()
                if pulse_start - timeout_start > timeout:
                    return None
            
            # Wait for echo end
            pulse_end = time.time()
            
            while GPIO.input(self.echo_pin) == 1:
                pulse_end = time.time()
                if pulse_end - pulse_start > timeout:
                    return None
            
            # Calculate distance
            pulse_duration = pulse_end - pulse_start
            distance = (pulse_duration * SPEED_OF_SOUND) / 2
            
            return round(distance, 1)
            
        except Exception as e:
            print(f"Measurement error: {e}")
            return None
    
    def is_object_close(self, threshold_cm=100):
        """
        Check if an object is within the threshold distance.
        
        Args:
            threshold_cm: Distance threshold in centimeters
            
        Returns:
            tuple: (is_close: bool, distance: float or None)
        """
        distance = self.measure_distance()
        if distance is None:
            return (False, None)
        return (distance < threshold_cm, distance)
    
    def cleanup(self):
        """Clean up GPIO."""
        if GPIO_AVAILABLE:
            GPIO.cleanup([self.trig_pin, self.echo_pin])


class OvertakingDetector:
    """
    Detects unsafe close overtaking using left-side ultrasonic sensor.
    
    When a vehicle passes too close on the left side, it's flagged
    as a dangerous overtaking event.
    """
    
    # Detection parameters
    CLOSE_DISTANCE_CM = 100      # Very close - HIGH severity
    WARNING_DISTANCE_CM = 150    # Warning zone - MEDIUM severity
    MIN_DETECTION_TIME = 0.5     # Minimum time object must be present
    
    def __init__(self, sensor):
        """
        Initialize the overtaking detector.
        
        Args:
            sensor: UltrasonicSensor instance
        """
        self.sensor = sensor
        self.detection_start = None
        self.last_detection = None
    
    def analyze(self):
        """
        Analyze sensor data for close overtaking.
        
        Returns:
            dict or None: Event data if close overtaking detected
        """
        distance = self.sensor.measure_distance()
        
        if distance is None:
            self.detection_start = None
            return None
        
        # Check if object is in warning/danger zone
        if distance < self.WARNING_DISTANCE_CM:
            current_time = time.time()
            
            # Start detection timer
            if self.detection_start is None:
                self.detection_start = current_time
                return None
            
            # Check if detection is long enough
            detection_duration = current_time - self.detection_start
            
            if detection_duration >= self.MIN_DETECTION_TIME:
                # Determine severity
                if distance < self.CLOSE_DISTANCE_CM:
                    severity = 'HIGH'
                else:
                    severity = 'MEDIUM'
                
                # Reset detection
                self.detection_start = None
                
                return {
                    'type': 'CLOSE_OVERTAKING',
                    'severity': severity,
                    'distance': distance,
                    'value': distance
                }
        else:
            # No object in zone, reset
            self.detection_start = None
        
        return None


# Test code
if __name__ == "__main__":
    print("Testing Ultrasonic Sensor...")
    print("-" * 40)
    
    sensor = UltrasonicSensor(name="left_side")
    detector = OvertakingDetector(sensor)
    
    try:
        while True:
            distance = sensor.measure_distance()
            
            if distance:
                status = "⚠️ CLOSE!" if distance < 100 else "✓ Clear"
                print(f"Distance: {distance:.1f} cm - {status}")
            else:
                print("No reading (out of range)")
            
            # Check for overtaking event
            event = detector.analyze()
            if event:
                print(f"🚨 CLOSE OVERTAKING DETECTED! Distance: {event['distance']}cm")
            
            time.sleep(0.2)
            
    except KeyboardInterrupt:
        print("\nStopped")
    finally:
        sensor.cleanup()
