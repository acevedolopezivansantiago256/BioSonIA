# Manual de Usuario

## Instalación
- Node 18+, Python 3.10+ y Docker.
- `npm install` en la raíz.
- `python -m venv .venv` y activar entorno.
- `pip install -r ai/requirements.txt`.

## Ejecución local
- `python ai/server.py` (AI en 5001).
- `npm run dev` en `/backend` (5000).
- `npm run dev` en `/frontend` (3000).

## Pruebas
- `npm test` en frontend/backend.
- `ai/test_analyze.sh` para probar `/analyze` con `example1.wav`.

## Entrega
- Usa `scripts/git_setup.sh` para ramas y commits.
- Agrega remoto: `git remote add origin <URL>`.
- Crea PRs desde `feature/*` hacia `develop`, prueba en `stage`, merge a `main`.