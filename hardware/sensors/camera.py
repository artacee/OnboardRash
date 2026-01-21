"""
Camera Module Driver for Raspberry Pi

Captures video clips when rash driving events are detected.
Uses Pi Camera Module or USB webcam.

For Pi Camera Module 3:
- Connect to CSI port on Raspberry Pi
- Enable camera in raspi-config

For USB Webcam:
- Just plug in, should auto-detect
"""

import os
import time
import threading
from datetime import datetime

# Try to import camera libraries
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("Warning: OpenCV not installed. Run: pip install opencv-python")

try:
    from picamera2 import Picamera2
    PICAMERA_AVAILABLE = True
except ImportError:
    PICAMERA_AVAILABLE = False


class CameraModule:
    """Camera driver for video evidence capture."""
    
    def __init__(self, output_dir="recordings", resolution=(640, 480), fps=15):
        """
        Initialize the camera.
        
        Args:
            output_dir: Directory to save video clips
            resolution: Video resolution (width, height)
            fps: Frames per second
        """
        self.output_dir = output_dir
        self.resolution = resolution
        self.fps = fps
        self.camera = None
        self.is_recording = False
        self.buffer = []
        self.buffer_seconds = 5  # Keep last 5 seconds in buffer
        self.buffer_max_frames = fps * self.buffer_seconds
        
        self.current_frame = None  # Store latest frame for analysis
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize camera
        self._init_camera()
    
    def _init_camera(self):
        """Initialize the camera (Pi Camera or USB)."""
        if PICAMERA_AVAILABLE:
            try:
                self.camera = Picamera2()
                config = self.camera.create_video_configuration(
                    main={"size": self.resolution}
                )
                self.camera.configure(config)
                self.camera.start()
                self.camera_type = "picamera"
                print("Pi Camera initialized")
                return
            except Exception as e:
                print(f"Pi Camera failed: {e}")
        
        if CV2_AVAILABLE:
            try:
                self.camera = cv2.VideoCapture(0)
                self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
                self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
                self.camera.set(cv2.CAP_PROP_FPS, self.fps)
                
                if self.camera.isOpened():
                    self.camera_type = "usb"
                    print("USB Camera initialized")
                    return
            except Exception as e:
                print(f"USB Camera failed: {e}")
        
        print("No camera available")
        self.camera = None
    
    def capture_frame(self):
        """
        Capture a single frame from the camera.
        
        Returns:
            numpy array: Frame image, or None if failed
        """
        if not self.camera:
            return None
        
        try:
            if self.camera_type == "picamera":
                frame = self.camera.capture_array()
            else:
                ret, frame = self.camera.read()
                if not ret:
                    return None
            
            return frame
        except Exception as e:
            print(f"Capture failed: {e}")
            return None
            
    def get_current_frame(self):
        """Get the latest captured frame (thread-safe)."""
        return self.current_frame
    
    def add_to_buffer(self, frame):
        """Add a frame to the rolling buffer."""
        if frame is not None:
            self.current_frame = frame  # Update latest frame
            self.buffer.append((time.time(), frame))
            
            # Remove old frames
            while len(self.buffer) > self.buffer_max_frames:
                self.buffer.pop(0)
    
    def save_clip(self, event_type, duration_after=5):
        """
        Save a video clip around the current moment.
        
        Includes frames from buffer (before event) + new frames (after event).
        
        Args:
            event_type: Type of event (for filename)
            duration_after: Seconds to record after event
            
        Returns:
            str: Path to saved video file, or None if failed
        """
        if not self.camera or not CV2_AVAILABLE:
            return None
        
        # Inhibit buffer recording loop temporarily? 
        # Actually better to just let it run and captureframes manually here?
        # If accessing camera resource is not thread safe this wil fail.
        # But Picamera2 might handle it, and USB cam usually single reader.
        # If buffer loop uses capture_frame, and save_clip uses capture_frame, they race.
        
        # Better strategy: 
        # If we are recording in background, just read self.current_frame repeatedly?
        # Or pause background thread?
        
        # For simplicity in this demo:
        # We'll rely on the fact that if we just read 'self.buffer' we get "before" frames.
        # For "after" frames, we will just sleep and let buffer fill up, 
        # then grab fresh frames? No, we need to write to file.
        
        # Let's assume for now we can read frame. 
        # If issues arise, we should change architecture to have one reader thread 
        # and multiple consumers.
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{event_type}_{timestamp}.mp4"
        filepath = os.path.join(self.output_dir, filename)
        
        print(f"📹 Recording clip: {filename}")
        
        try:
            # Setup video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            writer = cv2.VideoWriter(filepath, fourcc, self.fps, self.resolution)
            
            # Write buffered frames (before event)
            # Create a copy to avoid modification during iteration
            current_buffer = list(self.buffer)
            for _, frame in current_buffer:
                # Convert RGB to BGR for OpenCV if from picamera
                if self.camera_type == "picamera":
                    frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                writer.write(frame)
            
            # Record additional frames (after event)
            # Since we have a background thread capturing frames, 
            # we can just wait and grab them from current_frame or buffer?
            # Or just call capture_frame (might conflict).
            
            frames_after = int(self.fps * duration_after)
            for _ in range(frames_after):
                # We need to coordinate with buffer loop.
                # Easiest: just sleep 1/fps and read self.current_frame
                time.sleep(1.0 / self.fps)
                frame = self.current_frame
                
                if frame is not None:
                    if self.camera_type == "picamera":
                        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                    writer.write(frame)
            
            writer.release()
            print(f"📹 Clip saved: {filepath}")
            
            return filepath
            
        except Exception as e:
            print(f"Failed to save clip: {e}")
            return None
    
    def capture_snapshot(self, event_type):
        """
        Capture a single snapshot image.
        
        Args:
            event_type: Type of event (for filename)
            
        Returns:
            str: Path to saved image, or None if failed
        """
        # Use current frame if available
        frame = self.current_frame
        if frame is None:
            frame = self.capture_frame()
            
        if frame is None:
            return None
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{event_type}_{timestamp}.jpg"
        filepath = os.path.join(self.output_dir, filename)
        
        try:
            if self.camera_type == "picamera":
                frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            cv2.imwrite(filepath, frame)
            print(f"📷 Snapshot saved: {filepath}")
            return filepath
        except Exception as e:
            print(f"Failed to save snapshot: {e}")
            return None
    
    def start_buffer_recording(self):
        """Start continuous buffer recording in background thread."""
        def buffer_loop():
            while True:
                frame = self.capture_frame()
                self.add_to_buffer(frame)
                time.sleep(1.0 / self.fps)
        
        thread = threading.Thread(target=buffer_loop, daemon=True)
        thread.start()
        print("📹 Buffer recording started")
    
    def close(self):
        """Release camera resources."""
        if self.camera:
            if self.camera_type == "picamera":
                self.camera.close()
            else:
                self.camera.release()
            print("Camera closed")


# Test code
if __name__ == "__main__":
    print("Testing Camera Module...")
    print("-" * 40)
    
    if not CV2_AVAILABLE:
        print("OpenCV not installed. Run: pip install opencv-python")
        exit(1)
    
    try:
        camera = CameraModule()
        
        if camera.camera:
            # Start buffer recording
            camera.start_buffer_recording()
            
            print("\nCamera running. Press Enter to capture a test clip...")
            input()
            
            # Save test clip
            clip_path = camera.save_clip("TEST_EVENT")
            if clip_path:
                print(f"\n✅ Test successful! Video saved to: {clip_path}")
            
            # Also save snapshot
            snap_path = camera.capture_snapshot("TEST_SNAP")
            if snap_path:
                print(f"✅ Snapshot saved to: {snap_path}")
        else:
            print("No camera detected!")
            
    except KeyboardInterrupt:
        print("\nStopped")
    finally:
        camera.close()
