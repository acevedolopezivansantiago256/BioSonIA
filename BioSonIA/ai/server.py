import os
import io
import base64
import tempfile
from datetime import datetime
from typing import Optional, Any

import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse

try:
    from birdnetlib.analyzer import Analyzer
    from birdnetlib import Recording
    BN_AVAILABLE = True
except Exception:
    Analyzer = None  # type: ignore
    Recording = None  # type: ignore
    BN_AVAILABLE = False

app = FastAPI(title="BioSonIA AI Service (BirdNET)")

DEFAULT_LAT = float(os.environ.get("DEFAULT_LAT", "7.8891"))  # Cúcuta, Norte de Santander (Colombia)
DEFAULT_LON = float(os.environ.get("DEFAULT_LON", "-72.4967"))

try:
    from ai.utils.audio_processing import load_audio_mono_48k, mel_spectrogram, spectrogram_png_bytes, waveform_clean_noisy_png_bytes
except Exception:
    from utils.audio_processing import load_audio_mono_48k, mel_spectrogram, spectrogram_png_bytes, waveform_clean_noisy_png_bytes  # type: ignore

bn_analyzer: Optional[Analyzer] = None
if BN_AVAILABLE:
    try:
        bn_analyzer = Analyzer()
    except Exception:
        bn_analyzer = None

def _defaults_for_colombia(lat: Optional[float], lon: Optional[float], date: Optional[str]):
    out_lat = DEFAULT_LAT if lat is None else float(lat)
    out_lon = DEFAULT_LON if lon is None else float(lon)
    out_date = date or datetime.utcnow().strftime("%Y-%m-%d")
    return out_lat, out_lon, out_date

def _write_wav_48k_mono_int16(y: np.ndarray, sr: int):
    y = np.array([] if y is None else y, dtype=np.float32)
    if y.size == 0:
        raise ValueError("Audio vacío o no soportado")
    target_sr = 48000
    if int(sr) != target_sr:
        raise ValueError("El audio debe estar a 48 kHz antes de escribir WAV")
    pcm16 = (np.clip(y, -1.0, 1.0) * 32767.0).astype(np.int16)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp_path = tmp.name
    import wave
    w = wave.open(tmp_path, "wb")
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(target_sr)
    w.writeframes(pcm16.tobytes())
    w.close()
    return tmp_path

@app.get('/health')
def health():
    return {"ok": True, "model": "BirdNET", "birdnet_available": bool(bn_analyzer is not None)}

@app.post('/analyze')
async def analyze(
    file: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    date: Optional[str] = Form(None),  # YYYY-MM-DD
    min_confidence: float = Form(0.6),
    confidence_threshold: Optional[float] = Form(None),
):
    try:
        if bn_analyzer is None:
            return JSONResponse({"detected": False, "message": "BirdNET no está disponible en el servidor."}, status_code=503)

        raw = await file.read()
        threshold = float(confidence_threshold) if confidence_threshold is not None else float(min_confidence)
        lat_used, lon_used, date_used = _defaults_for_colombia(lat, lon, date)

        y, sr = load_audio_mono_48k(
            io.BytesIO(raw),
            mime=getattr(file, "content_type", None),
            filename=getattr(file, "filename", None),
        )
        if y is None or getattr(y, "size", 0) == 0:
            return JSONResponse(
                {
                    "detected": False,
                    "message": "No se pudo leer el audio. Verifica que sea WAV o MP3 válido.",
                },
                status_code=400,
            )

        S = mel_spectrogram(y, int(sr))
        png_std = spectrogram_png_bytes(S, cmap="magma", title="Spectrogram")
        b64_std = base64.b64encode(png_std).decode("ascii")
        png_bn = spectrogram_png_bytes(S, cmap="viridis", title="BirdNET-style Spectrogram")
        b64_bn = base64.b64encode(png_bn).decode("ascii")
        png_wave = waveform_clean_noisy_png_bytes(y, int(sr))
        b64_wave = base64.b64encode(png_wave).decode("ascii")

        tmp_path = None
        try:
            tmp_path = _write_wav_48k_mono_int16(y, int(sr))
            recording = Recording(
                bn_analyzer,
                tmp_path,
                lat=lat_used,
                lon=lon_used,
                date=date_used,
                min_confidence=threshold,
            )
            recording.analyze()

            raw_detections = getattr(recording, "detections", []) or []

            detections: list[dict[str, Any]] = []
            per_species: dict[str, float] = {}
            for d in raw_detections:
                sci = d.get("scientific_name") or d.get("sci_name")
                common = d.get("common_name")
                conf = float(d.get("confidence", 0.0) or 0.0)
                start_t = float(d.get("start_time", 0.0) or 0.0)
                end_t = float(d.get("end_time", 0.0) or 0.0)

                if sci:
                    prev = float(per_species.get(sci, 0.0))
                    if conf > prev:
                        per_species[sci] = conf

                detections.append(
                    {
                        "scientific_name": sci,
                        "common_name": common,
                        "confidence": conf,
                        "start_time": start_t,
                        "end_time": end_t,
                    }
                )

            top3_sorted = sorted(per_species.items(), key=lambda x: x[1], reverse=True)[:3]
            top3 = [{"species": sci, "confidence": float(conf)} for sci, conf in top3_sorted]

            detected = bool(top3) and float(top3[0]["confidence"]) >= threshold

            metadata = {
                "model": "BirdNET",
                "min_confidence": threshold,
                "lat": lat_used,
                "lon": lon_used,
                "date": date_used,
                "sr": int(sr),
                "duration": float(len(y) / float(sr)),
                "region_hint": "Colombia (Norte de Santander)",
            }

            if not detected:
                return JSONResponse(
                    {
                        "detected": False,
                        "message": "No se detectaron aves con suficiente confianza",
                        "metadata": metadata,
                        "spectrograma_base64": b64_std,
                        "espectrograma_birdnet_base64": b64_bn,
                        "waveform_pair_base64": b64_wave,
                        "detections": detections,
                        "top3": [],
                    }
                )

            return JSONResponse(
                {
                    "detected": True,
                    "top3": top3,
                    "metadata": metadata,
                    "spectrograma_base64": b64_std,
                    "espectrograma_birdnet_base64": b64_bn,
                    "waveform_pair_base64": b64_wave,
                    "detections": detections,
                }
            )
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))
