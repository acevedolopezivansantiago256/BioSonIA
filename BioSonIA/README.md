# BioSonIA — Monorepo (Next.js + Nest.js + FastAPI YAMNet)

Proyecto universitario para identificación de aves por audio (estilo BirdNET).

## Comandos rápidos

- `npm install` (en la raíz para workspaces)
- `npm run dev:front` (en `/frontend`)
- `npm run dev:back` (en `/backend`)
- `python -m venv .venv && ./.venv/Scripts/activate` (Windows) o `source .venv/bin/activate` (Linux/Mac)
- `pip install -r ai/requirements.txt`
- `python ai/server.py`
- `npx prisma migrate dev && npx prisma generate` (en `/backend`)
- `scripts/start-all.sh` (docker-compose)

## Flujo Git (GitFlow simplificado)

- Ramas: `main`, `develop`, `stage`.
- Trabaja en `feature/<nombre>` y crea PR hacia `develop`.
- Pruebas en `stage` y, si pasan, merge a `main` para release.

## Estructura

Monorepo con workspaces: `/frontend`, `/backend`, `/ai`, `/shared`, `/docs`, `/scripts`, `/docker`.

## Desarrollo local

1. Copia `.env.example` a `.env` y ajusta variables.
2. Instala dependencias: `npm install` y `pip install -r ai/requirements.txt`.
3. Levanta AI: `python ai/server.py` (por defecto puerto 5001).
4. Levanta backend: `npm run dev` en `/backend`.
5. Levanta frontend: `npm run dev` en `/frontend`.

## Docker

Usa `scripts/start-all.sh` para construir e iniciar todos los servicios con `docker-compose`.

## CI/CD

Plantillas incluidas para GitHub Actions (principal), GitLab CI, Azure DevOps y Jenkins. Edita secretos siguiendo `docs/ci_cd.md`.

## Notas de privacidad

Revisa `docs/README_universidad.md` y `docs/arquitectura.md` para políticas de manejo de audio y datos personales.