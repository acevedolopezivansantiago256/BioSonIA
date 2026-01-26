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
try:
    from ai.model.bird_classifier import BirdClassifier
except Exception:
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

EB_TOKEN = os.environ.get('EBIRD_API_TOKEN')
_ebird_tax_code_to_sci: dict = {}
_ebird_tax_loaded = False
_ebird_recent_cache: dict = {}

try:
    from ai.utils.audio_processing import load_audio_mono_16k, mel_spectrogram, spectrogram_png_bytes, waveform_clean_noisy_png_bytes, bandpass_1_10k, noise_reduce_simple, segment_birdsong
except Exception:
    try:
        from utils.audio_processing import load_audio_mono_16k, mel_spectrogram, spectrogram_png_bytes, waveform_clean_noisy_png_bytes, bandpass_1_10k, noise_reduce_simple, segment_birdsong
    except Exception:
        try:
            import importlib.util, sys as _sys, os as _os
            _utils_path = _os.path.join(_os.path.dirname(__file__), "utils", "audio_processing.py")
            _spec = importlib.util.spec_from_file_location("biosonia_audio_processing", _utils_path)
            if _spec and _spec.loader:
                _mod = importlib.util.module_from_spec(_spec)
                _spec.loader.exec_module(_mod)  # type: ignore
                load_audio_mono_16k = getattr(_mod, "load_audio_mono_16k", None)  # type: ignore
                mel_spectrogram = getattr(_mod, "mel_spectrogram", None)  # type: ignore
                spectrogram_png_bytes = getattr(_mod, "spectrogram_png_bytes", None)  # type: ignore
                waveform_clean_noisy_png_bytes = getattr(_mod, "waveform_clean_noisy_png_bytes", None)  # type: ignore
                bandpass_1_10k = getattr(_mod, "bandpass_1_10k", None)  # type: ignore
                noise_reduce_simple = getattr(_mod, "noise_reduce_simple", None)  # type: ignore
                segment_birdsong = getattr(_mod, "segment_birdsong", None)  # type: ignore
            else:
                load_audio_mono_16k = None  # type: ignore
                mel_spectrogram = None  # type: ignore
                spectrogram_png_bytes = None  # type: ignore
                waveform_clean_noisy_png_bytes = None  # type: ignore
                bandpass_1_10k = None  # type: ignore
                noise_reduce_simple = None  # type: ignore
                segment_birdsong = None  # type: ignore
        except Exception:
            load_audio_mono_16k = None  # type: ignore
            mel_spectrogram = None  # type: ignore
            spectrogram_png_bytes = None  # type: ignore
            waveform_clean_noisy_png_bytes = None  # type: ignore
            bandpass_1_10k = None  # type: ignore
            noise_reduce_simple = None  # type: ignore
            segment_birdsong = None  # type: ignore

def _radius_for_context(area_context: Optional[str]) -> float:
    s = str(area_context or "").lower().strip()
    if s in ("rural", "natural", "naturales"):
        return 80.0
    if s in ("urban", "peri-urban", "periurban", "urbano", "periurbano"):
        return 50.0
    return 50.0

def _km_to_deg(lat: float, km: float):
    lat_deg = float(km) / 111.32
    c = abs(math.cos(math.radians(float(lat))))
    if c < 0.05:
        c = 0.05
    lon_deg = float(km) / (111.32 * c)
    return lat_deg, lon_deg

def _ebird_load_taxonomy():
    global _ebird_tax_loaded, _ebird_tax_code_to_sci
    if _ebird_tax_loaded:
        return
    if not EB_TOKEN:
        _ebird_tax_loaded = True
        return
    try:
        url = "https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json"
        req = request.Request(url, headers={"x-ebirdapitoken": EB_TOKEN})
        with request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        m = {}
        for r in data or []:
            code = r.get('speciesCode')
            sci = r.get('sciName') or r.get('scientificName')
            if code and sci:
                m[code] = sci
        _ebird_tax_code_to_sci = m
    except Exception:
        _ebird_tax_code_to_sci = {}
    finally:
        _ebird_tax_loaded = True

def ebird_recent_species_near(lat: Optional[float], lon: Optional[float], dist_km: int = 50, back_days: int = 30) -> List[str]:
    if lat is None or lon is None or not EB_TOKEN:
        return []
    key = f"{float(lat)}|{float(lon)}|{int(dist_km)}|{int(back_days)}"
    if key in _ebird_recent_cache:
        v = _ebird_recent_cache.get(key)
        if isinstance(v, list):
            return v
    url = f"https://api.ebird.org/v2/data/obs/geo/recent?lat={float(lat)}&lng={float(lon)}&dist={int(dist_km)}&back={int(back_days)}"
    try:
        req = request.Request(url, headers={"x-ebirdapitoken": EB_TOKEN})
        with request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        _ebird_load_taxonomy()
        names = []
        for r in data or []:
            sci = r.get('sciName') or r.get('scientificName')
            if not sci:
                code = r.get('speciesCode')
                if code and code in _ebird_tax_code_to_sci:
                    sci = _ebird_tax_code_to_sci.get(code)
            if sci:
                names.append(sci)
        out = list(set(names))
        _ebird_recent_cache[key] = out
        return out
    except Exception:
        return []

def gbif_species_near(lat: Optional[float], lon: Optional[float], size_deg: float = 0.5, limit: int = 300, radius_km: Optional[float] = None, area_context: Optional[str] = None) -> List[str]:
    if lat is None or lon is None:
        return []
    rk = radius_km if radius_km is not None else _radius_for_context(area_context)
    lat_deg, lon_deg = _km_to_deg(float(lat), float(rk)) if rk is not None else (size_deg, size_deg)
    min_lat = max(-90.0, float(lat) - lat_deg)
    max_lat = min(90.0, float(lat) + lat_deg)
    min_lon = float(lon) - lon_deg
    max_lon = float(lon) + lon_deg
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

_seasonal_cache: dict = {}
def seasonal_prior_for(scientific_name: Optional[str], date: Optional[str], lat: Optional[float], lon: Optional[float], size_deg: float = 0.5, radius_km: Optional[float] = None, area_context: Optional[str] = None) -> float:
    if scientific_name is None or lat is None or lon is None:
        return 1.0
    try:
        month = 1
        if date:
            parts = str(date).split('-')
            if len(parts) >= 2:
                month = max(1, min(12, int(parts[1])))
    except Exception:
        month = 1
    rk = radius_km if radius_km is not None else _radius_for_context(area_context)
    key = f"{scientific_name}|{month}|{lat}|{lon}|{rk if rk is not None else size_deg}"
    if key in _seasonal_cache:
        return float(_seasonal_cache[key])
    lat_deg, lon_deg = _km_to_deg(float(lat), float(rk)) if rk is not None else (size_deg, size_deg)
    min_lat = max(-90.0, float(lat) - lat_deg)
    max_lat = min(90.0, float(lat) + lat_deg)
    min_lon = float(lon) - lon_deg
    max_lon = float(lon) + lon_deg
    poly = f"POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))"
    base = "https://api.gbif.org/v1/occurrence/search"
    facet_qs = f"hasCoordinate=true&limit=0&geometry={parse.quote(poly)}&scientificName={parse.quote(scientific_name)}&facet=month&facetLimit=12"
    url = f"{base}?{facet_qs}"
    try:
        with request.urlopen(url, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        facets = data.get('facets') or []
        month_counts = {}
        for f in facets:
            if f.get('field') == 'month':
                for c in f.get('counts', []):
                    m = int(c.get('name'))
                    v = int(c.get('count'))
                    month_counts[m] = v
        total = sum(month_counts.values())
        if total <= 0:
            _seasonal_cache[key] = 1.0
            return 1.0
        this = int(month_counts.get(month, 0))
        if this <= 0:
            _seasonal_cache[key] = 0.0
            return 0.0
        val = float(this) / float(total)
        _seasonal_cache[key] = val
        return val
    except Exception:
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
    min_confidence: float = Form(0.3),
    area_context: Optional[str] = Form(None),
):
    try:
        raw = await file.read()
        y = None
        sr = 16000
        b64 = None
        b64_birdnet = None
        # Importación/fallback de utilidades de audio
        try:
            if load_audio_mono_16k is None or mel_spectrogram is None or spectrogram_png_bytes is None or waveform_clean_noisy_png_bytes is None or bandpass_1_10k is None or noise_reduce_simple is None or segment_birdsong is None:
                raise Exception("audio utils not available")
            y, sr = load_audio_mono_16k(io.BytesIO(raw), mime=getattr(file, "content_type", None), filename=getattr(file, "filename", None))
            y = bandpass_1_10k(y, sr)
            y = noise_reduce_simple(y)
            S = mel_spectrogram(y, sr)
            png_std = spectrogram_png_bytes(S, cmap='magma', title='Spectrogram')
            b64 = base64.b64encode(png_std).decode('ascii')
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
                    rk = _radius_for_context(area_context)
                    geo_list = gbif_species_near(lat, lon, radius_km=rk, area_context=area_context)
                    eb_list = ebird_recent_species_near(lat, lon, dist_km=int(round(rk)))
                    geo_set = set(geo_list) | set(eb_list)
                    fused = []
                    for d in detecciones:
                        sci = d.get("nombre_cientifico")
                        ap = float(d.get("confianza", 0.0))
                        gp = 1.0 if (sci and sci in geo_set) else 0.0
                        sp_base = seasonal_prior_for(sci, date, lat, lon, radius_km=rk, area_context=area_context)
                        sp_boost = 0.5 if (sci and sci in set(eb_list)) else 0.0
                        sp = max(sp_base, sp_boost)
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
                "ebird": {
                    "token": bool(EB_TOKEN)
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
