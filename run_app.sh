#!/bin/bash

echo "=========================================================="
echo "🚀 Starting Sentellent Contextual Agentic AI Stock Analyst"
echo "=========================================================="

# 1. Run Backend Unit Tests
echo "🧪 Running Backend Unit Tests..."
python3 backend/tests/run_tests.py
if [ $? -ne 0 ]; then
  echo "❌ Backend tests failed!"
  exit 1
fi
echo "✅ Backend tests passed cleanly!"

# 2. Start Backend FastAPI Server in background
echo "⚡ Starting FastAPI Backend Server on http://localhost:8000..."
python3 -m backend.app.main &
BACKEND_PID=$!

# 3. Start Frontend Next.js Server
echo "🌐 Starting Next.js Frontend Dashboard on http://localhost:3000..."
cd frontend
if [ -d "node_modules" ]; then
  npm run dev
else
  echo "Installing frontend dependencies..."
  npm install && npm run dev
fi

# Clean up background backend process on exit
kill $BACKEND_PID
