# BioSonIA — Guía de desarrollo (rama Develope)

Esta rama contiene todo el código del proyecto.

## Requisitos
- Node.js 18+ y npm
- Python 3.10+
- (Opcional) Docker Desktop

## Estructura del monorepo
- `frontend/` Next.js (UI, páginas Upload/Resultados)
- `backend/` Nest.js (API, endpoints `/upload`, `/analysis`, `/results/:id`)
- `ai/` FastAPI (servidor IA, espectrogramas y análisis)
- `shared/` tipos y utilidades compartidas
- `docs/` documentación adicional
- `scripts/` utilidades para desarrollo y CI
- `docker/` Dockerfiles y `docker-compose.yml`

## Arranque rápido (manual)
1. IA (FastAPI):
   - Windows: `python -m venv .venv && ./.venv/Scripts/activate`
   - Linux/Mac: `python -m venv .venv && source .venv/bin/activate`
   - `pip install -r ai/requirements.txt`
   - `python ai/server.py` → `http://localhost:5001`
2. Backend (Nest.js):
   - `cd backend && npm install`
   - `npm run dev` → `http://localhost:5000`
3. Frontend (Next.js):
   - `cd frontend && npm install`
   - `npm run dev` → `http://localhost:3000`

## Arranque rápido (Windows con script)
- Ejecuta: `powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1`
- Opcional con instalación: `powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Install`
- Abre:
  - Frontend: `http://localhost:3000`
  - Backend: `http://localhost:5000`
  - IA: `http://localhost:5001`

## Parar servicios locales
- Ejecuta: `powershell -ExecutionPolicy Bypass -File scripts/stop-local.ps1`
- Cierra procesos que usan puertos `3000`, `5000`, `5001`.

## Solución de problemas (espectrograma)
- Si no aparece el espectrograma en `/results/:id`:
  - Verifica que la IA esté arriba en `http://localhost:5001`.
  - Instala dependencias de IA: `pip install -r ai/requirements.txt`.
  - Sube un audio válido (`.wav` o `.mp3`) desde `/upload`.
  - Revisa `AI_SERVICE_URL` en el backend (por defecto `http://localhost:5001`).

## Exportar guía a PDF
- Abre `http://localhost:3000/docs` y pulsa “Descargar PDF”.
- Se ocultan header/nav automáticamente en impresión.

## Personalización de logo
- Usa `frontend/public/logo.png` o define `NEXT_PUBLIC_LOGO_PATH=/mi-logo.png`.
- Tamaños:
  - Header: `frontend/app/layout.tsx:14` (`w-36 h-auto`).
  - Login/Registro: `w-64 h-auto`.

## Flujo de prueba end-to-end
- Subir audio en la UI (`/upload`) o vía API `POST /upload`.
- Ver resultados en `/results/:id` (debe mostrar espectrograma estándar y estilo BirdNET).

## Espectrogramas (IA)
- Generación estándar y BirdNET-style disponibles desde `/analyze`.
- Código clave: `ai/server.py` y `ai/utils/audio_processing.py`.

## Git y ramas
- Trabajo activo en `Develope` (o `feature/...` con PR hacia `Develope`).
- `Stage` para estabilización y pruebas; PR hacia `main` para release.
- `main` mantiene únicamente documentación (README) y versiones aprobadas.

## Docker
- Scripts en `scripts/start-all.sh` y `docker/docker-compose.yml` para levantar los servicios.

## Despliegue con Docker Compose (Windows)
1. Copia `.env.example` a `.env` en la raíz y ajusta valores (no uses secretos por defecto).
2. Ejecuta: `powershell -ExecutionPolicy Bypass -File scripts/start-docker.ps1`
3. Apagar: `powershell -ExecutionPolicy Bypass -File scripts/stop-docker.ps1`
4. Prisma y BD:
   - En producción, desactiva `DISABLE_DB` y asegúrate de tener `DATABASE_URL` correcto.
   - Ejecuta migraciones: `docker exec -it biosonia_backend_1 npx prisma migrate deploy`.
   - Genera cliente: `docker exec -it biosonia_backend_1 npx prisma generate`.

## Base de datos (Prisma)
- Esquema: `backend/prisma/schema.prisma` con `User`, `File`, `Analysis`, `AIResult`.
- Variables: `DATABASE_URL` en formato PostgreSQL.
- Comandos locales:
  - `npx prisma migrate dev` (dev)
  - `npx prisma migrate deploy` (prod)
  - `npx prisma generate`

## Notas
- Variables de entorno: copia `.env.example` a `.env` en cada servicio si aplica.
- Si encuentras issues, revisa logs de `backend`, `frontend` y `ai`.