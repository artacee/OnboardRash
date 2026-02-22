"""
Driver API Routes — for the Driver Companion App.

Endpoints:
  POST /api/drivers/register   — Create driver account
  POST /api/drivers/login      — Authenticate driver
  GET  /api/drivers/me         — Get current driver profile
  GET  /api/drivers/me/events  — Get events for driver's bus
  POST /api/drivers/me/trip/start — Start a trip
  POST /api/drivers/me/trip/stop  — End current trip
  GET  /api/drivers/me/trips   — Trip history
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from models import Driver, Trip, Bus, DrivingEvent

drivers_bp = Blueprint('drivers', __name__, url_prefix='/api/drivers')


# ==================== SCORE PENALTIES ====================

SEVERITY_PENALTIES = {
    'HIGH': 15.0,
    'MEDIUM': 8.0,
    'LOW': 3.0,
}


# ==================== AUTH HELPERS ====================

def get_driver_from_header():
    """Extract driver from X-Driver-Id header (simple auth for college project)."""
    driver_id = request.headers.get('X-Driver-Id')
    if not driver_id:
        return None
    try:
        return Driver.query.get(int(driver_id))
    except (ValueError, TypeError):
        return None


# ==================== REGISTRATION & LOGIN ====================

@drivers_bp.route('/register', methods=['POST'])
def register():
    """Register a new driver account."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validate required fields
    username = data.get('username', '').strip()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    
    if not username or not password or not full_name:
        return jsonify({'error': 'username, password, and full_name are required'}), 400
    
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400
    
    # Check if username already exists
    if Driver.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    
    # Create driver
    driver = Driver(
        username=username,
        password_hash=generate_password_hash(password),
        full_name=full_name,
        phone_number=data.get('phone_number', '').strip() or None,
        license_number=data.get('license_number', '').strip() or None,
    )
    
    db.session.add(driver)
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'driver': driver.to_dict(),
    }), 201


@drivers_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a driver."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username = data.get('username', '')
    password = data.get('password', '')
    
    driver = Driver.query.filter_by(username=username).first()
    
    if not driver or not check_password_hash(driver.password_hash, password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    return jsonify({
        'status': 'success',
        'driver': driver.to_dict(),
    })


# ==================== DRIVER PROFILE ====================

@drivers_bp.route('/me', methods=['GET'])
def get_profile():
    """Get current driver's profile."""
    driver = get_driver_from_header()
    if not driver:
        return jsonify({'error': 'Driver not authenticated'}), 401
    
    # Get active trip if any
    active_trip = Trip.query.filter_by(
        driver_id=driver.id,
        ended_at=None
    ).first()
    
    # Overall stats
    total_trips = Trip.query.filter_by(driver_id=driver.id).count()
    completed_trips = Trip.query.filter(
        Trip.driver_id == driver.id,
        Trip.ended_at.isnot(None)
    ).all()
    avg_score = sum(t.score for t in completed_trips) / len(completed_trips) if completed_trips else 100.0
    
    return jsonify({
        'driver': driver.to_dict(),
        'active_trip': active_trip.to_dict() if active_trip else None,
        'stats': {
            'total_trips': total_trips,
            'avg_score': round(avg_score, 1),
        }
    })


# ==================== EVENTS FOR DRIVER ====================

@drivers_bp.route('/me/events', methods=['GET'])
def get_my_events():
    """Get events for the driver's active trip or recent bus events."""
    driver = get_driver_from_header()
    if not driver:
        return jsonify({'error': 'Driver not authenticated'}), 401
    
    # Find active trip
    active_trip = Trip.query.filter_by(
        driver_id=driver.id,
        ended_at=None
    ).first()
    
    if active_trip:
        # Events during active trip
        events = DrivingEvent.query.filter(
            DrivingEvent.bus_id == active_trip.bus_id,
            DrivingEvent.timestamp >= active_trip.started_at
        ).order_by(DrivingEvent.timestamp.desc()).limit(50).all()
    else:
        # No active trip — return last 20 events across all trips
        bus_ids = [t.bus_id for t in Trip.query.filter_by(driver_id=driver.id).all()]
        if bus_ids:
            events = DrivingEvent.query.filter(
                DrivingEvent.bus_id.in_(bus_ids)
            ).order_by(DrivingEvent.timestamp.desc()).limit(20).all()
        else:
            events = []
    
    return jsonify({
        'events': [e.to_dict() for e in events],
        'count': len(events),
    })


# ==================== TRIP MANAGEMENT ====================

@drivers_bp.route('/me/trip/start', methods=['POST'])
def start_trip():
    """Start a new driving trip/shift."""
    driver = get_driver_from_header()
    if not driver:
        return jsonify({'error': 'Driver not authenticated'}), 401
    
    # Check for already active trip
    active_trip = Trip.query.filter_by(
        driver_id=driver.id,
        ended_at=None
    ).first()
    
    if active_trip:
        return jsonify({
            'error': 'You already have an active trip',
            'trip': active_trip.to_dict()
        }), 409
    
    data = request.get_json() or {}
    
    # Get bus by ID or registration number
    bus = None
    bus_id = data.get('bus_id')
    bus_registration = data.get('bus_registration')
    
    if bus_id:
        bus = Bus.query.get(bus_id)
    elif bus_registration:
        bus = Bus.query.filter_by(registration_number=bus_registration).first()
    
    if not bus:
        # Default to first bus if none specified (college project convenience)
        bus = Bus.query.first()
    
    if not bus:
        return jsonify({'error': 'No bus found. Register a bus first.'}), 404
    
    trip = Trip(
        driver_id=driver.id,
        bus_id=bus.id,
    )
    
    db.session.add(trip)
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'trip': trip.to_dict(),
    }), 201


@drivers_bp.route('/me/trip/stop', methods=['POST'])
def stop_trip():
    """End the current active trip and calculate final score."""
    driver = get_driver_from_header()
    if not driver:
        return jsonify({'error': 'Driver not authenticated'}), 401
    
    active_trip = Trip.query.filter_by(
        driver_id=driver.id,
        ended_at=None
    ).first()
    
    if not active_trip:
        return jsonify({'error': 'No active trip to stop'}), 404
    
    # End the trip
    active_trip.ended_at = datetime.utcnow()
    
    # Calculate score: start at 100, subtract per event severity
    events = DrivingEvent.query.filter(
        DrivingEvent.bus_id == active_trip.bus_id,
        DrivingEvent.timestamp >= active_trip.started_at,
        DrivingEvent.timestamp <= active_trip.ended_at,
    ).all()
    
    score = 100.0
    for event in events:
        penalty = SEVERITY_PENALTIES.get(event.severity, 5.0)
        score -= penalty
    
    active_trip.score = max(0.0, score)  # Floor at 0
    
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'trip': active_trip.to_dict(),
    })


# ==================== TRIP HISTORY ====================

@drivers_bp.route('/me/trips', methods=['GET'])
def get_trips():
    """Get trip history for the driver."""
    driver = get_driver_from_header()
    if not driver:
        return jsonify({'error': 'Driver not authenticated'}), 401
    
    trips = Trip.query.filter_by(
        driver_id=driver.id
    ).order_by(Trip.started_at.desc()).limit(50).all()
    
    return jsonify({
        'trips': [t.to_dict() for t in trips],
        'count': len(trips),
    })


# ==================== BUSES LIST (for app dropdown) ====================

@drivers_bp.route('/buses', methods=['GET'])
def list_buses():
    """List all buses (for trip start selection)."""
    buses = Bus.query.filter_by(is_active=True).all()
    return jsonify({
        'buses': [b.to_dict() for b in buses],
    })
