# API Endpoints

## Auth
- `POST /auth/register` { email, password }
- `POST /auth/login` { email, password } → { accessToken, refreshToken }

## Upload & Analysis
- `POST /upload` (multipart: file) → { analysisId }
- `POST /analysis` (opcional) → procesa por ID/archivo

## Results
- `GET /results/:id` → payload AI
- `GET /history` → lista de análisis recientes