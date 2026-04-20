import os
import io
import base64
import tempfile
import shutil
from datetime import datetime
from typing import Optional, Any

import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, HTMLResponse

try:
    from birdnetlib.analyzer import Analyzer
    from birdnetlib import Recording
    BN_AVAILABLE = True
except Exception as e:
    print(f"Error loading BirdNET: {e}")
    import traceback
    traceback.print_exc()
    Analyzer = None  # type: ignore
    Recording = None  # type: ignore
    BN_AVAILABLE = False
 
import logging
# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ai_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("BioSonIA-AI")

app = FastAPI(title="BioSonIA AI Service (BirdNET)")

DEFAULT_LAT = float(os.environ.get("DEFAULT_LAT", "7.8891"))  # Cúcuta, Norte de Santander (Colombia)
DEFAULT_LON = float(os.environ.get("DEFAULT_LON", "-72.4967"))
MAX_UPLOAD_MB = float(os.environ.get("MAX_UPLOAD_MB", "20"))
MAX_AUDIO_SECONDS = float(os.environ.get("MAX_AUDIO_SECONDS", "90"))
ENABLE_SPECTROGRAMS = os.environ.get("ENABLE_SPECTROGRAMS", "true").strip().lower() == "true"
ENABLE_REFERENCE_SPECTROGRAM = os.environ.get("ENABLE_REFERENCE_SPECTROGRAM", "false").strip().lower() == "true"
FFMPEG_PATH = os.environ.get("FFMPEG_BINARY") or shutil.which("ffmpeg")
FFPROBE_PATH = os.environ.get("FFPROBE_BINARY") or shutil.which("ffprobe")

try:
    from ai.utils.audio_processing import load_audio_mono_48k, mel_spectrogram, spectrogram_png_bytes, waveform_clean_noisy_png_bytes
except Exception:
    try:
        from utils.audio_processing import load_audio_mono_48k, mel_spectrogram, spectrogram_png_bytes, waveform_clean_noisy_png_bytes  # type: ignore
    except Exception:
        def _missing_audio_utils(*args, **kwargs):
            raise RuntimeError(
                "No se encontró audio_processing.py (esperado en ai/utils o utils). "
                "Incluye ese archivo en el despliegue."
            )

        load_audio_mono_48k = _missing_audio_utils
        mel_spectrogram = _missing_audio_utils
        spectrogram_png_bytes = _missing_audio_utils
        waveform_clean_noisy_png_bytes = _missing_audio_utils

try:
    from pydub.utils import which as _which
    from pydub import AudioSegment as _AS
    _ff = _which("ffmpeg")
    _ffprobe = _which("ffprobe")
    if not _ff:
        try:
            import imageio_ffmpeg
            _ff = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            _ff = None
    if not _ffprobe and _ff:
        ffprobe_from_ffmpeg = _ff.replace("ffmpeg.exe", "ffprobe.exe").replace("/ffmpeg", "/ffprobe")
        if os.path.exists(ffprobe_from_ffmpeg):
            _ffprobe = ffprobe_from_ffmpeg
    if not _ff:
        for _p in [
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\FFmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\Gyan\FFmpeg\bin\ffmpeg.exe",
            r"C:\Program Files (x86)\FFmpeg\bin\ffmpeg.exe",
        ]:
            if os.path.exists(_p):
                _ff = _p
                break
    if not _ffprobe:
        for _p in [
            r"C:\ffmpeg\bin\ffprobe.exe",
            r"C:\Program Files\FFmpeg\bin\ffprobe.exe",
            r"C:\Program Files\Gyan\FFmpeg\bin\ffprobe.exe",
            r"C:\Program Files (x86)\FFmpeg\bin\ffprobe.exe",
        ]:
            if os.path.exists(_p):
                _ffprobe = _p
                break
    if not _ff and os.environ.get("FFMPEG_BINARY"):
        _ff = os.environ.get("FFMPEG_BINARY")
    if not _ffprobe and os.environ.get("FFPROBE_BINARY"):
        _ffprobe = os.environ.get("FFPROBE_BINARY")
    if _ff:
        _AS.converter = _ff
        FFMPEG_PATH = FFMPEG_PATH or _ff
    if _ffprobe:
        _AS.ffprobe = _ffprobe
        FFPROBE_PATH = FFPROBE_PATH or _ffprobe
except Exception:
    pass

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

@app.get('/', response_class=HTMLResponse)
def read_root():
    return """
    <html>
        <head>
            <title>BioSonIA AI Service</title>
            <style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f0f9ff;color:#334155;}</style>
        </head>
        <body>
            <h1>🦜 BioSonIA AI Service Working!</h1>
            <p>Este es el servicio de Inteligencia Artificial (Backend).</p>
            <p>No necesitas hacer nada aquí.</p>
            <p><strong>Ve a <a href="http://localhost:3000">http://localhost:3000</a> para usar la aplicación.</strong></p>
        </body>
    </html>
    """

@app.get('/health')
def health():
    return {
        "ok": True,
        "model": "BirdNET",
        "birdnet_available": bool(bn_analyzer is not None),
        "ffmpeg_available": bool(FFMPEG_PATH),
        "ffprobe_available": bool(FFPROBE_PATH),
        "max_upload_mb": MAX_UPLOAD_MB,
        "max_audio_seconds": MAX_AUDIO_SECONDS,
    }

@app.post('/analyze')
async def analyze(
    file: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    date: Optional[str] = Form(None),  # YYYY-MM-DD
    min_confidence: float = Form(0.1),
    confidence_threshold: Optional[float] = Form(None),
):
    try:
        if bn_analyzer is None:
            return JSONResponse({"detected": False, "message": "BirdNET no está disponible en el servidor."}, status_code=503)

        raw = await file.read()
        max_upload_bytes = int(MAX_UPLOAD_MB * 1024 * 1024)
        if len(raw) > max_upload_bytes:
            return JSONResponse(
                {
                    "detected": False,
                    "message": f"Archivo demasiado grande. Máximo permitido: {MAX_UPLOAD_MB} MB.",
                },
                status_code=413,
            )

        filename = str(getattr(file, "filename", "") or "").lower()
        content_type = str(getattr(file, "content_type", "") or "").lower()
        is_mp3 = filename.endswith(".mp3") or "audio/mpeg" in content_type or "mp3" in content_type
        if is_mp3 and not FFMPEG_PATH:
            return JSONResponse(
                {
                    "detected": False,
                    "message": "El servidor no tiene ffmpeg para procesar MP3. Instala ffmpeg o usa imageio-ffmpeg en el despliegue.",
                },
                status_code=400,
            )

        threshold = float(confidence_threshold) if confidence_threshold is not None else float(min_confidence)
        lat_used, lon_used, date_used = _defaults_for_colombia(lat, lon, date)
        
        logger.info(f"--- Nueva solicitud de análisis ---")
        logger.info(f"Archivo: {getattr(file, 'filename', 'desconocido')} ({getattr(file, 'content_type', 'tipo desconocido')})")
        logger.info(f"Parámetros: lat={lat_used}, lon={lon_used}, date={date_used}, threshold={threshold}")

        y, sr = load_audio_mono_48k(
            io.BytesIO(raw),
            mime=getattr(file, "content_type", None),
            filename=getattr(file, "filename", None),
        )
        if y is None or getattr(y, "size", 0) == 0:
            logger.warning("No se pudo leer el audio/Audio vacío")
            return JSONResponse(
                {
                    "detected": False,
                    "message": "No se pudo leer el audio. Verifica que sea WAV o MP3 válido.",
                },
                status_code=400,
            )

        duration_sec = float(len(y) / float(sr))
        if duration_sec > MAX_AUDIO_SECONDS:
            return JSONResponse(
                {
                    "detected": False,
                    "message": f"Audio demasiado largo ({duration_sec:.1f}s). Máximo permitido: {MAX_AUDIO_SECONDS}s.",
                },
                status_code=413,
            )

        b64_std = None
        b64_bn = None
        b64_wave = None
        if ENABLE_SPECTROGRAMS:
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
                date=datetime.strptime(date_used, "%Y-%m-%d"),
                min_conf=min(0.05, threshold),
            )
            recording.analyze()

            raw_detections = getattr(recording, "detections", []) or []
            logger.info(f"Detecciones brutas de BirdNET: {len(raw_detections)}")
            for rd in raw_detections:
                logger.debug(f"Det: {rd}")

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

            # Buscar espectrograma de referencia si se detectó especie
            b64_ref = None
            if detected and ENABLE_REFERENCE_SPECTROGRAM:
                species_name = top3[0]["species"]
                # Posibles rutas relativas desde donde se ejecute el script
                candidates = [
                    os.path.join("references", f"{species_name}.wav"),
                    os.path.join("references", f"{species_name}.mp3"),
                    os.path.join("ai", "references", f"{species_name}.wav"),
                    os.path.join("ai", "references", f"{species_name}.mp3"),
                ]
                for cand in candidates:
                    if os.path.exists(cand):
                        try:
                            y_ref, sr_ref = load_audio_mono_48k(cand)
                            if y_ref is not None:
                                S_ref = mel_spectrogram(y_ref, int(sr_ref))
                                png_ref = spectrogram_png_bytes(S_ref, cmap="magma", title=f"Reference: {species_name}")
                                b64_ref = base64.b64encode(png_ref).decode("ascii")
                                logger.info(f"Referencia generada para {species_name} desde {cand}")
                                break
                        except Exception as e:
                            logger.error(f"Error generando referencia para {cand}: {e}")

            metadata = {
                "model": "BirdNET",
                "min_confidence": threshold,
                "lat": lat_used,
                "lon": lon_used,
                "date": date_used,
                "sr": int(sr),
                "duration": duration_sec,
                "region_hint": "Colombia (Norte de Santander)",
            }

            if not detected:
                return JSONResponse(
                    {
                        "detected": False,
                        "message": "No se detectaron aves con suficiente confianza",
                        "metadata": metadata,
                        "espectrograma_base64": b64_std,
                        "espectrograma_birdnet_base64": b64_bn,
                        "waveform_pair_base64": b64_wave,
                        "espectrograma_referencia_base64": None,
                        "detections": detections,
                        "top3": [],
                    }
                )

            return JSONResponse(
                {
                    "detected": True,
                    "top3": top3,
                    "metadata": metadata,
                    "espectrograma_base64": b64_std,
                    "espectrograma_birdnet_base64": b64_bn,
                    "waveform_pair_base64": b64_wave,
                    "espectrograma_referencia_base64": b64_ref,
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
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))
