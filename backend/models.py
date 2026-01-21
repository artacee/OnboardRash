"""
Database models for the Rash Driving Detection System.
Uses Flask-SQLAlchemy for ORM.
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Bus(db.Model):
    """Represents a registered bus in the system."""
    __tablename__ = 'buses'
    
    id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(20), unique=True, nullable=False)
    driver_name = db.Column(db.String(100), nullable=True)
    route = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to events
    events = db.relationship('DrivingEvent', backref='bus', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'registration_number': self.registration_number,
            'driver_name': self.driver_name,
            'route': self.route,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DrivingEvent(db.Model):
    """Represents a detected rash driving event."""
    __tablename__ = 'driving_events'
    
    id = db.Column(db.Integer, primary_key=True)
    bus_id = db.Column(db.Integer, db.ForeignKey('buses.id'), nullable=False)
    
    # Event classification
    event_type = db.Column(db.String(50), nullable=False)  # HARSH_BRAKE, HARSH_ACCEL, AGGRESSIVE_TURN, TAILGATING
    severity = db.Column(db.String(20), nullable=False)    # LOW, MEDIUM, HIGH
    
    # Sensor data
    acceleration_x = db.Column(db.Float, nullable=True)    # g-force
    acceleration_y = db.Column(db.Float, nullable=True)    # g-force
    acceleration_z = db.Column(db.Float, nullable=True)    # g-force
    speed = db.Column(db.Float, nullable=True)             # km/h
    
    # Location
    location_lat = db.Column(db.Float, nullable=True)
    location_lng = db.Column(db.Float, nullable=True)
    location_address = db.Column(db.String(200), nullable=True)
    
    # Timestamps
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Alert status
    alert_sent = db.Column(db.Boolean, default=False)
    acknowledged = db.Column(db.Boolean, default=False)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    
    # Video evidence (camera capture)
    video_path = db.Column(db.String(500), nullable=True)   # Local path on Pi
    snapshot_path = db.Column(db.String(500), nullable=True)
    snapshot_url = db.Column(db.String(500), nullable=True)  # URL after upload
    video_url = db.Column(db.String(500), nullable=True)     # URL after upload
    
    def to_dict(self):
        return {
            'id': self.id,
            'bus_id': self.bus_id,
            'bus_registration': self.bus.registration_number if self.bus else None,
            'event_type': self.event_type,
            'severity': self.severity,
            'acceleration_x': self.acceleration_x,
            'acceleration_y': self.acceleration_y,
            'acceleration_z': self.acceleration_z,
            'speed': self.speed,
            'location': {
                'lat': self.location_lat,
                'lng': self.location_lng,
                'address': self.location_address
            },
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'alert_sent': self.alert_sent,
            'acknowledged': self.acknowledged,
            'has_video': bool(self.video_url or self.video_path),
            'has_snapshot': bool(self.snapshot_url or self.snapshot_path),
            'snapshot_url': self.snapshot_url,
            'video_url': self.video_url
        }


class BusLocation(db.Model):
    """Stores the latest location of each bus for live tracking."""
    __tablename__ = 'bus_locations'
    
    id = db.Column(db.Integer, primary_key=True)
    bus_id = db.Column(db.Integer, db.ForeignKey('buses.id'), nullable=False, unique=True)
    
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    speed = db.Column(db.Float, nullable=True)
    heading = db.Column(db.Float, nullable=True)  # Direction in degrees
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    bus = db.relationship('Bus', backref=db.backref('location', uselist=False))
    
    def to_dict(self):
        return {
            'bus_id': self.bus_id,
            'bus_registration': self.bus.registration_number if self.bus else None,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'speed': self.speed,
            'heading': self.heading,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
