# Arquitectura de BioSonIA

- Monorepo con `frontend` (Next.js), `backend` (Nest.js), `ai` (FastAPI).
- Comunicación: `frontend` → `backend` → `ai`.
- Persistencia: PostgreSQL via Prisma.
- Infraestructura local: Docker Compose para `db`, `ai`, `backend`, `frontend`.

## Componentes
- Frontend: App Router, Tailwind, Recharts.
- Backend: JWT auth, upload con Multer, análisis orquestado, resultados e historial.
- AI: Pipeline YAMNet (o modelo toy) con espectrograma y respuesta JSON.