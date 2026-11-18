#!/bin/bash
# KisanAI Frontend Startup Script
set -e

FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"
cd "$FRONTEND_DIR"

echo "========================================"
echo " KisanAI Frontend Startup"
echo "========================================"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
fi

echo "Starting KisanAI frontend on http://localhost:5173 ..."
echo "(Backend must be running on http://localhost:8000)"
echo ""

npm run dev
