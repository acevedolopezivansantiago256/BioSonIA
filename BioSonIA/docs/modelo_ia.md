# Modelo de IA (YAMNet)

- Entrada: audio mono 16 kHz.
- Preprocesado: mel-spectrogram.
- Inferencia: YAMNet (TF Hub) o fallback `toy` si no disponible.
- Mapeo de clases: `ai/model/class_map.csv`.
- Salida: especie principal, probabilidad, top-3, espectrograma en base64.

## Descarga de YAMNet
- Si la descarga falla, usa `ai/scripts/download_yamnet.py` y consulta su salida.