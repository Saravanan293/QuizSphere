import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-quizsphere')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///quizsphere.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB upload limit
    UPLOAD_FOLDER = 'uploads'
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SECURE = True

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
