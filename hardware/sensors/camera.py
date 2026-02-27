"""
Camera Module Driver — USB Webcam.

Optimised for Raspberry Pi 5 + USB webcam (720p @ 30fps).
Uses a single reader thread to avoid frame access races.
"""

import os
import time
import threading
from datetime import datetime

# OpenCV (USB webcam)
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("Warning: OpenCV not installed. Run: pip install opencv-python-headless")


class CameraModule:
    """
    Camera driver for video evidence capture via USB webcam.

    Backend: USB webcam via OpenCV (works on Pi 5 and Pi 4).
    """

    # Pi 5 with 720p webcam sweet spot — fast enough for CV, light on memory
    DEFAULT_RESOLUTION = (1280, 720)
    DEFAULT_FPS = 30

    def __init__(
        self,
        output_dir: str = "recordings",
        resolution: tuple = DEFAULT_RESOLUTION,
        fps: int = DEFAULT_FPS,
        device_index: int = 0,
    ):
        """
        Args:
            output_dir:   Directory to save recorded clips and snapshots.
            resolution:   (width, height). Default 1280×720 for 720p webcam.
            fps:          Frames per second. 30 works on most USB webcams.
            device_index: /dev/video index. 0 = first USB camera.
        """
        self.output_dir = output_dir
        self.resolution = resolution
        self.fps = fps
        self.device_index = device_index

        self.camera = None

        # Rolling 5-second pre-event buffer
        self.buffer: list = []
        self.buffer_seconds = 5
        self.buffer_max_frames = fps * self.buffer_seconds

        # Latest frame — updated by reader thread
        self.current_frame = None
        self._frame_lock = threading.Lock()
        self._reader_running = False

        os.makedirs(output_dir, exist_ok=True)
        self._init_camera()

    # ─── Initialisation ──────────────────────────────────────────────────────

    def _init_camera(self):
        """Initialise USB webcam via OpenCV."""
        if not CV2_AVAILABLE:
            print("⚠️  OpenCV not available — evidence capture disabled.")
            return

        try:
            cap = cv2.VideoCapture(self.device_index)

            # Force resolution and FPS
            cap.set(cv2.CAP_PROP_FRAME_WIDTH,  self.resolution[0])
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
            cap.set(cv2.CAP_PROP_FPS,          self.fps)

            # On Pi 5, V4L2 backend gives best performance
            cap.set(cv2.CAP_PROP_BACKEND, cv2.CAP_V4L2)

            if cap.isOpened():
                # Verify we can actually grab a frame
                ok, _ = cap.read()
                if ok:
                    self.camera = cap

                    # Read back actual values (webcam may negotiate different)
                    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    actual_fps = int(cap.get(cv2.CAP_PROP_FPS))
                    self.resolution = (actual_w, actual_h)
                    self.fps = actual_fps or self.fps

                    print(f"📹 USB Webcam: {actual_w}×{actual_h} @ {actual_fps}fps "
                          f"(/dev/video{self.device_index})")
                    return
                else:
                    cap.release()
        except Exception as e:
            print(f"USB camera init failed: {e}")

        print("⚠️  No USB webcam detected — evidence capture disabled.")

    # ─── Frame Capture ───────────────────────────────────────────────────────

    def _read_frame(self):
        """Read one frame from the USB webcam."""
        if not self.camera:
            return None
        try:
            ok, frame = self.camera.read()
            return frame if ok else None
        except Exception:
            return None

    def capture_frame(self):
        """Public: return the latest buffered frame (thread-safe)."""
        with self._frame_lock:
            return self.current_frame

    # ─── Reader Thread ───────────────────────────────────────────────────────

    def start_buffer_recording(self):
        """Start dedicated reader thread that keeps the rolling buffer full."""
        if self._reader_running:
            return

        self._reader_running = True

        def _loop():
            interval = 1.0 / self.fps
            while self._reader_running:
                t0 = time.time()
                frame = self._read_frame()
                if frame is not None:
                    with self._frame_lock:
                        self.current_frame = frame
                    self._add_to_buffer(frame)
                elapsed = time.time() - t0
                sleep = interval - elapsed
                if sleep > 0:
                    time.sleep(sleep)

        t = threading.Thread(target=_loop, daemon=True, name="cam-reader")
        t.start()
        print("📹 Buffer recording started")

    def _add_to_buffer(self, frame):
        """Append frame to rolling pre-event buffer."""
        self.buffer.append((time.time(), frame))
        while len(self.buffer) > self.buffer_max_frames:
            self.buffer.pop(0)

    # ─── Evidence Saving ─────────────────────────────────────────────────────

    def save_clip(self, event_type: str, duration_after: float = 5.0):
        """
        Save MP4 clip: 5s pre-event buffer + `duration_after` seconds after.

        Returns:
            str: Path to saved file, or None on failure.
        """
        if not self.camera or not CV2_AVAILABLE:
            return None

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"{event_type}_{timestamp}.mp4"
        filepath  = os.path.join(self.output_dir, filename)

        print(f"📹 Saving clip: {filename}")

        try:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(filepath, fourcc, self.fps, self.resolution)

            # Write pre-event buffer frames
            with self._frame_lock:
                pre_frames = [(ts, f.copy()) for ts, f in self.buffer]

            for _, frame in pre_frames:
                writer.write(frame)

            # Record post-event frames from current_frame (reader thread feeds it)
            frames_after = int(self.fps * duration_after)
            interval = 1.0 / self.fps
            for _ in range(frames_after):
                time.sleep(interval)
                with self._frame_lock:
                    frame = self.current_frame
                if frame is not None:
                    writer.write(frame)

            writer.release()
            print(f"✅ Clip saved: {filepath}")
            return filepath

        except Exception as e:
            print(f"Failed to save clip: {e}")
            return None

    def capture_snapshot(self, event_type: str):
        """
        Save the current frame as a JPEG snapshot.

        Returns:
            str: Path to saved image, or None on failure.
        """
        frame = self.capture_frame()
        if frame is None:
            frame = self._read_frame()
        if frame is None:
            return None

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"{event_type}_{timestamp}.jpg"
        filepath  = os.path.join(self.output_dir, filename)

        try:
            cv2.imwrite(filepath, frame)
            print(f"📷 Snapshot saved: {filepath}")
            return filepath
        except Exception as e:
            print(f"Failed to save snapshot: {e}")
            return None

    # ─── Cleanup ─────────────────────────────────────────────────────────────

    def close(self):
        """Stop reader thread and release camera."""
        self._reader_running = False
        time.sleep(0.2)  # Let loop exit
        if self.camera:
            self.camera.release()
        print("📹 Camera closed")


# ─── Quick Test ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    print("Testing Camera Module (USB Webcam)...")
    print("-" * 40)

    if not CV2_AVAILABLE:
        print("OpenCV not available. Run: pip install opencv-python-headless")
        sys.exit(1)

    cam = CameraModule()
    if not cam.camera:
        print("No USB webcam detected. Check USB connection.")
        sys.exit(1)

    cam.start_buffer_recording()
    print("\nBuffering... Press Enter to save a test clip.")
    input()

    clip = cam.save_clip("TEST_EVENT")
    snap = cam.capture_snapshot("TEST_SNAP")

    if clip: print(f"✅ Clip:     {clip}")
    if snap: print(f"✅ Snapshot: {snap}")

    cam.close()
