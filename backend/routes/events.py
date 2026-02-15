"""
Events API routes for the Rash Driving Detection System.
Handles receiving events from IoT devices and serving data to dashboard.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from models import db, DrivingEvent, Bus, BusLocation

events_bp = Blueprint('events', __name__)


@events_bp.route('/api/events', methods=['POST'])
def receive_event():
    """
    Receive a driving event from an IoT device.
    This is the main endpoint that the Raspberry Pi / simulator calls.
    
    Expected JSON:
    {
        "bus_id": 1,  // or "bus_registration": "KL-01-AB-1234"
        "event_type": "HARSH_BRAKE",
        "severity": "HIGH",
        "acceleration_x": -1.8,
        "acceleration_y": 0.1,
        "acceleration_z": 1.0,
        "speed": 45.5,
        "location": {
            "lat": 9.9312,
            "lng": 76.2673
        },
        "timestamp": "2026-01-21T15:30:00"  // optional, uses server time if not provided
    }
    """
    from models import process_event_data
    
    data = request.get_json()
    event, error = process_event_data(data)
    
    if error:
        return jsonify(error), 400
    
    # Return event data for SocketIO broadcast (done in main app)
    return jsonify({
        'status': 'received',
        'event_id': event.id,
        'event': event.to_dict()
    }), 201


@events_bp.route('/api/events', methods=['GET'])
def get_events():
    """
    Get list of driving events with optional filters.
    
    Query params:
    - bus_id: Filter by bus ID
    - event_type: Filter by event type (HARSH_BRAKE, HARSH_ACCEL, etc.)
    - severity: Filter by severity (LOW, MEDIUM, HIGH)
    - since: Get events after this timestamp (ISO format)
    - limit: Max number of events (default 100)
    """
    query = DrivingEvent.query
    
    # Apply filters
    if request.args.get('bus_id'):
        query = query.filter_by(bus_id=request.args.get('bus_id'))
    
    if request.args.get('event_type'):
        query = query.filter_by(event_type=request.args.get('event_type'))
    
    if request.args.get('severity'):
        query = query.filter_by(severity=request.args.get('severity'))
    
    if request.args.get('since'):
        try:
            since = datetime.fromisoformat(request.args.get('since').replace('Z', '+00:00'))
            query = query.filter(DrivingEvent.timestamp >= since)
        except:
            pass
    
    # Default: last 24 hours if no filter
    if not any([request.args.get('bus_id'), request.args.get('since')]):
        yesterday = datetime.utcnow() - timedelta(days=1)
        query = query.filter(DrivingEvent.timestamp >= yesterday)
    
    # Order and limit
    limit = min(int(request.args.get('limit', 100)), 500)
    events = query.order_by(DrivingEvent.timestamp.desc()).limit(limit).all()
    
    return jsonify({
        'count': len(events),
        'events': [e.to_dict() for e in events]
    })


@events_bp.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get a specific event by ID."""
    event = DrivingEvent.query.get_or_404(event_id)
    return jsonify(event.to_dict())


@events_bp.route('/api/events/<int:event_id>/acknowledge', methods=['POST'])
def acknowledge_event(event_id):
    """Mark an event as acknowledged by an authority."""
    event = DrivingEvent.query.get_or_404(event_id)
    event.acknowledged = True
    event.acknowledged_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'acknowledged', 'event': event.to_dict()})


@events_bp.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics for dashboard summary cards."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's events
    today_events = DrivingEvent.query.filter(DrivingEvent.timestamp >= today).count()
    
    # High severity today
    high_severity = DrivingEvent.query.filter(
        DrivingEvent.timestamp >= today,
        DrivingEvent.severity == 'HIGH'
    ).count()
    
    # Active buses (updated in last 5 minutes)
    five_min_ago = datetime.utcnow() - timedelta(minutes=5)
    active_buses = BusLocation.query.filter(BusLocation.updated_at >= five_min_ago).count()
    
    # Total registered buses
    total_buses = Bus.query.filter_by(is_active=True).count()
    
    # Events by type today
    events_by_type = db.session.query(
        DrivingEvent.event_type,
        db.func.count(DrivingEvent.id)
    ).filter(
        DrivingEvent.timestamp >= today
    ).group_by(DrivingEvent.event_type).all()
    
    return jsonify({
        'today_events': today_events,
        'high_severity': high_severity,
        'active_buses': active_buses,
        'total_buses': total_buses,
        'events_by_type': {t: c for t, c in events_by_type}
    })
