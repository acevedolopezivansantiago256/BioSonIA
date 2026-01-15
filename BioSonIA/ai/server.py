import os
import io
import base64
import tempfile
import json
import math
from urllib import request, parse
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from ai.model.bird_classifier import BirdClassifier
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

def gbif_species_near(lat: Optional[float], lon: Optional[float], size_deg: float = 0.5, limit: int = 300) -> List[str]:
    if lat is None or lon is None:
        return []
    min_lat = max(-90.0, float(lat) - size_deg)
    max_lat = min(90.0, float(lat) + size_deg)
    min_lon = float(lon) - size_deg
    max_lon = float(lon) + size_deg
    poly = f"POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))"
    url = f"https://api.gbif.org/v1/occurrence/search?hasCoordinate=true&limit={limit}&geometry={parse.quote(poly)}"
    try:
        with request.urlopen(url, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        names = []
        for r in data.get('results', []):
            n = r.get('scientificName')
            if n:
                names.append(n)
        return list(set(names))
    except Exception:
        return []

def seasonal_prior_for(scientific_name: Optional[str], date: Optional[str]) -> float:
    return 1.0

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
            from ai.utils.audio_processing import load_audio_mono_16k, mel_spectrogram, spectrogram_png_bytes, waveform_clean_noisy_png_bytes, bandpass_1_10k, noise_reduce_simple, segment_birdsong
            y, sr = load_audio_mono_16k(io.BytesIO(raw), mime=getattr(file, "content_type", None), filename=getattr(file, "filename", None))
            y = bandpass_1_10k(y, sr)
            y = noise_reduce_simple(y)
            S = mel_spectrogram(y, sr)
            # Espectrograma estándar
            png_std = spectrogram_png_bytes(S, cmap='magma', title='Spectrogram')
            b64 = base64.b64encode(png_std).decode('ascii')
            # Espectrograma estilo BirdNET (cmap viridis, sin colorbar)
            png_birdnet = spectrogram_png_bytes(S, cmap='viridis', title='BirdNET-style Spectrogram')
            b64_birdnet = base64.b64encode(png_birdnet).decode('ascii')
            png_wave = waveform_clean_noisy_png_bytes(y, sr)
            b64_wave = base64.b64encode(png_wave).decode('ascii')
            segs = segment_birdsong(y, sr)
        except Exception:
            # Fallback: no procesamos espectrograma si faltan dependencias
            y = None
            sr = 16000
            b64 = None
            b64_birdnet = None
            b64_wave = None
            segs = []

        especie_predicha = None
        probabilidad = 0.0
        top3: List = []

        # Integración BirdNET (si disponible)
        detecciones: List[dict] = []
        especie_birdnet_principal: Optional[str] = None
        prob_birdnet_principal: Optional[float] = None
        if bn_analyzer is not None and BN_AVAILABLE:
            tmp_path = None
            try:
                # Persistir temporalmente el audio para que BirdNET pueda analizarlo
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
                    tmp_path = tmp.name
                try:
                    import wave, numpy as np
                    arr = np.array([] if (y is None or getattr(y, 'size', 0) == 0) else y, dtype=np.float32)
                    if arr.size == 0:
                        with open(tmp_path, 'wb') as f:
                            f.write(raw)
                    else:
                        pcm = np.clip(arr, -1.0, 1.0)
                        pcm16 = (pcm * 32767.0).astype(np.int16)
                        w = wave.open(tmp_path, 'wb')
                        w.setnchannels(1)
                        w.setsampwidth(2)
                        w.setframerate(sr)
                        w.writeframes(pcm16.tobytes())
                        w.close()
                except Exception:
                    with open(tmp_path, 'wb') as f:
                        f.write(raw)
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
                    geo_list = gbif_species_near(lat, lon)
                    geo_set = set(geo_list)
                    fused = []
                    for d in detecciones:
                        sci = d.get("nombre_cientifico")
                        ap = float(d.get("confianza", 0.0))
                        gp = 1.0 if (sci and sci in geo_set) else 0.0
                        sp = seasonal_prior_for(sci, date)
                        fs = ap * gp * sp
                        if fs > 0.0:
                            fused.append({
                                "especie": d.get("especie"),
                                "nombre_cientifico": sci,
                                "inicio": d.get("inicio"),
                                "fin": d.get("fin"),
                                "acustico": ap,
                                "geo": gp,
                                "season": sp,
                                "score": fs
                            })
                    fused_sorted = sorted(fused, key=lambda x: x["score"], reverse=True)
                    if fused_sorted:
                        especie_birdnet_principal = fused_sorted[0]["especie"]
                        prob_birdnet_principal = fused_sorted[0]["score"]
                        especie_predicha = especie_birdnet_principal
                        probabilidad = float(prob_birdnet_principal)
                        top3 = [(f["especie"], f["score"]) for f in fused_sorted[:3]]
            except Exception:
                pass
            if tmp_path and os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass

        final_especie = especie_predicha
        final_prob = float(probabilidad)
        if especie_birdnet_principal is not None and prob_birdnet_principal is not None:
            final_especie = especie_birdnet_principal
            final_prob = float(prob_birdnet_principal)
        if final_especie is None:
            arr = [] if (y is None or getattr(y, 'size', 0) == 0) else y
            especie_fallback, prob_fallback, top3_fallback = clf.predict(arr, sr)
            final_especie = especie_fallback
            final_prob = float(prob_fallback)
            top3 = top3_fallback
        return JSONResponse({
            "especie_predicha": final_especie,
            "probabilidad": float(final_prob),
            "top3": [{"especie": t[0], "prob": float(t[1])} for t in top3],
            "espectrograma_base64": b64,
            "espectrograma_birdnet_base64": b64_birdnet,
            "waveform_pair_base64": b64_wave,
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
                },
                "segmentos": segs,
                "fusion": "FinalScore=AcousticProbability×GeographicPrior×SeasonalPrior"
            }
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))
