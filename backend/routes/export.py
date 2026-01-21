"""
Export API routes for the Rash Driving Detection System.
Handles exporting events to CSV and generating reports.
"""
from flask import Blueprint, request, Response
from datetime import datetime, timedelta
from models import db, DrivingEvent, Bus
import csv
import io

export_bp = Blueprint('export', __name__)


@export_bp.route('/api/export/events', methods=['GET'])
def export_events_csv():
    """
    Export events to CSV format.
    
    Query params:
    - bus_id: Filter by bus ID
    - since: Get events after this date (YYYY-MM-DD)
    - until: Get events before this date (YYYY-MM-DD)
    """
    query = DrivingEvent.query
    
    # Apply filters
    if request.args.get('bus_id'):
        query = query.filter_by(bus_id=request.args.get('bus_id'))
    
    if request.args.get('since'):
        try:
            since = datetime.strptime(request.args.get('since'), '%Y-%m-%d')
            query = query.filter(DrivingEvent.timestamp >= since)
        except:
            pass
    
    if request.args.get('until'):
        try:
            until = datetime.strptime(request.args.get('until'), '%Y-%m-%d')
            until = until.replace(hour=23, minute=59, second=59)
            query = query.filter(DrivingEvent.timestamp <= until)
        except:
            pass
    
    # Default: last 7 days
    if not request.args.get('since'):
        week_ago = datetime.utcnow() - timedelta(days=7)
        query = query.filter(DrivingEvent.timestamp >= week_ago)
    
    events = query.order_by(DrivingEvent.timestamp.desc()).all()
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'ID', 'Timestamp', 'Bus Registration', 'Driver', 'Event Type', 
        'Severity', 'Acceleration X (g)', 'Acceleration Y (g)', 
        'Speed (km/h)', 'Latitude', 'Longitude', 'Location Address',
        'Acknowledged'
    ])
    
    # Data rows
    for event in events:
        writer.writerow([
            event.id,
            event.timestamp.strftime('%Y-%m-%d %H:%M:%S') if event.timestamp else '',
            event.bus.registration_number if event.bus else '',
            event.bus.driver_name if event.bus else '',
            event.event_type,
            event.severity,
            event.acceleration_x,
            event.acceleration_y,
            event.speed,
            event.location_lat,
            event.location_lng,
            event.location_address or '',
            'Yes' if event.acknowledged else 'No'
        ])
    
    # Create response
    output.seek(0)
    filename = f"rash_driving_events_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename={filename}',
            'Content-Type': 'text/csv; charset=utf-8'
        }
    )


@export_bp.route('/api/export/report', methods=['GET'])
def generate_report():
    """
    Generate a summary report in JSON format.
    
    Query params:
    - period: 'today', 'week', 'month' (default: 'today')
    """
    period = request.args.get('period', 'today')
    
    # Calculate date range
    now = datetime.utcnow()
    if period == 'today':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'week':
        start_date = now - timedelta(days=7)
    elif period == 'month':
        start_date = now - timedelta(days=30)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Query events
    events = DrivingEvent.query.filter(DrivingEvent.timestamp >= start_date).all()
    
    # Calculate statistics
    total_events = len(events)
    severity_counts = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
    event_type_counts = {}
    bus_event_counts = {}
    
    for event in events:
        severity_counts[event.severity] = severity_counts.get(event.severity, 0) + 1
        event_type_counts[event.event_type] = event_type_counts.get(event.event_type, 0) + 1
        
        bus_reg = event.bus.registration_number if event.bus else 'Unknown'
        bus_event_counts[bus_reg] = bus_event_counts.get(bus_reg, 0) + 1
    
    # Find top offenders
    top_offenders = sorted(bus_event_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        'report_period': period,
        'start_date': start_date.isoformat(),
        'end_date': now.isoformat(),
        'summary': {
            'total_events': total_events,
            'by_severity': severity_counts,
            'by_type': event_type_counts
        },
        'top_offenders': [
            {'bus': bus, 'events': count} for bus, count in top_offenders
        ],
        'generated_at': now.isoformat()
    }
