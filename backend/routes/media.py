"""
Media API routes for the Rash Driving Detection System.
Handles video and snapshot uploads for event evidence.
"""
import os
import base64
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from datetime import datetime
from werkzeug.utils import secure_filename
from models import db, DrivingEvent

media_bp = Blueprint('media', __name__)

# Allowed file extensions
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'webm'}
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}

# Upload directory
UPLOAD_FOLDER = 'uploads'


def allowed_video(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS


def allowed_image(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


def get_upload_folder():
    """Get or create upload folder."""
    folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', UPLOAD_FOLDER)
    os.makedirs(folder, exist_ok=True)
    return folder


@media_bp.route('/api/events/<int:event_id>/video', methods=['POST'])
def upload_video(event_id):
    """
    Upload video evidence for an event.
    
    Expects multipart form with 'video' file.
    """
    event = DrivingEvent.query.get_or_404(event_id)
    
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_video(file.filename):
        return jsonify({'error': 'Invalid video format'}), 400
    
    # Save file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = secure_filename(f"event_{event_id}_{timestamp}.mp4")
    filepath = os.path.join(get_upload_folder(), filename)
    file.save(filepath)
    
    # Update event
    event.video_url = f"/api/media/{filename}"
    db.session.commit()
    
    return jsonify({
        'status': 'uploaded',
        'video_url': event.video_url
    })


@media_bp.route('/api/events/<int:event_id>/snapshot', methods=['POST'])
def upload_snapshot(event_id):
    """
    Upload snapshot image for an event.
    
    Accepts either:
    - Multipart form with 'image' file
    - JSON with 'base64' image data
    """
    event = DrivingEvent.query.get_or_404(event_id)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"event_{event_id}_{timestamp}.jpg"
    filepath = os.path.join(get_upload_folder(), filename)
    
    # Handle file upload
    if 'image' in request.files:
        file = request.files['image']
        if not allowed_image(file.filename):
            return jsonify({'error': 'Invalid image format'}), 400
        file.save(filepath)
    
    # Handle base64 upload
    elif request.is_json and 'base64' in request.json:
        try:
            image_data = base64.b64decode(request.json['base64'])
            with open(filepath, 'wb') as f:
                f.write(image_data)
        except Exception as e:
            return jsonify({'error': f'Invalid base64 data: {e}'}), 400
    
    else:
        return jsonify({'error': 'No image provided'}), 400
    
    # Update event
    event.snapshot_url = f"/api/media/{filename}"
    db.session.commit()
    
    return jsonify({
        'status': 'uploaded',
        'snapshot_url': event.snapshot_url
    })


@media_bp.route('/api/media/<path:filename>')
def serve_media(filename):
    """Serve uploaded media files."""
    return send_from_directory(get_upload_folder(), filename)


@media_bp.route('/api/events/<int:event_id>/evidence', methods=['GET'])
def get_evidence(event_id):
    """Get all evidence (video and snapshot) for an event."""
    event = DrivingEvent.query.get_or_404(event_id)
    
    return jsonify({
        'event_id': event_id,
        'has_video': bool(event.video_url),
        'has_snapshot': bool(event.snapshot_url),
        'video_url': event.video_url,
        'snapshot_url': event.snapshot_url
    })
