"""
Main Flask application for the Rash Driving Detection System.
Integrates Flask-SocketIO for real-time alerts to dashboard.
"""
import os
from datetime import datetime, timedelta

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
from functools import wraps
import requests

from models import db as models_db # Kept for explicit import chain if needed, but not shadowing
from extensions import db, socketio, jwt

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///rash_driving.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT Configuration
from datetime import timedelta
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', app.config['SECRET_KEY'])
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Security
API_KEY = os.getenv('API_KEY', 'default-secure-key-123')

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check header
        request_key = request.headers.get('X-API-Key')
        if request_key and request_key == API_KEY:
            return f(*args, **kwargs)
        # For dev convenience, also check query param
        if request.args.get('key') == API_KEY:
            return f(*args, **kwargs)
        return jsonify({'error': 'Unauthorized'}), 401
    return decorated_function

# Initialize extensions
CORS(app, origins="*")
db.init_app(app)
jwt.init_app(app)
socketio.init_app(app)

# Import and register blueprints
from routes.events import events_bp
from routes.buses import buses_bp
from routes.export import export_bp
from routes.media import media_bp
from routes.simulation import simulation_bp
from routes.drivers import drivers_bp
from routes.analytics import analytics_bp

app.register_blueprint(events_bp)
app.register_blueprint(buses_bp)
app.register_blueprint(export_bp)
app.register_blueprint(media_bp)
app.register_blueprint(simulation_bp)
app.register_blueprint(drivers_bp)
app.register_blueprint(analytics_bp)


# ==================== SOCKETIO EVENTS ====================

@socketio.on('connect')
def handle_connect():
    """Handle client connection to WebSocket."""
    print(f"Client connected")
    emit('connected', {'status': 'connected', 'message': 'Welcome to Rash Driving Detection System'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    print(f"Client disconnected")


def broadcast_alert(event_data):
    """
    Broadcast a new driving event to all connected dashboard clients.
    Called from the events API when a new event is received.
    """
    socketio.emit('new_alert', event_data)


# Make broadcast function available to routes (backward compatibility)
app.broadcast_alert = broadcast_alert
app.broadcast_bus_update = None # Deprecated, buses.py uses socketio directly


# ==================== PI AUTO-DISCOVERY ====================
# In-memory store: { bus_registration: { pi_ip, gps_port, demo_port, last_seen } }
_pi_registry = {}

@app.route('/api/pi/heartbeat', methods=['POST'])
def pi_heartbeat():
    """
    Called by the Raspberry Pi every ~30s to announce its IP.
    Payload: { bus_registration, pi_ip (optional), gps_port, demo_port }
    If pi_ip is omitted, we use request.remote_addr.
    """
    data = request.get_json(silent=True) or {}
    bus_reg = data.get('bus_registration')
    if not bus_reg:
        return jsonify({'error': 'bus_registration required'}), 400

    pi_ip = data.get('pi_ip') or request.remote_addr
    gps_port = data.get('gps_port', 8081)
    demo_port = data.get('demo_port', 8082)
    tunnel_url = data.get('tunnel_url')

    _pi_registry[bus_reg] = {
        'pi_ip': pi_ip,
        'gps_port': gps_port,
        'demo_port': demo_port,
        'tunnel_url': tunnel_url,
        'bus_registration': bus_reg,
        'last_seen': datetime.utcnow().isoformat(),
    }
    return jsonify({'status': 'ok'})


@app.route('/api/pi/discover', methods=['GET'])
def pi_discover():
    """
    Called by the driver app to look up a Pi's IP by bus registration.
    Query: ?bus=KL-01-AB-1234
    Returns the Pi info or 404.
    """
    bus_reg = request.args.get('bus')
    if not bus_reg:
        # If only one Pi is registered, return that one (demo convenience)
        if len(_pi_registry) == 1:
            return jsonify(list(_pi_registry.values())[0])
        return jsonify({'error': 'bus query param required'}), 400

    info = _pi_registry.get(bus_reg)
    if not info:
        # Fallback: if only one Pi is registered, return it regardless of bus
        if len(_pi_registry) == 1:
            return jsonify(list(_pi_registry.values())[0])
        return jsonify({'error': f'No Pi registered for {bus_reg}'}), 404
    return jsonify(info)


@app.route('/api/pi/all', methods=['GET'])
def pi_list_all():
    """List all registered Pi endpoints (for debugging / dashboard)."""
    return jsonify({'count': len(_pi_registry), 'devices': list(_pi_registry.values())})


@app.route('/api/tunnel', methods=['GET'])
def get_tunnel():
    """Dynamically get the active ngrok tunnel URL running on this laptop."""
    try:
        response = requests.get("http://localhost:4040/api/tunnels", timeout=2)
        if response.status_code == 200:
            data = response.json()
            if "tunnels" in data and len(data["tunnels"]) > 0:
                for tunnel in data["tunnels"]:
                    if tunnel["proto"] == "https":
                        return jsonify({'tunnel_url': tunnel["public_url"]})
                return jsonify({'tunnel_url': data["tunnels"][0]["public_url"]})
    except requests.exceptions.RequestException:
        pass
    
    return jsonify({'error': 'No active tunnel found'}), 404


# ==================== AUTH ROUTES ====================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Simple authentication endpoint for the dashboard."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username', '')
    password = data.get('password', '')

    # Valid credentials (for demo/college project)
    VALID_USERS = {
        'admin': 'admin123',
        'ajmal': '12345'
    }

    if username in VALID_USERS and VALID_USERS[username] == password:
        return jsonify({
            'status': 'success',
            'user': {
                'username': username,
                'role': 'admin'
            }
        })

    return jsonify({'error': 'Invalid username or password'}), 401


# ==================== DASHBOARD ROUTES ====================

@app.route('/')
def serve_dashboard():
    """Serve the main dashboard page."""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/health')
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({'status': 'healthy', 'service': 'rash-driving-detection'})


# SocketIO broadcast logic has been moved to routes/events.py


# ==================== DATABASE INITIALIZATION ====================

def init_db():
    """Initialize the database and create sample data."""
    with app.app_context():
        db.create_all()
        
        # Add sample buses if none exist
        from models import Bus
        if Bus.query.count() == 0:
            sample_buses = [
                Bus(registration_number='KL-01-AB-1234', driver_name='Rajesh Kumar', route='Kollam - Trivandrum'),
                Bus(registration_number='KL-01-CD-5678', driver_name='Suresh Nair', route='Kollam - Kochi'),
                Bus(registration_number='KL-01-EF-9012', driver_name='Anil Menon', route='Kollam - Alappuzha'),
            ]
            for bus in sample_buses:
                db.session.add(bus)
            db.session.commit()
            print("Sample buses created!")
        
        print("Database initialized!")


# ==================== MAIN ====================

if __name__ == '__main__':
    init_db()
    print("\n============================================================")
    print("BUS RASH DRIVING DETECTION SYSTEM")
    print("============================================================")
    print("Server starting on http://localhost:5000")
    print("Dashboard: http://localhost:5000")
    print("API Docs: POST /api/events, GET /api/events, GET /api/buses")
    
    # Try to see if ngrok is running
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=1)
        if response.status_code == 200 and len(response.json().get('tunnels', [])) > 0:
            tunnel = response.json()['tunnels'][0]['public_url']
            print(f"🔗 TUNNEL ACTIVE: {tunnel}")
            print("   Make sure to put THIS URL in your Pi's SERVER_URL")
            print("   and your Driver App's EXPO_PUBLIC_API_URL.")
    except Exception:
        print("⚠️  No tunnel (ngrok) detected.")
        print("   If you want to use the Pi/Phone on different networks from the laptop,")
        print("   start ngrok in another terminal: ngrok http 5000")
        
    print("="*60 + "\n")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)
