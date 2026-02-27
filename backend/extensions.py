from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO

# Initialize extensions
db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')
