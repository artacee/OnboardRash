"""
Tailgating Detection using Camera

Uses computer vision to detect vehicles following too closely behind the bus.
Analyzes the rear-facing camera feed to identify tailgating situations.

Methods:
1. Simple: Object size tracking - if vehicle appears large, it's close
2. Advanced: YOLO object detection + distance estimation (requires Hailo/AI Kit)
"""

import os
import time
import math

# Try to import OpenCV
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("Warning: OpenCV not installed. Run: pip install opencv-python")


class TailgatingDetector:
    """
    Detects tailgating vehicles using rear camera.
    
    Uses a simple but effective approach:
    1. Detect vehicles in frame using contour detection or cascade classifier
    2. Track vehicle size over time
    3. If vehicle occupies large portion of frame → tailgating
    """
    
    # Detection thresholds
    TAILGATE_AREA_PERCENT = 15    # Vehicle covering >15% of frame = tailgating
    WARNING_AREA_PERCENT = 10     # Vehicle covering >10% = warning
    MIN_DETECTION_FRAMES = 5      # Require N consecutive frames
    
    def __init__(self, use_cascade=True):
        """
        Initialize the tailgating detector.
        
        Args:
            use_cascade: Use Haar cascade classifier for vehicle detection
        """
        if not CV2_AVAILABLE:
            print("⚠️ OpenCV not available, tailgating detection disabled")
            return
        
        self.use_cascade = use_cascade
        
        # Load vehicle classifier if available
        self.car_cascade = None
        if use_cascade:
            cascade_path = cv2.data.haarcascades + 'haarcascade_car.xml'
            if os.path.exists(cascade_path):
                self.car_cascade = cv2.CascadeClassifier(cascade_path)
                print("Vehicle cascade classifier loaded")
            else:
                print("⚠️ Car cascade not found, using contour detection")
                self.use_cascade = False
        
        # Tracking state
        self.detection_count = 0
        self.last_detection_time = 0
        self.frame_count = 0
        
        print("Tailgating detector initialized")
    
    def detect_vehicles_cascade(self, frame):
        """Detect vehicles using Haar cascade."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        vehicles = self.car_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=3,
            minSize=(50, 50)
        )
        
        return vehicles
    
    def detect_vehicles_contour(self, frame):
        """
        Detect large objects using contour detection.
        Works for any vehicle type without pre-trained classifier.
        """
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Dilate to connect edges
        kernel = np.ones((5, 5), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours by size
        vehicles = []
        min_area = (frame.shape[0] * frame.shape[1]) * 0.02  # Min 2% of frame
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > min_area:
                x, y, w, h = cv2.boundingRect(contour)
                vehicles.append((x, y, w, h))
        
        return vehicles
    
    def analyze_frame(self, frame):
        """
        Analyze a camera frame for tailgating.
        
        Args:
            frame: Camera frame (numpy array)
            
        Returns:
            dict or None: Event data if tailgating detected
        """
        if not CV2_AVAILABLE or frame is None:
            return None
        
        self.frame_count += 1
        frame_height, frame_width = frame.shape[:2]
        frame_area = frame_width * frame_height
        
        # Detect vehicles
        if self.use_cascade and self.car_cascade is not None:
            vehicles = self.detect_vehicles_cascade(frame)
        else:
            vehicles = self.detect_vehicles_contour(frame)
        
        # Find largest vehicle (closest)
        max_vehicle_area = 0
        max_vehicle = None
        
        for vehicle in vehicles:
            if len(vehicle) == 4:
                x, y, w, h = vehicle
                area = w * h
                if area > max_vehicle_area:
                    max_vehicle_area = area
                    max_vehicle = (x, y, w, h)
        
        # Calculate area percentage
        area_percent = (max_vehicle_area / frame_area) * 100 if max_vehicle_area > 0 else 0
        
        # Check for tailgating
        if area_percent >= self.WARNING_AREA_PERCENT:
            self.detection_count += 1
            
            if self.detection_count >= self.MIN_DETECTION_FRAMES:
                # Determine severity
                if area_percent >= self.TAILGATE_AREA_PERCENT:
                    severity = 'HIGH'
                else:
                    severity = 'MEDIUM'
                
                # Reset counter
                self.detection_count = 0
                self.last_detection_time = time.time()
                
                # Estimate distance (rough approximation)
                # Larger area = closer vehicle
                estimated_distance = max(5, 100 - (area_percent * 3))  # Very rough
                
                return {
                    'type': 'TAILGATING',
                    'severity': severity,
                    'area_percent': round(area_percent, 1),
                    'estimated_distance': round(estimated_distance, 0),
                    'value': round(area_percent, 1)
                }
        else:
            # Reset if no vehicle detected
            self.detection_count = max(0, self.detection_count - 1)
        
        return None
    
    def draw_detections(self, frame, vehicles):
        """Draw detection boxes on frame for debugging."""
        if not CV2_AVAILABLE:
            return frame
        
        for vehicle in vehicles:
            if len(vehicle) == 4:
                x, y, w, h = vehicle
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(frame, "Vehicle", (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        return frame


# Test code
if __name__ == "__main__":
    print("Testing Tailgating Detection...")
    print("-" * 40)
    
    if not CV2_AVAILABLE:
        print("OpenCV not installed. Run: pip install opencv-python")
        exit(1)
    
    detector = TailgatingDetector(use_cascade=False)  # Use contour detection
    
    # Try to open camera
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("No camera available for testing")
        exit(1)
    
    print("Camera opened. Press 'q' to quit.")
    print("Point camera at approaching vehicles to test tailgating detection.")
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Analyze frame
            event = detector.analyze_frame(frame)
            
            if event:
                print(f"🚨 TAILGATING DETECTED! Area: {event['area_percent']}%, "
                      f"Est. Distance: {event['estimated_distance']}m, "
                      f"Severity: {event['severity']}")
                cv2.putText(frame, f"TAILGATING! {event['severity']}", (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            # Show frame
            cv2.imshow('Tailgating Detection', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("\nTest complete")
