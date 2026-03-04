"""
Tailgating Detection using Front Camera

Uses computer vision to detect if the BUS DRIVER is tailgating the vehicle ahead.
Analyzes the front-facing camera feed.

Detection back-ends (in priority order):
1. MobileNet-SSD via OpenCV DNN — real vehicle class detection (~15-20 fps on Pi 5)
2. Contour fallback — used only when model files are missing

Additional features:
- IoU-based same-object tracking across frames (rejects random detections)
- Night Vision Enhancement — Gamma correction for low-light conditions
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

# --- MobileNet-SSD config ---
# Model files (download once to hardware/models/):
#   MobileNetSSD_deploy.prototxt
#   MobileNetSSD_deploy.caffemodel
# Source: https://github.com/chuanqi305/MobileNet-SSD
_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models')
_PROTOTXT   = os.path.join(_MODELS_DIR, 'MobileNetSSD_deploy.prototxt')
_CAFFEMODEL = os.path.join(_MODELS_DIR, 'MobileNetSSD_deploy.caffemodel')

# COCO class IDs that count as "vehicle" in the MobileNet-SSD 20-class VOC model
# 6=bus, 7=car, 14=motorbike (bicycle=2 intentionally excluded)
_VEHICLE_CLASS_IDS = {6, 7, 14}
_DNN_CONFIDENCE_THRESHOLD = 0.5
_DNN_INPUT_SIZE = (300, 300)


class TailgatingDetector:
    """
    Detects if the bus is tailgating the vehicle ahead using front camera.

    Logic:
    1. Preprocess frame (Night Vision enhancement)
    2. Detect vehicles using MobileNet-SSD (or contour fallback)
    3. Track the same vehicle across frames via IoU overlap
    4. If the tracked vehicle covers >10% of frame for 5+ consecutive frames → event
    """

    # Detection thresholds
    TAILGATE_AREA_PERCENT = 15    # Vehicle covering >15% of frame = HIGH
    WARNING_AREA_PERCENT = 10     # Vehicle covering >10% = MEDIUM
    MIN_DETECTION_FRAMES = 5      # Require N consecutive frames with same object
    IOU_THRESHOLD = 0.50          # Min overlap to consider "same vehicle" across frames

    def __init__(self, use_dnn=True):
        """
        Initialize the tailgating detector.

        Args:
            use_dnn: Attempt to load MobileNet-SSD. Falls back to contour if missing.
        """
        if not CV2_AVAILABLE:
            print("⚠️ OpenCV not available, tailgating detection disabled")
            return

        self.use_dnn = False
        self.net = None

        # --- Try MobileNet-SSD ---
        if use_dnn and os.path.isfile(_PROTOTXT) and os.path.isfile(_CAFFEMODEL):
            try:
                self.net = cv2.dnn.readNetFromCaffe(_PROTOTXT, _CAFFEMODEL)
                self.use_dnn = True
                print("✅ MobileNet-SSD vehicle detector loaded")
            except Exception as e:
                print(f"⚠️ Failed to load MobileNet-SSD: {e}")
                print("   Falling back to contour detection")
        else:
            if use_dnn:
                print("⚠️ MobileNet-SSD model files not found in hardware/models/")
                print("   Download MobileNetSSD_deploy.{prototxt,caffemodel} into hardware/models/")
            print("   Using contour-based fallback (higher false-positive rate)")

        # Tracking state
        self.detection_count = 0
        self.last_detection_time = 0
        self.frame_count = 0
        self.prev_bbox = None  # (x, y, w, h) of last tracked vehicle

        print("Tailgating detector initialized"
              f" ({'DNN' if self.use_dnn else 'contour'} mode)")

    # ─── Vehicle detection backends ───────────────────────────────────────────

    def detect_vehicles_dnn(self, frame):
        """Detect vehicles using MobileNet-SSD via OpenCV DNN."""
        h, w = frame.shape[:2]
        blob = cv2.dnn.blobFromImage(
            cv2.resize(frame, _DNN_INPUT_SIZE),
            0.007843,            # scale
            _DNN_INPUT_SIZE,
            127.5                # mean subtraction
        )
        self.net.setInput(blob)
        detections = self.net.forward()

        vehicles = []
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            class_id   = int(detections[0, 0, i, 1])

            if confidence > _DNN_CONFIDENCE_THRESHOLD and class_id in _VEHICLE_CLASS_IDS:
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                x1, y1, x2, y2 = box.astype("int")
                x1, y1 = max(0, x1), max(0, y1)
                bw, bh = x2 - x1, y2 - y1
                if bw > 0 and bh > 0:
                    vehicles.append((x1, y1, bw, bh))

        return vehicles

    def detect_vehicles_contour(self, frame):
        """
        Fallback: detect large objects using contour detection.
        Higher false-positive rate than DNN — use only when model files are absent.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)

        kernel = np.ones((5, 5), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=2)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        vehicles = []
        min_area = (frame.shape[0] * frame.shape[1]) * 0.02

        for contour in contours:
            area = cv2.contourArea(contour)
            if area > min_area:
                x, y, w, h = cv2.boundingRect(contour)
                vehicles.append((x, y, w, h))

        return vehicles

    # ─── Helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _iou(boxA, boxB):
        """Compute Intersection-over-Union between two (x,y,w,h) boxes."""
        ax1, ay1, aw, ah = boxA
        bx1, by1, bw, bh = boxB

        ax2, ay2 = ax1 + aw, ay1 + ah
        bx2, by2 = bx1 + bw, by1 + bh

        inter_x1 = max(ax1, bx1)
        inter_y1 = max(ay1, by1)
        inter_x2 = min(ax2, bx2)
        inter_y2 = min(ay2, by2)

        inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
        union_area = (aw * ah) + (bw * bh) - inter_area

        return inter_area / union_area if union_area > 0 else 0.0

    def preprocess_for_night(self, frame):
        """Gamma-correct dark frames for better detection (uses precomputed LUT)."""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        brightness = hsv[..., 2].mean()

        if brightness < 60 and self._gamma_lut is not None:
            return cv2.LUT(frame, self._gamma_lut)

        return frame

    # ─── Main analysis ────────────────────────────────────────────────────────

    def analyze_frame(self, frame):
        """
        Analyze a camera frame for tailgating.

        Args:
            frame: Camera frame (numpy array), ideally resized to 640×480 before calling

        Returns:
            dict or None: Event data if tailgating detected
        """
        if not CV2_AVAILABLE or frame is None:
            return None

        self.frame_count += 1
        frame_height, frame_width = frame.shape[:2]
        frame_area = frame_width * frame_height

        # 1. Night Vision Enhancement
        processed_frame = self.preprocess_for_night(frame)

        # 2. Detect vehicles
        if self.use_dnn and self.net is not None:
            vehicles = self.detect_vehicles_dnn(processed_frame)
        else:
            vehicles = self.detect_vehicles_contour(processed_frame)

        # 3. Find largest vehicle (closest to camera)
        max_vehicle_area = 0
        max_vehicle = None

        for vehicle in vehicles:
            if len(vehicle) == 4:
                x, y, w, h = vehicle
                area = w * h
                if area > max_vehicle_area:
                    max_vehicle_area = area
                    max_vehicle = (x, y, w, h)

        area_percent = (max_vehicle_area / frame_area) * 100 if max_vehicle_area > 0 else 0

        # 4. IoU-based same-object tracking
        if area_percent >= self.WARNING_AREA_PERCENT and max_vehicle is not None:
            # Only count if it's the SAME vehicle as last frame (or first sighting)
            if self.prev_bbox is None or self._iou(max_vehicle, self.prev_bbox) >= self.IOU_THRESHOLD:
                self.detection_count += 1
            else:
                # Different object — reset streak
                self.detection_count = 1

            self.prev_bbox = max_vehicle

            if self.detection_count >= self.MIN_DETECTION_FRAMES:
                severity = 'HIGH' if area_percent >= self.TAILGATE_AREA_PERCENT else 'MEDIUM'

                self.detection_count = 0
                self.last_detection_time = time.time()

                estimated_distance = max(5, 100 - (area_percent * 3))

                return {
                    'type': 'TAILGATING',
                    'severity': severity,
                    'area_percent': round(area_percent, 1),
                    'estimated_distance': round(estimated_distance, 0),
                    'value': round(area_percent, 1)
                }
        else:
            # No vehicle in warning zone — decay counter
            self.detection_count = max(0, self.detection_count - 1)
            if self.detection_count == 0:
                self.prev_bbox = None

        return None

    def draw_detections(self, frame, vehicles):
        """Draw detection boxes on frame for debugging."""
        if not CV2_AVAILABLE:
            return frame

        for vehicle in vehicles:
            if len(vehicle) == 4:
                x, y, w, h = vehicle
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, "Vehicle", (x, y - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        return frame


# ─── Quick test ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Testing Tailgating Detection...")
    print("-" * 40)

    if not CV2_AVAILABLE:
        print("OpenCV not installed. Run: pip install opencv-python")
        exit(1)

    detector = TailgatingDetector(use_dnn=True)

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

            event = detector.analyze_frame(frame)

            if event:
                print(f"🚨 TAILGATING DETECTED! Area: {event['area_percent']}%, "
                      f"Est. Distance: {event['estimated_distance']}m, "
                      f"Severity: {event['severity']}")
                cv2.putText(frame, f"TAILGATING! {event['severity']}", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Tailgating Detection', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("\nTest complete")
