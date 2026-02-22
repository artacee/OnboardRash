"""
Main Flask application for the Rash Driving Detection System.
Integrates Flask-SocketIO for real-time alerts to dashboard.
"""
import os

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
from functools import wraps

from models import db
from extensions import db, socketio

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///rash_driving.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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
socketio.init_app(app)

# Import and register blueprints
from routes.events import events_bp
from routes.buses import buses_bp
from routes.export import export_bp
from routes.media import media_bp
from routes.simulation import simulation_bp
from routes.drivers import drivers_bp

app.register_blueprint(events_bp)
app.register_blueprint(buses_bp)
app.register_blueprint(export_bp)
app.register_blueprint(media_bp)
app.register_blueprint(simulation_bp)
app.register_blueprint(drivers_bp)


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


# ==================== OVERRIDE EVENTS ROUTE ====================
# Re-register the events POST to include SocketIO broadcast

from routes.events import receive_event as original_receive_event

@app.route('/api/events', methods=['POST'], endpoint='events_with_broadcast')
@require_api_key
def receive_event_with_broadcast():
    """Receive event and broadcast to dashboard.
    AUTHENTICATED ENDPOINT
    """
    from models import process_event_data
    
    data = request.get_json()
    event, error = process_event_data(data)
    
    if error:
        return jsonify(error), 400
    
    # Broadcast to all connected clients
    event_dict = event.to_dict()
    broadcast_alert(event_dict)
    
    return jsonify({
        'status': 'received',
        'event_id': event.id,
        'event': event_dict
    }), 201


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
    print("="*60 + "\n")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
