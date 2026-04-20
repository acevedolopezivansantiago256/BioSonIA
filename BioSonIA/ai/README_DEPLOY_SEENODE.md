# Deploy AI En Seenode

## Requisitos del contenedor
- Instalar `ffmpeg` y `ffprobe` (en este proyecto ya se hace en `docker/Dockerfile.ai`).
- Ejecutar el servicio en el puerto `5001`.

## Variables recomendadas
- `PORT=5001`
- `MAX_UPLOAD_MB=20`
- `MAX_AUDIO_SECONDS=90`
- `ENABLE_SPECTROGRAMS=true`
- `ENABLE_REFERENCE_SPECTROGRAM=false`

## Verificación rápida
- Endpoint de salud: `GET /health`
- Debe devolver:
  - `"ffmpeg_available": true`
  - `"ffprobe_available": true`
  - `"birdnet_available": true`

## Nota de integración con NestJS
- En el backend NestJS configurar:
  - `PYTHON_API_URL=https://TU-SERVICIO-AI`
- El backend llamará automáticamente a `POST /analyze`.
