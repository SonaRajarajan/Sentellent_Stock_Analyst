#!/bin/bash
# Sentellent Equity Chief - One-Click Launcher Script

echo "🚀 Starting Sentellent Equity Chief Backend & Frontend..."

# Kill any existing processes on ports 8000 & 3000
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start FastAPI Backend
echo "📦 Launching Python Backend on http://localhost:8000..."
python3 backend/app/main.py &
BACKEND_PID=$!

# Start Next.js Frontend
echo "💻 Launching Next.js Frontend on http://localhost:3000..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "--------------------------------------------------------"
echo "✅ Both servers are starting up!"
echo "👉 Frontend UI: http://localhost:3000"
echo "👉 Backend API: http://localhost:8000"
echo "--------------------------------------------------------"

wait
