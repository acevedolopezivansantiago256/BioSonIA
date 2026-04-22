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
- URL configurable: `PYTHON_API_URL` (recomendada) o `AI_SERVICE_URL` (compatibilidad).
- Si ninguna está definida, usa por defecto `http://localhost:5001`.
