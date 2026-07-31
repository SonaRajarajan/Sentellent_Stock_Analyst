#!/bin/bash
# Sentellent Equity Chief - One-Click Single Terminal Launcher Script

set -e

echo "=========================================================="
echo "🚀 Starting Sentellent Equity Chief (Backend + Frontend)"
echo "=========================================================="

# Function to clean up background processes on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Stopping Sentellent Equity Chief servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    echo "👋 Shutdown complete."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any stale background processes on ports 8000 & 3000
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# 1. Start Python Backend on port 8000
echo "📦 Starting FastAPI Backend Server (Port 8000)..."
python3 -m app.main &
BACKEND_PID=$!

# 2. Start Next.js Frontend on port 3000
echo "💻 Starting Next.js Frontend Dev Server (Port 3000)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "=========================================================="
echo "✅ Both servers are now running concurrently!"
echo "👉 Open Application: http://localhost:3000"
echo "👉 Backend REST API: http://localhost:8000"
echo "👉 API Documentation: http://localhost:8000/docs"
echo "=========================================================="
echo "Press [Ctrl+C] to stop both servers."

wait
