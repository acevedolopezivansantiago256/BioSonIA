# Guía de Entrega Universitaria — BioSonIA

## Objetivo
Proyecto monorepo que identifica aves por audio con frontend, backend y servicio de IA.

## Pasos (instalación y ejecución)
1. Clona el repo y entra a `BioSonIA/`.
2. Copia `.env.example` a `.env` y ajusta variables.
3. `npm install` en la raíz.
4. Python: `python -m venv .venv && ./.venv/Scripts/activate` (Windows) y `pip install -r ai/requirements.txt`.
5. Inicia AI: `python ai/server.py`.
6. Inicia backend: `cd backend && npm run dev`.
7. Inicia frontend: `cd ../frontend && npm run dev`.

## Pruebas y demo
- `ai/test_analyze.sh` envía `example1.wav` al endpoint `/analyze` y guarda salida en `docs/sample_response.json`.
- Ejecuta tests: `npm test` en `frontend` y `backend`.

## Docker
- `scripts/start-all.sh` construye e inicia todos los servicios con `docker-compose`.

## Git y commits
- Ejecuta `scripts/git_setup.sh` para inicializar ramas `main`, `develop`, `stage`.
- Convenciones de commits: `feat`, `fix`, `docs`, `chore`, `refactor`.
- Flujo PR: `feature/*` → `develop` → pruebas en `stage` → `main`.

## Privacidad y manejo de datos
- Usa audios públicos o sintéticos.
- No compartas datos sensibles; anonimiza metadatos.
- Borra archivos de `backend/uploads` cuando no sean necesarios.