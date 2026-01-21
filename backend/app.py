"""
Main Flask application for the Rash Driving Detection System.
Integrates Flask-SocketIO for real-time alerts to dashboard.
"""
import os

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv

from models import db

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='../dashboard', static_url_path='')
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
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Import and register blueprints
from routes.events import events_bp
from routes.buses import buses_bp
from routes.export import export_bp
from routes.media import media_bp

app.register_blueprint(events_bp)
app.register_blueprint(buses_bp)
app.register_blueprint(export_bp)
app.register_blueprint(media_bp)


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


# Make broadcast function available to routes
app.broadcast_alert = broadcast_alert


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
    # Remove the original route and use this one
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Import here to avoid circular import
    from models import DrivingEvent, Bus, BusLocation
    from datetime import datetime
    
    # Get or create bus
    bus = None
    if 'bus_id' in data:
        bus = Bus.query.get(data['bus_id'])
    elif 'bus_registration' in data:
        bus = Bus.query.filter_by(registration_number=data['bus_registration']).first()
        if not bus:
            bus = Bus(registration_number=data['bus_registration'])
            db.session.add(bus)
            db.session.commit()
    
    if not bus:
        return jsonify({'error': 'Bus not found and no registration provided'}), 400
    
    # Parse timestamp
    timestamp = datetime.utcnow()
    if 'timestamp' in data:
        try:
            timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
        except:
            pass
    
    # Create event
    event = DrivingEvent(
        bus_id=bus.id,
        event_type=data.get('event_type', 'UNKNOWN'),
        severity=data.get('severity', 'MEDIUM'),
        acceleration_x=data.get('acceleration_x'),
        acceleration_y=data.get('acceleration_y'),
        acceleration_z=data.get('acceleration_z'),
        speed=data.get('speed'),
        location_lat=data.get('location', {}).get('lat'),
        location_lng=data.get('location', {}).get('lng'),
        location_address=data.get('location', {}).get('address'),
        timestamp=timestamp,
        alert_sent=True
    )
    
    db.session.add(event)
    
    # Update bus location
    location = data.get('location', {})
    if location.get('lat') and location.get('lng'):
        bus_location = BusLocation.query.filter_by(bus_id=bus.id).first()
        if bus_location:
            bus_location.latitude = location['lat']
            bus_location.longitude = location['lng']
            bus_location.speed = data.get('speed')
            bus_location.updated_at = datetime.utcnow()
        else:
            bus_location = BusLocation(
                bus_id=bus.id,
                latitude=location['lat'],
                longitude=location['lng'],
                speed=data.get('speed')
            )
            db.session.add(bus_location)
    
    db.session.commit()
    
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
    print("\n" + "="*60)
    print("🚌 RASH DRIVING DETECTION SYSTEM")
    print("="*60)
    print("Server starting on http://localhost:5000")
    print("Dashboard: http://localhost:5000")
    print("API Docs: POST /api/events, GET /api/events, GET /api/buses")
    print("="*60 + "\n")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
