import eventlet
eventlet.monkey_patch()

import os
import sys
from flask import Flask, send_from_directory
from flask_socketio import SocketIO
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS

from config import config
from extensions import db, socketio, login_manager, bcrypt
from models import User


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')

    app.config.from_object(config[config_name])

    # Init extensions
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    CORS(app, supports_credentials=True, origins=allowed_origins)
    socketio.init_app(app, cors_allowed_origins=allowed_origins, async_mode='eventlet')

    login_manager.login_view = 'auth.login'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    from routes.auth import auth_bp
    from routes.quiz import quiz_bp
    from routes.kahoot import kahoot_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
    app.register_blueprint(kahoot_bp, url_prefix='/api/kahoot')

    # Register socket events
    from sockets.kahoot_events import register_kahoot_events
    register_kahoot_events(socketio)

    # Create upload folder
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)

    # Serve React frontend in production
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        dist_folder = os.path.join(app.root_path, '..', 'frontend', 'dist')
        if path and os.path.exists(os.path.join(dist_folder, path)):
            return send_from_directory(dist_folder, path)
        return send_from_directory(dist_folder, 'index.html')

    # Create DB tables
    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
