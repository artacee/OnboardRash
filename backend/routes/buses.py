"""
Buses API routes for the Rash Driving Detection System.
Handles bus registration and location tracking.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from models import db, Bus, BusLocation, DrivingEvent

buses_bp = Blueprint('buses', __name__)


@buses_bp.route('/api/buses', methods=['GET'])
def get_buses():
    """Get list of all registered buses."""
    buses = Bus.query.filter_by(is_active=True).all()
    return jsonify({
        'count': len(buses),
        'buses': [b.to_dict() for b in buses]
    })


@buses_bp.route('/api/buses', methods=['POST'])
def register_bus():
    """
    Register a new bus in the system.
    
    Expected JSON:
    {
        "registration_number": "KL-01-AB-1234",
        "driver_name": "John Doe",  // optional
        "route": "Kollam - Trivandrum"  // optional
    }
    """
    data = request.get_json()
    
    if not data or not data.get('registration_number'):
        return jsonify({'error': 'Registration number is required'}), 400
    
    # Check if already exists
    existing = Bus.query.filter_by(registration_number=data['registration_number']).first()
    if existing:
        return jsonify({'error': 'Bus already registered', 'bus': existing.to_dict()}), 409
    
    bus = Bus(
        registration_number=data['registration_number'],
        driver_name=data.get('driver_name'),
        route=data.get('route')
    )
    
    db.session.add(bus)
    db.session.commit()
    
    return jsonify({'status': 'registered', 'bus': bus.to_dict()}), 201


@buses_bp.route('/api/buses/<int:bus_id>', methods=['GET'])
def get_bus(bus_id):
    """Get details of a specific bus."""
    bus = Bus.query.get_or_404(bus_id)
    
    # Get latest location
    location = BusLocation.query.filter_by(bus_id=bus_id).first()
    
    # Get event count for today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_events = DrivingEvent.query.filter(
        DrivingEvent.bus_id == bus_id,
        DrivingEvent.timestamp >= today
    ).count()
    
    result = bus.to_dict()
    result['location'] = location.to_dict() if location else None
    result['today_events'] = today_events
    
    return jsonify(result)


@buses_bp.route('/api/buses/<int:bus_id>/events', methods=['GET'])
def get_bus_events(bus_id):
    """Get all events for a specific bus."""
    bus = Bus.query.get_or_404(bus_id)
    
    # Get limit and offset
    limit = min(int(request.args.get('limit', 50)), 200)
    offset = int(request.args.get('offset', 0))
    
    events = DrivingEvent.query.filter_by(bus_id=bus_id)\
        .order_by(DrivingEvent.timestamp.desc())\
        .limit(limit).offset(offset).all()
    
    return jsonify({
        'bus': bus.to_dict(),
        'count': len(events),
        'events': [e.to_dict() for e in events]
    })


@buses_bp.route('/api/buses/locations', methods=['GET'])
def get_all_locations():
    """
    Get current locations of all active buses.
    Used for the live map display.
    """
    # Get locations updated in last 10 minutes (considered active)
    ten_min_ago = datetime.utcnow() - timedelta(minutes=10)
    
    locations = BusLocation.query.filter(
        BusLocation.updated_at >= ten_min_ago
    ).all()
    
    return jsonify({
        'count': len(locations),
        'locations': [loc.to_dict() for loc in locations]
    })


@buses_bp.route('/api/buses/<int:bus_id>/location', methods=['POST'])
def update_location(bus_id):
    """
    Update a bus's current location.
    Called by IoT device to update position even without events.
    
    Expected JSON:
    {
        "lat": 9.9312,
        "lng": 76.2673,
        "speed": 45.5,
        "heading": 180
    }
    """
    bus = Bus.query.get_or_404(bus_id)
    data = request.get_json()
    
    if not data or not data.get('lat') or not data.get('lng'):
        return jsonify({'error': 'lat and lng are required'}), 400
    
    location = BusLocation.query.filter_by(bus_id=bus_id).first()
    if location:
        location.latitude = data['lat']
        location.longitude = data['lng']
        location.speed = data.get('speed')
        location.heading = data.get('heading')
        location.updated_at = datetime.utcnow()
    else:
        location = BusLocation(
            bus_id=bus_id,
            latitude=data['lat'],
            longitude=data['lng'],
            speed=data.get('speed'),
            heading=data.get('heading')
        )
        db.session.add(location)
    
    db.session.commit()
    
    return jsonify({'status': 'updated', 'location': location.to_dict()})
