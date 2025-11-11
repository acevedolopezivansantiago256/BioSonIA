import os
import io
import base64
import tempfile
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from model.bird_classifier import BirdClassifier
try:
    from birdnetlib.analyzer import Analyzer
    from birdnetlib import Recording
    BN_AVAILABLE = True
except Exception:
    Analyzer = None  # type: ignore
    Recording = None  # type: ignore
    BN_AVAILABLE = False

app = FastAPI(title="BioSonIA AI Service")
clf = BirdClassifier()
bn_analyzer: Optional[Analyzer] = None
if BN_AVAILABLE:
    try:
        bn_analyzer = Analyzer()
    except Exception:
        bn_analyzer = None

@app.get('/health')
def health():
    return {"ok": True, "model": clf.model_name}

@app.post('/analyze')
async def analyze(
    file: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    date: Optional[str] = Form(None),  # YYYY-MM-DD
    min_confidence: float = Form(0.6),
):
    try:
        raw = await file.read()
        y = None
        sr = 16000
        b64 = None
        b64_birdnet = None
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

        # Integración BirdNET (si disponible)
        detecciones: List[dict] = []
        especie_birdnet_principal: Optional[str] = None
        prob_birdnet_principal: Optional[float] = None
        if bn_analyzer is not None and BN_AVAILABLE:
            tmp_path = None
            try:
                # Persistir temporalmente el audio para que BirdNET pueda analizarlo
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
                    tmp.write(raw)
                    tmp_path = tmp.name
                # Valores por defecto si no se proveen
                if not date:
                    from datetime import datetime
                    date = datetime.utcnow().strftime('%Y-%m-%d')
                recording = Recording(
                    bn_analyzer,
                    tmp_path,
                    lat=lat,
                    lon=lon,
                    date=date,
                    min_confidence=min_confidence,
                )
                recording.analyze()
                # Transformar a esquema en español
                for d in getattr(recording, 'detections', []) or []:
                    detecciones.append({
                        "especie": d.get('common_name'),
                        "nombre_cientifico": d.get('scientific_name'),
                        "confianza": float(d.get('confidence', 0.0)),
                        "inicio": float(d.get('start_time', 0.0)),
                        "fin": float(d.get('end_time', 0.0)),
                    })
                if detecciones:
                    best = max(detecciones, key=lambda x: x['confianza'])
                    especie_birdnet_principal = best['especie']
                    prob_birdnet_principal = best['confianza']
            except Exception:
                pass
            finally:
                try:
                    if tmp_path and os.path.exists(tmp_path):
                        os.remove(tmp_path)
                except Exception:
                    pass

        return JSONResponse({
            "especie_predicha": especie_predicha,
            "probabilidad": float(probabilidad),
            "top3": [{"especie": t[0], "prob": float(t[1])} for t in top3],
            "espectrograma_base64": b64,
            "espectrograma_birdnet_base64": b64_birdnet,
            "detecciones": detecciones,
            "metadatos": {
                "sr": sr,
                "duracion": 0 if y is None else len(y)/sr,
                "modelo": clf.model_name,
                "fallback_audio": y is None,
                "birdnet": {
                    "disponible": bn_analyzer is not None,
                    "especie_principal": especie_birdnet_principal,
                    "probabilidad_principal": prob_birdnet_principal,
                    "lat": lat,
                    "lon": lon,
                    "date": date,
                    "min_confidence": float(min_confidence),
                }
            }
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))