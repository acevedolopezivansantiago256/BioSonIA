BioSonIA — Guía de desarrollo (rama Develope)
Esta rama contiene todo el código del proyecto.

Requisitos
Node.js 18+
y npm
Python 3.10+
(Opcional) Docker Desktop

Estructura del monorepo


frontend/ Next.js (UI, páginas Upload/Resultados)

backend/ Nest.js (API, endpoints /upload, /analysis, /results/:id)

ai/ FastAPI (servidor IA, espectrogramas y análisis)

shared/ tipos y utilidades compartidas

docs/ documentación adicional

scripts/ utilidades para desarrollo y CI

docker/ Dockerfiles y docker-compose.yml


Arranque rápido (manual)
IA (FastAPI):
Windows: python -m venv .venv && ./.venv/Scripts/activate
Linux/Mac: python -m venv .venv && source .venv/bin/activate
pip install -r ai/requirements.txt
python ai/server.py → http://localhost:5001
Backend (Nest.js):
cd backend && npm install
npm run dev → http://localhost:5000
Frontend (Next.js):
cd frontend && npm install
npm run dev → http://localhost:3000
Flujo de prueba end-to-end
Subir audio en la UI (/upload) o vía API POST /upload.
Ver resultados en /results/:id (debe mostrar espectrograma estándar y estilo BirdNET).

Espectrogramas (IA)
Generación estándar y BirdNET-style disponibles desde /analyze.
Código clave: ai/server.py y ai/utils/audio_processing.py.

Git y ramas
Trabajo activo en Develope (o feature/... con PR hacia Develope).
Stage para estabilización y pruebas; PR hacia main para release.
main mantiene únicamente documentación (README) y versiones aprobadas.
Docker
Scripts en scripts/start-all.sh y docker/docker-compose.yml para levantar los servicios.
Notas
Variables de entorno: copia .env.example a .env en cada servicio si aplica.
Si encuentras issues, revisa logs de backend, frontend y ai.
