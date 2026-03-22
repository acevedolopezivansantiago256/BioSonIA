# Backend (Nest.js + Prisma)

## Endpoints
- `POST /auth/register`, `POST /auth/login`
- `POST /upload` (recibe archivo y delega análisis)
- `POST /analysis` (orquestado internamente por `UploadController`)
- `GET /results/:id`, `GET /history`

## Prisma
- Modelos: User, File, Analysis, AIResult.
- `npx prisma migrate dev && npx prisma generate`

## AI Service
- URL configurable: `AI_SERVICE_URL` (por defecto `http://localhost:5001`).