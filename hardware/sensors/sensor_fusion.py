"""
Sensor Fusion Module using Kalman Filter.

Fuses data from:
1. GPS (Speed measurement, slow update rate, potentially noisy or lagging)
2. MPU-6050 Accelerometer (Acceleration, fast update rate, noisy)

Purpose:
Provides a smooth and accurate estimate of vehicle speed and status,
crucial for differentiating between "stopped in traffic" vs "parked".

Mathematical Model (1D Kalman Filter for Speed):
State: [Velocity]
Prediction: V_new = V_old + (Acceleration * dt)
Update: Correct prediction using GPS Speed measurement
"""

import time

class KalmanFilter:
    def __init__(self, initial_speed=0.0, process_noise=0.1, measurement_noise=2.0):
        """
        Initialize 1D Kalman Filter for speed estimation.
        
        Args:
            initial_speed: Starting speed in km/h
            process_noise (Q): Uncertainty in the process (acceleration noise)
            measurement_noise (R): Uncertainty in measurement (GPS noise)
        """
        self.velocity = initial_speed  # State estimate
        self.uncertainty = 5.0         # Initial uncertainty (P)
        
        self.Q = process_noise  # Process noise covariance
        self.R = measurement_noise  # Measurement noise covariance
        
        self.last_time = time.time()

    def predict(self, acceleration_x_g):
        """
        Prediction Step (Time Update).
        Uses IMU acceleration to predict the next speed.
        
        Args:
            acceleration_x_g: Forward acceleration in G-force
        """
        current_time = time.time()
        dt = current_time - self.last_time
        self.last_time = current_time
        
        # Convert G-force to km/h/s
        # 1g = 9.8 m/s^2
        # m/s to km/h = * 3.6
        # So 1g approx 35.28 km/h/s
        accel_kmh_s = acceleration_x_g * 9.81 * 3.6
        
        # State Extrapolation Equation: x_k = x_{k-1} + u_{k-1}
        self.velocity = self.velocity + (accel_kmh_s * dt)
        
        # Protect against negative speed (bus doesn't reverse much in this context)
        # But allow small negatives for jitter, though typically we clamp to 0 physically
        # simplified:
        if self.velocity < 0:
             self.velocity = 0
             
        # Covariance Extrapolation Equation: P_k = P_{k-1} + Q
        # Uncertainty increases because we are predicting blindly
        self.uncertainty = self.uncertainty + (self.Q * dt)
        
        return self.velocity

    def update(self, gps_speed):
        """
        Update Step (Measurement Update).
        Corrects the prediction using actual GPS measurement.
        
        Args:
            gps_speed: Speed from GPS in km/h
        """
        if gps_speed is None:
            return self.velocity
            
        # Kalman Gain Calculation: K = P / (P + R)
        kalman_gain = self.uncertainty / (self.uncertainty + self.R)
        
        # State Update Equation: x = x + K(z - x)
        measurement_residual = gps_speed - self.velocity
        self.velocity = self.velocity + (kalman_gain * measurement_residual)
        
        # Covariance Update Equation: P = (1 - K)P
        self.uncertainty = (1 - kalman_gain) * self.uncertainty
        
        return self.velocity

    def get_speed(self):
        """Get current filtered speed estimate."""
        return self.velocity
