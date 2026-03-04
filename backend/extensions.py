from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager

# Initialize extensions
db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading',
                    # Werkzeug dev server cannot handle WebSocket upgrades in
                    # threading mode, so we restrict to polling for local dev.
                    # Switch to ['polling', 'websocket'] with gunicorn+eventlet.
                    transports=['polling'])
jwt = JWTManager()
