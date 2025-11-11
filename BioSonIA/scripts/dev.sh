#!/usr/bin/env bash
set -euo pipefail

echo "Iniciando AI (5001)..."
python ai/server.py &
AI_PID=$!

echo "Iniciando backend (5000)..."
cd backend && npm run dev &
BACK_PID=$!
cd ..

echo "Iniciando frontend (3000)..."
cd frontend && npm run dev &
FRONT_PID=$!
cd ..

echo "Servicios levantados: AI=$AI_PID BACK=$BACK_PID FRONT=$FRONT_PID"
wait