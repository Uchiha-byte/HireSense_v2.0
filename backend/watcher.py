import os
import time
import re
import httpx
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
WATCH_DIR = r"E:\HireSense\Call Recordings"
BACKEND_URL = "http://127.0.0.1:8000/reference-upload"
SECRET_KEY = os.getenv("WATCHER_SECRET", "your_watcher_secret_here")
CHECK_INTERVAL_SECONDS = 5
MAX_STABLE_CHECKS = 3 # File size must be stable for 3 checks (15 seconds)

# Ensure watch directory exists
if not os.path.exists(WATCH_DIR):
    os.makedirs(WATCH_DIR, exist_ok=True)

print(f"👀 Starting Watcher on {WATCH_DIR}...")

class ZoomRecordingHandler(FileSystemEventHandler):
    def __init__(self):
        self.processing_files = set()

    def on_created(self, event):
        if event.is_directory:
            return
        self.process_if_match(event.src_path)

    def on_modified(self, event):
        if event.is_directory:
            return
        self.process_if_match(event.src_path)
        
    def process_if_match(self, filepath):
        if filepath in self.processing_files:
            return
            
        filename = os.path.basename(filepath).lower()
        if not (filename.endswith(".m4a") or filename.endswith(".mp4")):
            return
            
        print(f"Detected possible recording: {filepath}")
        self.processing_files.add(filepath)
        self.wait_and_upload(filepath)

    def extract_reference_id(self, filepath):
        # Look for __[uuid]__ in the directory path or filename
        pattern = r"__\[([a-f0-9\-]{36})\]__"
        
        # Check folder name first (Zoom typically puts recordings in a folder named after the topic)
        folder_name = os.path.basename(os.path.dirname(filepath))
        match = re.search(pattern, folder_name)
        if match:
            return match.group(1)
            
        # Check filename
        filename = os.path.basename(filepath)
        match = re.search(pattern, filename)
        if match:
            return match.group(1)
            
        return None

    def wait_and_upload(self, filepath):
        print(f"Waiting for file size to stabilize: {filepath}")
        
        stable_count = 0
        last_size = -1
        
        while stable_count < MAX_STABLE_CHECKS:
            try:
                # File might not exist temporarily if zoom moves it
                if not os.path.exists(filepath):
                    print(f"File vanished: {filepath}")
                    self.processing_files.remove(filepath)
                    return
                    
                current_size = os.path.getsize(filepath)
                if current_size == last_size and current_size > 0:
                    stable_count += 1
                else:
                    stable_count = 0
                    last_size = current_size
                    
                time.sleep(CHECK_INTERVAL_SECONDS)
            except Exception as e:
                print(f"Error checking file size: {e}")
                time.sleep(CHECK_INTERVAL_SECONDS)

        print(f"File stable. Extracting ID from {filepath}")
        ref_id = self.extract_reference_id(filepath)
        
        if not ref_id:
            print("Couldn't find reference ID (__[id]__) in path. Skipping.")
            self.processing_files.remove(filepath)
            return

        print(f"Found Reference ID: {ref_id}")
        print(f"Uploading to {BACKEND_URL}...")
        
        try:
            with open(filepath, "rb") as f:
                with httpx.Client(timeout=300.0) as client: # 5 minute timeout since whisper and gpt could be slow
                    files = {"file": (os.path.basename(filepath), f, "audio/mp4")}
                    data = {"reference_call_id": ref_id}
                    headers = {"X-Watcher-Secret": SECRET_KEY}
                    
                    response = client.post(BACKEND_URL, files=files, data=data, headers=headers)
                    
                    if response.status_code == 200:
                        print("✅ Upload successful!")
                    else:
                        print(f"❌ Upload failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error during upload: {e}")
            
        finally:
            self.processing_files.remove(filepath)


if __name__ == "__main__":
    event_handler = ZoomRecordingHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("Watcher stopped.")
    
    observer.join()
