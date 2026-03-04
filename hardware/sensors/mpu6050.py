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

    # EMA smoothing factor: 0.3 at 10 Hz ≈ 0.3 s time constant.
    # Filters road vibration / pothole spikes while keeping real events responsive.
    EMA_ALPHA = 0.3

    # Number of samples to average during startup calibration
    CALIBRATION_SAMPLES = 50
    
    def __init__(self, bus_num=1, address=MPU_ADDR):
        """Initialize the MPU-6050 sensor."""
        self.bus = smbus2.SMBus(bus_num)
        self.address = address
        
        # Wake up the sensor (it starts in sleep mode)
        self.bus.write_byte_data(self.address, PWR_MGMT_1, 0x00)
        time.sleep(0.1)

        # --- Startup calibration with stability check ---
        # Average N samples while stationary to find zero-offset bias.
        # The bus MUST be still during this ~1 s window.
        # If motion is detected (high variance), retries up to 5 times.
        print("")
        print("="*55)
        print("📏  IMU SENSOR CALIBRATION")
        print("="*55)
        print("  Mount the sensor FLAT on the dashboard or under a seat.")
        print("  Align the X-axis arrow (or long edge of board) with the")
        print("  FORWARD direction of the bus.")
        print("")
        print("  • Keep the bus COMPLETELY STILL")
        print("  • Engine may be running (vibration is filtered)")
        print("  • Calibrating in ~1 second...")
        print("-"*55)
        MAX_CAL_RETRIES = 5
        VARIANCE_LIMIT = 0.003  # ~0.055 g standard deviation

        for attempt in range(1, MAX_CAL_RETRIES + 1):
            sum_x, sum_y, sum_z = 0.0, 0.0, 0.0
            sum_x2, sum_y2 = 0.0, 0.0
            for _ in range(self.CALIBRATION_SAMPLES):
                raw = self._burst_read_accel()
                gx = raw[0] / ACCEL_SCALE
                gy = raw[1] / ACCEL_SCALE
                gz = raw[2] / ACCEL_SCALE
                sum_x += gx; sum_y += gy; sum_z += gz
                sum_x2 += gx * gx; sum_y2 += gy * gy
                time.sleep(0.02)  # ~50 Hz sampling for cal

            n = self.CALIBRATION_SAMPLES
            mean_x, mean_y = sum_x / n, sum_y / n
            var_x = sum_x2 / n - mean_x ** 2
            var_y = sum_y2 / n - mean_y ** 2

            if var_x < VARIANCE_LIMIT and var_y < VARIANCE_LIMIT:
                # Stable — store offsets
                self.offset_x = mean_x
                self.offset_y = mean_y
                self.offset_z = (sum_z / n) - 1.0  # subtract expected 1 g on Z
                break
            else:
                print(f"  ⚠️  Attempt {attempt}/{MAX_CAL_RETRIES}: motion detected "
                      f"(var_x={var_x:.5f}, var_y={var_y:.5f})")
                if attempt < MAX_CAL_RETRIES:
                    print("      Retrying in 1 s — keep bus stationary!")
                    time.sleep(1)
                else:
                    print("  ⚠️  Max calibration retries reached. Using last values.")
                    self.offset_x = mean_x
                    self.offset_y = mean_y
                    self.offset_z = (sum_z / n) - 1.0

        # EMA state (initialised on first real read)
        self.ema_x = None
        self.ema_y = None
        self.ema_z = None

        # --- Post-calibration placement validation ---
        mean_z = self.offset_z + 1.0  # undo the -1.0 to get raw mean Z in g
        tilt_g = math.sqrt(self.offset_x ** 2 + self.offset_y ** 2)
        tilt_deg = math.degrees(math.asin(min(1.0, tilt_g)))

        placement_ok = True
        if tilt_deg > 10:
            placement_ok = False
            print(f"")
            print(f"  ❌ SENSOR TILTED ~{tilt_deg:.0f}° — readings will be inaccurate!")
            print(f"     Gravity is leaking into X/Y axes.")
            print(f"     Fix: Mount the board FLAT (parallel to ground).")
        if abs(mean_z) < 0.8:
            placement_ok = False
            print(f"")
            print(f"  ❌ SENSOR UPSIDE DOWN or VERTICAL (Z={mean_z:+.2f}g, expected ~+1.0g)")
            print(f"     Fix: Flip the board so the chip faces UP.")
        if abs(self.offset_x) > 0.08 and abs(self.offset_y) < abs(self.offset_x) * 0.5:
            print(f"")
            print(f"  ⚠️  X-axis offset is high ({self.offset_x:+.3f}g).")
            print(f"     The sensor may be rotated vs bus forward direction.")
            print(f"     Tip: Set MOUNT_ORIENTATION in .env if board is rotated 90°.")

        if placement_ok:
            print(f"  ✅ Sensor placement looks correct (tilt: {tilt_deg:.1f}°)")

        print(f"  Offsets: X={self.offset_x:+.4f}  Y={self.offset_y:+.4f}  Z={self.offset_z:+.4f}")
        print("="*55 + "\n")

    # ─── Low-level helpers ────────────────────────────────────────────────

    def _burst_read_accel(self):
        """Read 6 contiguous bytes (XH,XL,YH,YL,ZH,ZL) in one I2C transaction."""
        data = self.bus.read_i2c_block_data(self.address, ACCEL_XOUT_H, 6)
        raw_x = self._to_signed((data[0] << 8) | data[1])
        raw_y = self._to_signed((data[2] << 8) | data[3])
        raw_z = self._to_signed((data[4] << 8) | data[5])
        return raw_x, raw_y, raw_z

    def _burst_read_gyro(self):
        """Read 6 contiguous bytes for gyroscope in one I2C transaction."""
        data = self.bus.read_i2c_block_data(self.address, GYRO_XOUT_H, 6)
        raw_x = self._to_signed((data[0] << 8) | data[1])
        raw_y = self._to_signed((data[2] << 8) | data[3])
        raw_z = self._to_signed((data[4] << 8) | data[5])
        return raw_x, raw_y, raw_z

    @staticmethod
    def _to_signed(value):
        """Convert a 16-bit unsigned int to a signed int."""
        if value >= 0x8000:
            value = -((65535 - value) + 1)
        return value
    
    def _read_word(self, reg):
        """Read a 16-bit signed value from two consecutive registers (legacy)."""
        high = self.bus.read_byte_data(self.address, reg)
        low = self.bus.read_byte_data(self.address, reg + 1)
        value = (high << 8) + low
        if value >= 0x8000:
            value = -((65535 - value) + 1)
        return value

    # ─── EMA helper ───────────────────────────────────────────────────────

    def _apply_ema(self, raw_x, raw_y, raw_z):
        """Apply single-pole exponential moving average to each axis."""
        a = self.EMA_ALPHA
        if self.ema_x is None:                # first sample — seed the filter
            self.ema_x, self.ema_y, self.ema_z = raw_x, raw_y, raw_z
        else:
            self.ema_x = a * raw_x + (1 - a) * self.ema_x
            self.ema_y = a * raw_y + (1 - a) * self.ema_y
            self.ema_z = a * raw_z + (1 - a) * self.ema_z
        return self.ema_x, self.ema_y, self.ema_z

    # ─── Public API ───────────────────────────────────────────────────────

    def read_acceleration(self):
        """
        Read acceleration values from the sensor.
        
        Returns calibrated, EMA-filtered g-force values.
        X = forward/backward, Y = left/right, Z = up/down (≈0 when flat & still).
        """
        raw_x, raw_y, raw_z = self._burst_read_accel()
        
        # Convert to g-force and subtract calibration offsets
        gx = raw_x / ACCEL_SCALE - self.offset_x
        gy = raw_y / ACCEL_SCALE - self.offset_y
        gz = raw_z / ACCEL_SCALE - self.offset_z
        
        # Smooth with EMA to reject pothole / vibration spikes
        fx, fy, fz = self._apply_ema(gx, gy, gz)
        
        return {
            'x': round(fx, 3),
            'y': round(fy, 3),
            'z': round(fz, 3)
        }
    
    def read_gyroscope(self):
        """
        Read gyroscope values from the sensor.
        
        Returns:
            dict: Angular velocity in degrees/second for X, Y, Z axes
        """
        raw_x, raw_y, raw_z = self._burst_read_gyro()
        
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
