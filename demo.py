"""
Demo Script - Rash Driving Detection System

This script starts all components for a complete demo:
1. Starts the Flask backend
2. Opens the dashboard in browser
3. Starts the IoT simulator

Run: python demo.py
"""

import subprocess
import sys
import time
import webbrowser
import os

# Configuration
SERVER_URL = "http://localhost:5000"
BACKEND_SCRIPT = "backend/app.py"
SIMULATOR_SCRIPT = "simulator/simulator.py"


def get_python_path():
    """Get the path to the venv Python executable."""
    if sys.platform == "win32":
        return os.path.join("venv", "Scripts", "python.exe")
    else:
        return os.path.join("venv", "bin", "python")


def main():
    print("\n" + "="*60)
    print("🚌 RASH DRIVING DETECTION SYSTEM - DEMO MODE")
    print("="*60)
    
    python_path = get_python_path()
    
    if not os.path.exists(python_path):
        print("❌ Virtual environment not found!")
        print("   Run: python -m venv venv")
        print("   Then: pip install -r backend/requirements.txt")
        sys.exit(1)
    
    processes = []
    
    try:
        # Start backend
        print("\n📡 Starting backend server...")
        backend_process = subprocess.Popen(
            [python_path, BACKEND_SCRIPT],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        processes.append(("Backend", backend_process))
        
        # Wait for backend to start
        time.sleep(3)
        
        # Check if backend started successfully
        if backend_process.poll() is not None:
            print("❌ Backend failed to start!")
            print("--- Error Output ---")
            print(backend_process.stdout.read())
            print("--------------------")
            sys.exit(1)
        
        print("✅ Backend running on", SERVER_URL)
        
        # Open dashboard in browser
        print("\n🌐 Opening dashboard in browser...")
        webbrowser.open(SERVER_URL)
        time.sleep(2)
        
        # Start simulator
        print("\n🚌 Starting bus simulator...")
        simulator_process = subprocess.Popen(
            [python_path, SIMULATOR_SCRIPT],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        processes.append(("Simulator", simulator_process))
        
        print("✅ Simulator running (3 buses)")
        
        print("\n" + "="*60)
        print("🎉 DEMO IS RUNNING!")
        print("="*60)
        print(f"\n📍 Dashboard: {SERVER_URL}")
        print("📊 Simulator is generating events every 2 seconds")
        print("\n⏹️  Press Ctrl+C to stop all components\n")
        
        # Keep running and show output
        while True:
            # Check if processes are still running
            for name, process in processes:
                if process.poll() is not None:
                    print(f"⚠️ {name} has stopped!")
                    print(f"--- {name} Output ---")
                    try:
                        print(process.stdout.read())
                    except Exception as e:
                        print(f"Could not read output: {e}")
                    print("---------------------")
                    
                    # If any process dies, we should probably stop everything
                    raise KeyboardInterrupt
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping demo...")
    finally:
        # Clean up all processes
        for name, process in processes:
            print(f"   Stopping {name}...")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        
        print("\n✅ Demo stopped. Goodbye!\n")


if __name__ == "__main__":
    main()
