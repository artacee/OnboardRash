"""
Data Manager for Offline Support (Store & Forward)

Handles storing events locally when offline and syncing them when online.
Uses SQLite for persistence.
"""

import sqlite3
import json
import os
import time
import requests
import threading
from datetime import datetime

DB_FILE = 'events_queue.db'

class DataManager:
    """Manages event storage and synchronization."""
    
    def __init__(self, server_url, api_key):
        self.server_url = server_url
        self.api_key = api_key
        self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), DB_FILE)
        self._init_db()
        self.lock = threading.Lock()
        
        # Start background sync thread
        self.running = True
        self.sync_thread = threading.Thread(target=self._sync_loop, daemon=True)
        self.sync_thread.start()
        
    def _init_db(self):
        """Initialize local database."""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute('''
                CREATE TABLE IF NOT EXISTS event_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payload TEXT NOT NULL,
                    video_path TEXT,
                    snapshot_path TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    attempts INTEGER DEFAULT 0
                )
            ''')
            conn.commit()
            conn.close()
            print(f"📦 Local database initialized: {self.db_path}")
        except Exception as e:
            print(f"❌ Failed to init local DB: {e}")

    def queue_event(self, payload, video_path=None, snapshot_path=None):
        """Queue an event for upload."""
        with self.lock:
            try:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                
                # Helper to encode file paths if needed, or just store them
                # Payload is already a dict, convert to JSON string
                c.execute(
                    "INSERT INTO event_queue (payload, video_path, snapshot_path) VALUES (?, ?, ?)",
                    (json.dumps(payload), video_path, snapshot_path)
                )
                conn.commit()
                # Get the queue size
                c.execute("SELECT COUNT(*) FROM event_queue")
                count = c.fetchone()[0]
                conn.close()
                print(f"  📥 Event queued locally. Queue size: {count}")
                return True
            except Exception as e:
                print(f"  ❌ Failed to queue event: {e}")
                return False

    def _sync_loop(self):
        """Background loop to sync queued events."""
        print("🔄 Sync service started")
        
        while self.running:
            # Check for events
            events = []
            try:
                with self.lock:
                    conn = sqlite3.connect(self.db_path)
                    conn.row_factory = sqlite3.Row
                    c = conn.cursor()
                    c.execute("SELECT * FROM event_queue ORDER BY created_at ASC LIMIT 1")
                    event = c.fetchone()
                    conn.close()
                    
                if event:
                    success = self._upload_event(dict(event))
                    if success:
                        # Remove from queue
                        with self.lock:
                            conn = sqlite3.connect(self.db_path)
                            c = conn.cursor()
                            c.execute("DELETE FROM event_queue WHERE id = ?", (event['id'],))
                            conn.commit()
                            conn.close()
                        print(f"  🔄 Synced event {event['id']} from queue")
                    else:
                        # Wait before retry if network is down
                        time.sleep(5)
                else:
                    # Queue empty, wait a bit
                    time.sleep(2)
                    
            except Exception as e:
                print(f"Sync error: {e}")
                time.sleep(5)

    def _upload_event(self, event_row):
        """Upload a single event from the queue."""
        try:
            payload = json.loads(event_row['payload'])
            video_path = event_row['video_path']
            snapshot_path = event_row['snapshot_path']
            
            headers = {'X-API-Key': self.api_key}
            
            # 1. Upload Event Data
            # Note: The payload might already have base64 snapshot if strictly following old code,
            # but usually we might want to attach files differently?
            # The backend expects JSON payload with optional base64. 
            # If video exists, it's a separate step usually?
            # Re-using logic from main_pi.py send_event essentially.
            
            # If snapshot exists and not in payload base64 yet, load it
            if snapshot_path and os.path.exists(snapshot_path):
                 if 'snapshot_base64' not in payload:
                     with open(snapshot_path, 'rb') as f:
                         import base64
                         payload['snapshot_base64'] = base64.b64encode(f.read()).decode('utf-8')
            
            response = requests.post(
                f"{self.server_url}/api/events",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code not in [200, 201]:
                return False
                
            event_response = response.json()
            event_id = event_response.get('id')
            
            # 2. Upload Video (if applicable)
            # The backend API /api/events/<id>/video expects multipart form
            if video_path and os.path.exists(video_path) and event_id:
                try:
                    with open(video_path, 'rb') as f:
                        files = {'video': (os.path.basename(video_path), f, 'video/mp4')}
                        vid_resp = requests.post(
                            f"{self.server_url}/api/events/{event_id}/video",
                            files=files,
                            headers=headers,
                            timeout=60
                        )
                        if vid_resp.status_code == 200:
                            print("    - Video uploaded synced")
                except Exception as e:
                    print(f"    - Video sync failed: {e}")
            
            return True
            
        except requests.exceptions.RequestException:
            # Network error
            return False
        except Exception as e:
            print(f"  ❌ Upload logic error: {e}")
            # If logic error (not network), maybe should skip/delete to avoid blocking?
            # For now, retry.
            return False

    def close(self):
        self.running = False
