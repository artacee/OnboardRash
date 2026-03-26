"""
Camera Module Driver — USB Webcam.

Optimised for Raspberry Pi 5 + USB webcam (720p @ 30fps).
Uses a single reader thread to avoid frame access races.
"""

import os
import time
import shutil
import threading
import collections
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

        # Rolling 2-second pre-event buffer (deque auto-evicts oldest in O(1))
        self.buffer_seconds = 2
        self.buffer_max_frames = fps * self.buffer_seconds
        self.buffer = collections.deque(maxlen=self.buffer_max_frames)

        # Latest frame — updated by reader thread
        self.current_frame = None
        self._frame_lock = threading.Lock()
        self._reader_running = False

        # Serialize concurrent save_clip calls (second clip waits instead of being skipped)
        self._save_lock = threading.Lock()

        os.makedirs(output_dir, exist_ok=True)
        self._init_camera()

    # ─── Initialisation ──────────────────────────────────────────────────────

    def _init_camera(self):
        """Initialise USB webcam via OpenCV."""
        if not CV2_AVAILABLE:
            print("⚠️  OpenCV not available — evidence capture disabled.")
            return

        # Try the requested device index first, then scan 0–4 as fallback
        indices_to_try = [self.device_index]
        for i in range(5):
            if i not in indices_to_try:
                indices_to_try.append(i)

        for idx in indices_to_try:
            cap = None
            try:
                # Pass V4L2 backend directly to constructor (CAP_PROP_BACKEND
                # is read-only and cannot be set after creation).
                cap = cv2.VideoCapture(idx, cv2.CAP_V4L2)

                if not cap.isOpened():
                    # Fallback: try default backend (auto-detect)
                    cap.release()
                    cap = cv2.VideoCapture(idx)

                if not cap.isOpened():
                    if cap:
                        cap.release()
                    continue

                # Force resolution and FPS
                cap.set(cv2.CAP_PROP_FRAME_WIDTH,  self.resolution[0])
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
                cap.set(cv2.CAP_PROP_FPS,          self.fps)

                # Verify we can actually grab a frame
                ok, _ = cap.read()
                if ok:
                    self.camera = cap
                    self.device_index = idx

                    # Read back actual values (webcam may negotiate different)
                    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    actual_fps = int(cap.get(cv2.CAP_PROP_FPS))
                    self.resolution = (actual_w, actual_h)
                    self.fps = actual_fps or self.fps

                    print(f"📹 USB Webcam: {actual_w}×{actual_h} @ {actual_fps}fps "
                          f"(/dev/video{idx})")
                    return
                else:
                    cap.release()
            except Exception as e:
                print(f"  /dev/video{idx}: {e}")
                if cap:
                    try:
                        cap.release()
                    except Exception:
                        pass

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
                        self.buffer.append((time.time(), frame))
                elapsed = time.time() - t0
                sleep = interval - elapsed
                if sleep > 0:
                    time.sleep(sleep)

        t = threading.Thread(target=_loop, daemon=True, name="cam-reader")
        t.start()
        print("📹 Buffer recording started")

    # ─── Evidence Saving ─────────────────────────────────────────────────────

    @staticmethod
    def _find_h264_fourcc():
        """Find a browser-compatible H.264 fourcc that works on this system."""
        if not CV2_AVAILABLE:
            return None
        for codec in ('avc1', 'x264', 'H264'):
            fourcc = cv2.VideoWriter_fourcc(*codec)
            # Quick probe: try to open a writer with this codec
            test_path = os.path.join('/tmp' if os.name != 'nt' else os.environ.get('TEMP', '.'), '_codec_test.mp4')
            w = cv2.VideoWriter(test_path, fourcc, 10, (640, 480))
            if w.isOpened():
                w.release()
                try:
                    os.remove(test_path)
                except OSError:
                    pass
                return fourcc
            w.release()
            try:
                os.remove(test_path)
            except OSError:
                pass
        return None

    @staticmethod
    def _ffmpeg_to_h264(src_path):
        """Re-encode an mp4v file to H.264 using ffmpeg (if available)."""
        import subprocess
        out_path = src_path.replace('.mp4', '_h264.mp4')
        try:
            subprocess.run(
                ['ffmpeg', '-y', '-i', src_path, '-c:v', 'libx264',
                 '-preset', 'ultrafast', '-crf', '28', '-an', out_path],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                timeout=60,
            )
            if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
                os.replace(out_path, src_path)  # overwrite original
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            # ffmpeg not installed or failed
            try:
                os.remove(out_path)
            except OSError:
                pass
        return False

    def save_clip(self, event_type: str, duration_after: float = 5.0):
        """
        Save MP4 clip: 2s pre-event buffer + `duration_after` seconds after.
        Thread-safe: concurrent calls are serialized (second clip waits for first).

        Produces H.264 video (playable in browsers). Falls back to mp4v + ffmpeg
        re-encoding if H.264 codecs aren't available in OpenCV.

        Returns:
            str: Path to saved file, or None on failure.
        """
        if not self.camera or not CV2_AVAILABLE:
            return None

        # Disk space check — skip video if < 500 MB free
        try:
            if shutil.disk_usage(self.output_dir).free < 500_000_000:
                print("⚠️  Low disk space — video capture skipped")
                return None
        except OSError:
            pass

        with self._save_lock:
            today = datetime.now().strftime('%Y-%m-%d')
            day_dir = os.path.join(self.output_dir, today)
            os.makedirs(day_dir, exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename  = f"{event_type}_{timestamp}.mp4"
            filepath  = os.path.join(day_dir, filename)

            print(f"📹 Saving clip: {filename}")

            try:
                # Try H.264 first (browser-compatible), fall back to mp4v
                h264_fourcc = self._find_h264_fourcc()
                used_h264 = h264_fourcc is not None
                fourcc = h264_fourcc if used_h264 else cv2.VideoWriter_fourcc(*"mp4v")

                writer = cv2.VideoWriter(filepath, fourcc, self.fps, self.resolution)

                # Write pre-event buffer directly under lock (no frame copy — saves ~158 MB)
                with self._frame_lock:
                    for _, frame in self.buffer:
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

                # If we used mp4v fallback, try ffmpeg re-encode to H.264
                if not used_h264:
                    if self._ffmpeg_to_h264(filepath):
                        print(f"✅ Clip saved (ffmpeg H.264): {filepath}")
                    else:
                        print(f"✅ Clip saved (mp4v — may not play in browser): {filepath}")
                else:
                    print(f"✅ Clip saved (H.264): {filepath}")

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

        # Disk space check — skip snapshot if < 50 MB free
        try:
            if shutil.disk_usage(self.output_dir).free < 50_000_000:
                print("⚠️  Low disk space — snapshot skipped")
                return None
        except OSError:
            pass

        today = datetime.now().strftime('%Y-%m-%d')
        day_dir = os.path.join(self.output_dir, today)
        os.makedirs(day_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"{event_type}_{timestamp}.jpg"
        filepath  = os.path.join(day_dir, filename)

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
