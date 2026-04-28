#!/bin/bash
# Startup script for Azure App Service
# Install dependencies
pip install -r requirements.txt
# Run the application using eventlet for SocketIO
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:8000 app:app
