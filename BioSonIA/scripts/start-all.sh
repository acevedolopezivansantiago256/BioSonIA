#!/usr/bin/env bash
set -euo pipefail

echo "Construyendo e iniciando servicios con docker-compose..."
cd docker
docker-compose --env-file ../.env up --build