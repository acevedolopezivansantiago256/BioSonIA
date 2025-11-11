import os
import io
import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from model.bird_classifier import BirdClassifier

app = FastAPI(title="BioSonIA AI Service")
clf = BirdClassifier()

@app.get('/health')
def health():
    return {"ok": True, "model": clf.model_name}

@app.post('/analyze')
async def analyze(file: UploadFile = File(...)):
    try:
        raw = await file.read()
        y = None
        sr = 16000
        b64 = None
        # Importación perezosa de utilidades de audio, con fallback si no están disponibles
        try:
            from utils.audio_processing import load_audio_mono_16k, mel_spectrogram, spectrogram_png_bytes
            y, sr = load_audio_mono_16k(io.BytesIO(raw))
            S = mel_spectrogram(y, sr)
            # Espectrograma estándar
            png_std = spectrogram_png_bytes(S, cmap='magma', title='Spectrogram')
            b64 = base64.b64encode(png_std).decode('ascii')
            # Espectrograma estilo BirdNET (cmap viridis, sin colorbar)
            png_birdnet = spectrogram_png_bytes(S, cmap='viridis', title='BirdNET-style Spectrogram')
            b64_birdnet = base64.b64encode(png_birdnet).decode('ascii')
        except Exception:
            # Fallback: no procesamos espectrograma si faltan dependencias
            y = None
            sr = 16000
            b64 = None
            b64_birdnet = None

        arr = [] if (y is None or getattr(y, 'size', 0) == 0) else y
        especie_predicha, probabilidad, top3 = clf.predict(arr, sr)
        return JSONResponse({
            "especie_predicha": especie_predicha,
            "probabilidad": float(probabilidad),
            "top3": [{"especie": t[0], "prob": float(t[1])} for t in top3],
            "espectrograma_base64": b64,
            "espectrograma_birdnet_base64": b64_birdnet,
            "metadatos": {
                "sr": sr,
                "duracion": 0 if y is None else len(y)/sr,
                "modelo": clf.model_name,
                "fallback_audio": y is None
            }
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))