
import os
import subprocess
import sys
import signal
from flask import Blueprint, jsonify, current_app

simulation_bp = Blueprint('simulation', __name__, url_prefix='/api/simulation')

# Global variable to store the simulator process
# In a production app with multiple workers, this wouldn't work (need Redis/DB)
# But for this demo (single worker), it's fine.
simulator_process = None

def get_simulator_path():
    # backend/routes/simulation.py -> backend/routes -> backend -> root -> simulator/simulator.py
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
    return os.path.join(root_dir, 'simulator', 'simulator.py')

def find_python():
    """Return the Python executable — prefer venv if it exists."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
    
    if sys.platform == 'win32':
        venv_py = os.path.join(root_dir, 'venv', 'Scripts', 'python.exe')
    else:
        venv_py = os.path.join(root_dir, 'venv', 'bin', 'python')
        
    return venv_py if os.path.exists(venv_py) else sys.executable

@simulation_bp.route('/status', methods=['GET'])
def get_status():
    global simulator_process
    is_running = simulator_process is not None and simulator_process.poll() is None
    
    return jsonify({
        'running': is_running,
        'pid': simulator_process.pid if is_running else None
    })

@simulation_bp.route('/start', methods=['POST'])
def start_simulation():
    global simulator_process
    
    # Check if already running
    if simulator_process is not None and simulator_process.poll() is None:
        return jsonify({
            'status': 'error',
            'message': 'Simulation is already running',
            'pid': simulator_process.pid
        }), 400

    try:
        sim_script = get_simulator_path()
        if not os.path.exists(sim_script):
             return jsonify({
                'status': 'error',
                'message': f'Simulator script not found at {sim_script}'
            }), 500

        python_exe = find_python()
        
        # Start the process
        # We use a new process group on Unix to facilitate cleanup if needed, 
        # but for simple start/stop, Popen is usually enough.
        kwargs = {}
        if sys.platform == 'win32':
            # Do NOT use CREATE_NEW_PROCESS_GROUP, so it stays in the same group/tree
            # This ensures taskkill /T on the parent also kills this child
            pass
        
        simulator_process = subprocess.Popen(
            [python_exe, sim_script],
            cwd=os.path.dirname(sim_script),
            **kwargs
        )

        return jsonify({
            'status': 'success',
            'message': 'Simulation started',
            'pid': simulator_process.pid
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@simulation_bp.route('/stop', methods=['POST'])
def stop_simulation():
    global simulator_process
    
    if simulator_process is None or simulator_process.poll() is not None:
         return jsonify({
            'status': 'success',
            'message': 'Simulation was not running'
        })

    try:
        # Kill the process
        if sys.platform == 'win32':
            # Force kill on Windows
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(simulator_process.pid)])
        else:
            simulator_process.terminate()
            try:
                simulator_process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                simulator_process.kill()
        
        simulator_process = None
        return jsonify({
            'status': 'success',
            'message': 'Simulation stopped'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to stop simulation: {str(e)}'
        }), 500
