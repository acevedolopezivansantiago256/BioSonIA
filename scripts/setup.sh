#!/usr/bin/env bash
set -euo pipefail

echo "Instalando dependencias..."
npm install

echo "Configurando Python venv (si no existe)..."
python -m venv .venv || true
source .venv/bin/activate || true
pip install -r ai/requirements.txt || true

echo "Generando dataset de ejemplo..."
bash ai/scripts/fetch_dataset.sh

echo "Setup completado."