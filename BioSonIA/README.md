# BioSonIA — Documentación principal

Proyecto universitario para identificación de aves por audio (estilo BirdNET).

Este `main` contiene únicamente documentación (README). El código vive en las ramas de trabajo.

## Ramas

- `main`: documentación y releases aprobadas.
- `Develope`: desarrollo activo (todo el código y cambios en curso).
- `Stage`: estabilización previa a release (pruebas y validaciones).

## Cómo ejecutar el proyecto (usar la rama Develope)

1) Clonar el repositorio y cambiar a `Develope`:

```
git clone https://github.com/acevedolopezivansantiago256/BioSonIA2.0.git
cd BioSonIA2.0
git checkout Develope
```

2) Requisitos (en `Develope`):
- Node.js 18+ y npm
- Python 3.10+
- (Opcional) Docker Desktop

3) Arrancar servicios manualmente:
- IA (FastAPI):
  - Windows: `python -m venv .venv && ./.venv/Scripts/activate`
  - Linux/Mac: `python -m venv .venv && source .venv/bin/activate`
  - `pip install -r ai/requirements.txt`
  - `python ai/server.py` (por defecto `http://localhost:5001`)
- Backend (Nest.js):
  - `cd backend && npm install && npm run dev` (por defecto `http://localhost:5000`)
- Frontend (Next.js):
  - `cd frontend && npm install && npm run dev` (por defecto `http://localhost:3000`)

4) Alternativa con Docker (en `Develope`):
- Usa `docker-compose` o los scripts del repo (`scripts/start-all.sh`) para levantar todo.

## Flujo de trabajo (propuesto)

- Desarrollar en `Develope` (o ramas `feature/...` que se integran en `Develope`).
- Promover a `Stage` para pruebas integradas.
- Si todo pasa, crear PR de `Stage` a `main` para release.

## Enlaces útiles

- Código en `Develope`: https://github.com/acevedolopezivansantiago256/BioSonIA2.0/tree/Develope
- Rama de pruebas `Stage`: https://github.com/acevedolopezivansantiago256/BioSonIA2.0/tree/Stage
- Releases y documentación `main`: https://github.com/acevedolopezivansantiago256/BioSonIA2.0/tree/main

## Notas

- Este README describe cómo ejecutar el proyecto desde `Develope`, donde se encuentra el código fuente.
- Si necesitas una guía más detallada (API, arquitectura, CI/CD), consúltala en los directorios del repo dentro de la rama `Develope`.