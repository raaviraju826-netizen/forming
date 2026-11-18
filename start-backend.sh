#!/bin/bash
# KisanAI Backend Startup Script
set -e

BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
cd "$BACKEND_DIR"

echo "========================================"
echo " KisanAI Backend Startup"
echo "========================================"

# Create venv if not exists
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet

# Check for .env
if [ ! -f ".env" ]; then
  echo "WARNING: .env not found. Copying from .env.example..."
  cp .env.example .env
  echo "IMPORTANT: Edit backend/.env and configure your database and API keys."
fi

# Generate a secret key if not set
python3 -c "
import os, secrets
env_path = '.env'
with open(env_path) as f:
    content = f.read()
if 'your-secret-key-change-this' in content:
    key = secrets.token_hex(32)
    content = content.replace('your-secret-key-change-this', key)
    with open(env_path, 'w') as f:
        f.write(content)
    print(f'Generated SECRET_KEY and saved to .env')
"

echo ""
echo "IMPORTANT: Before starting, ensure PostgreSQL is running with:"
echo "  Database:  kisanai_db"
echo "  User:      kisanai"
echo "  Password:  kisanai_password"
echo ""
echo "If not set up, run:"
echo "  createuser -P kisanai  (enter password: kisanai_password)"
echo "  createdb -O kisanai kisanai_db"
echo ""
echo "Starting KisanAI backend on http://localhost:8000 ..."
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
