# Deploy AI En Seenode

## Seenode sin Docker (Python runtime)
- `Source Directory`: `BioSonIA/ai`
- `Build Command`: `pip install -r requirements.txt`
- `Start Command`: `python -m uvicorn server:app --host 0.0.0.0 --port $PORT --workers 1`
- `Port`: `5001`

## Requisitos de audio MP3/WAV
- Se usa `ffmpeg` para decodificar audio.
- Si el runtime no trae `ffmpeg`, el paquete `imageio-ffmpeg` lo aporta automáticamente.
- `ffprobe` no es obligatorio para el flujo principal.

## Variables recomendadas
- `PORT=5001`
- `MAX_UPLOAD_MB=20`
- `MAX_AUDIO_SECONDS=90`
- `ENABLE_SPECTROGRAMS=false`
- `ENABLE_REFERENCE_SPECTROGRAM=false`

## Verificación rápida
- Endpoint de salud: `GET /health`
- Debe devolver:
  - `"ffmpeg_available": true`
  - `"birdnet_available": true`

## Nota de integración con NestJS
- En el backend NestJS configurar:
  - `PYTHON_API_URL=https://TU-SERVICIO-AI`
- El backend llamará automáticamente a `POST /analyze`.
