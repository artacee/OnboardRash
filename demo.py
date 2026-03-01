"""
Demo Script - Rash Driving Detection System

Starts all three components in one go:
  1. Flask backend   (port 5000)
  2. Vite frontend   (port 5173)
  3. Bus simulator   (sends events every 2 s)

Stop everything cleanly with Ctrl+C or by closing this window.

Run:  python demo.py
"""

import subprocess
import sys
import time
import webbrowser
import os
import signal

# ─── Configuration ───────────────────────────────────────────
BACKEND_URL  = os.getenv('BACKEND_URL',  'http://localhost:5000')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

ROOT_DIR         = os.path.dirname(os.path.abspath(__file__))
BACKEND_SCRIPT   = os.path.join(ROOT_DIR, 'backend', 'app.py')
SIMULATOR_SCRIPT = os.path.join(ROOT_DIR, 'simulator', 'simulator.py')
FRONTEND_DIR     = os.path.join(ROOT_DIR, 'frontend')

# ─── Helpers ─────────────────────────────────────────────────

def find_python():
    """Return the Python executable — prefer venv if it exists."""
    if sys.platform == 'win32':
        venv_py = os.path.join(ROOT_DIR, 'venv', 'Scripts', 'python.exe')
    else:
        venv_py = os.path.join(ROOT_DIR, 'venv', 'bin', 'python')
    return venv_py if os.path.exists(venv_py) else sys.executable


def find_npm():
    """Return npm command suitable for the OS."""
    return 'npm.cmd' if sys.platform == 'win32' else 'npm'


def kill_tree(proc):
    """Kill a process and all its children (works on Windows & Unix)."""
    try:
        if sys.platform == 'win32':
            # taskkill /T kills the whole process tree
            subprocess.call(
                ['taskkill', '/F', '/T', '/PID', str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


def wait_for_server(url, timeout=15):
    """Block until *url* responds or *timeout* seconds elapse."""
    import urllib.request, urllib.error
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=2)
            return True
        except Exception:
            time.sleep(0.5)
    return False


# ─── Main ────────────────────────────────────────────────────

def kill_old_processes():
    """Free up the ports used by the demo by killing whatever holds them."""
    print("  Ensuring ports are free by stopping old processes...")
    try:
        if sys.platform == 'win32':
            # Kill whatever process owns port 5000 (backend), 5173 (frontend), or 8081 (expo)
            for port in (5000, 5173, 8081):
                cmd = (
                    f'$c = netstat -ano | Select-String ":{port}\\s"; '
                    f'if ($c) {{ $pid_ = ($c[0] -split "\\s+")[-1]; '
                    f'Stop-Process -Id $pid_ -Force -ErrorAction SilentlyContinue }}'
                )
                subprocess.run(["powershell", "-Command", cmd], capture_output=True)
        else:
            for port in (5000, 5173, 8081):
                cmd = f"lsof -ti tcp:{port} | xargs -r kill -9"
                subprocess.run(cmd, shell=True, capture_output=True)
        time.sleep(1)  # Give OS a moment to release the ports
    except Exception:
        pass


def main():
    kill_old_processes()

    python = find_python()
    npm    = find_npm()

    # On Unix, create new process groups so we can kill the tree
    popen_kwargs = {}
    if sys.platform != 'win32':
        popen_kwargs['preexec_fn'] = os.setsid

    processes: list[tuple[str, subprocess.Popen]] = []

    def cleanup():
        print('\n\n  Stopping all processes...')
        for name, proc in reversed(processes):
            print(f'    Stopping {name} (PID {proc.pid})...')
            kill_tree(proc)
        print('\n  All stopped. Goodbye!\n')

    # ── Banner ──────────────────────────────────────────────
    print()
    print('=' * 60)
    print('  RASH DRIVING DETECTION SYSTEM — DEMO')
    print('=' * 60)
    print(f'  Python : {python}')
    print(f'  npm    : {npm}')
    print('=' * 60)

    try:
        # 1. Backend ──────────────────────────────────────────
        print('\n[1/3]  Starting Flask backend...')
        backend = subprocess.Popen(
            [python, BACKEND_SCRIPT],
            cwd=os.path.join(ROOT_DIR, 'backend'),
            **popen_kwargs,
        )
        processes.append(('Backend', backend))

        if not wait_for_server(f'{BACKEND_URL}/health', timeout=15):
            print('  ERROR: Backend did not start within 15 s.')
            cleanup()
            sys.exit(1)
        print(f'  Backend ready  ->  {BACKEND_URL}')

        # 2. Frontend ─────────────────────────────────────────
        print('\n[2/3]  Starting Vite frontend...')
        frontend = subprocess.Popen(
            [npm, 'run', 'dev'],
            cwd=FRONTEND_DIR,
            **popen_kwargs,
        )
        processes.append(('Frontend', frontend))

        # Give Vite a moment to spin up
        time.sleep(6)
        # Check if it grabbed an alternate port
        actual_frontend_url = FRONTEND_URL
        print(f'  Frontend ready ->  {actual_frontend_url}')

        # 3. Simulator ────────────────────────────────────────
        print('\n[3/3]  Simulator ready to be started via Settings page.')
        # simulator = subprocess.Popen(...) - Started manually now

        # ── Open browser ────────────────────────────────────
        print(f'\n  Opening browser ->  {actual_frontend_url}')
        try:
            edge = webbrowser.get('windows-default' if sys.platform != 'win32' else None)
            # Try to register and use Edge explicitly
            webbrowser.register(
                'edge',
                None,
                webbrowser.BackgroundBrowser('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'),
            )
            edge_browser = webbrowser.get('edge')
            edge_browser.open(actual_frontend_url)
        except Exception:
            webbrowser.open(actual_frontend_url)  # fallback to default

        # ── Summary ─────────────────────────────────────────
        print()
        print('=' * 60)
        print('  DEMO IS RUNNING')
        print('=' * 60)
        print(f'  Frontend  :  {actual_frontend_url}')
        print(f'  Backend   :  {BACKEND_URL}')
        print(f'  Login     :  ajmal / 12345')
        print()
        print('  Press Ctrl+C to stop everything.')
        print('=' * 60)

        # ── Keep alive & health-check ────────────────────────
        while True:
            for name, proc in processes:
                if proc.poll() is not None:
                    print(f'\n  WARNING: {name} exited (code {proc.returncode})')
                    raise KeyboardInterrupt
            time.sleep(2)

    except KeyboardInterrupt:
        pass
    finally:
        cleanup()


if __name__ == '__main__':
    main()

