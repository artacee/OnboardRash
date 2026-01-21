"""
MPU-6050 IMU Sensor Driver for Raspberry Pi

Reads acceleration and gyroscope data from the MPU-6050 sensor.
Used for detecting harsh braking, acceleration, and aggressive turns.

Connections:
- VCC → 5V (Pin 4)
- GND → GND (Pin 6)
- SDA → GPIO2 (Pin 3)
- SCL → GPIO3 (Pin 5)
"""

import smbus2
import time
import math

# MPU-6050 Register Addresses
MPU_ADDR = 0x68
PWR_MGMT_1 = 0x6B
ACCEL_XOUT_H = 0x3B
GYRO_XOUT_H = 0x43

# Sensitivity scale factors
ACCEL_SCALE = 16384.0  # For ±2g range
GYRO_SCALE = 131.0     # For ±250°/s range

# Gravity constant
GRAVITY = 9.80665


class MPU6050:
    """Driver for MPU-6050 6-axis IMU sensor."""
    
    def __init__(self, bus_num=1, address=MPU_ADDR):
        """Initialize the MPU-6050 sensor."""
        self.bus = smbus2.SMBus(bus_num)
        self.address = address
        
        # Wake up the sensor (it starts in sleep mode)
        self.bus.write_byte_data(self.address, PWR_MGMT_1, 0x00)
        time.sleep(0.1)
        
        print("MPU-6050 Initialized")
    
    def _read_word(self, reg):
        """Read a 16-bit signed value from two consecutive registers."""
        high = self.bus.read_byte_data(self.address, reg)
        low = self.bus.read_byte_data(self.address, reg + 1)
        value = (high << 8) + low
        
        # Convert to signed value
        if value >= 0x8000:
            value = -((65535 - value) + 1)
        
        return value
    
    def read_acceleration(self):
        """
        Read acceleration values from the sensor.
        
        Returns:
            dict: Acceleration in g-force for X, Y, Z axes
        """
        raw_x = self._read_word(ACCEL_XOUT_H)
        raw_y = self._read_word(ACCEL_XOUT_H + 2)
        raw_z = self._read_word(ACCEL_XOUT_H + 4)
        
        # Convert to g-force
        accel_x = raw_x / ACCEL_SCALE
        accel_y = raw_y / ACCEL_SCALE
        accel_z = raw_z / ACCEL_SCALE
        
        return {
            'x': round(accel_x, 3),
            'y': round(accel_y, 3),
            'z': round(accel_z, 3)
        }
    
    def read_gyroscope(self):
        """
        Read gyroscope values from the sensor.
        
        Returns:
            dict: Angular velocity in degrees/second for X, Y, Z axes
        """
        raw_x = self._read_word(GYRO_XOUT_H)
        raw_y = self._read_word(GYRO_XOUT_H + 2)
        raw_z = self._read_word(GYRO_XOUT_H + 4)
        
        # Convert to degrees/second
        gyro_x = raw_x / GYRO_SCALE
        gyro_y = raw_y / GYRO_SCALE
        gyro_z = raw_z / GYRO_SCALE
        
        return {
            'x': round(gyro_x, 2),
            'y': round(gyro_y, 2),
            'z': round(gyro_z, 2)
        }
    
    def read_all(self):
        """
        Read all sensor data at once.
        
        Returns:
            dict: Both acceleration and gyroscope data
        """
        return {
            'acceleration': self.read_acceleration(),
            'gyroscope': self.read_gyroscope()
        }
    
    def close(self):
        """Close the I2C bus connection."""
        self.bus.close()


# Test code
if __name__ == "__main__":
    print("Testing MPU-6050 Sensor...")
    print("-" * 40)
    
    try:
        mpu = MPU6050()
        
        while True:
            accel = mpu.read_acceleration()
            gyro = mpu.read_gyroscope()
            
            print(f"Accel: X={accel['x']:+.2f}g, Y={accel['y']:+.2f}g, Z={accel['z']:+.2f}g")
            print(f"Gyro:  X={gyro['x']:+.1f}°/s, Y={gyro['y']:+.1f}°/s, Z={gyro['z']:+.1f}°/s")
            print("-" * 40)
            
            time.sleep(0.5)
            
    except KeyboardInterrupt:
        print("\nStopped")
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure I2C is enabled and MPU-6050 is connected correctly.")
