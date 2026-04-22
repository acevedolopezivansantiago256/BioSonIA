import io
import wave
import os
import shutil
import subprocess
import numpy as np
import matplotlib.pyplot as plt
try:
    import librosa
except Exception:
    librosa = None

try:
    from pydub import AudioSegment
except Exception:
    AudioSegment = None  # type: ignore


def _find_ffmpeg_binary():
    env_bin = os.environ.get("FFMPEG_BINARY")
    if env_bin and os.path.exists(env_bin):
        return env_bin
    sys_bin = shutil.which("ffmpeg")
    if sys_bin:
        return sys_bin
    try:
        import imageio_ffmpeg
        ff_bin = imageio_ffmpeg.get_ffmpeg_exe()
        if ff_bin and os.path.exists(ff_bin):
            return ff_bin
    except Exception:
        pass
    return None


def _load_with_ffmpeg_file(file_path: str, target_sr: int, max_seconds: float | None = None):
    ffmpeg_bin = _find_ffmpeg_binary()
    if not ffmpeg_bin:
        raise RuntimeError("ffmpeg not available")
    cmd = [
        ffmpeg_bin,
        "-v",
        "error",
        "-i",
        file_path,
    ]
    if max_seconds is not None and float(max_seconds) > 0:
        cmd.extend(["-t", str(float(max_seconds))])
    cmd.extend(
        [
            "-f",
            "f32le",
            "-acodec",
            "pcm_f32le",
            "-ac",
            "1",
            "-ar",
            str(int(target_sr)),
            "pipe:1",
        ]
    )
    proc = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    y = np.frombuffer(proc.stdout, dtype=np.float32)
    if y is None or y.size == 0:
        raise RuntimeError("ffmpeg returned empty audio")
    return y.astype(np.float32, copy=False), int(target_sr)

def _normalize_audio(y: np.ndarray):
    if y is None or y.size == 0:
        return np.array([], dtype=np.float32)
    y = y.astype(np.float32, copy=False)
    peak = float(np.max(np.abs(y)) + 1e-9)
    y = (y / peak).astype(np.float32, copy=False)
    return np.clip(y, -1.0, 1.0).astype(np.float32, copy=False)

def _resample_linear(y: np.ndarray, sr_in: int, sr_out: int):
    if y is None or y.size == 0 or sr_in <= 0 or sr_out <= 0 or sr_in == sr_out:
        return y.astype(np.float32, copy=False)
    duration = y.size / float(sr_in)
    target_len = int(round(duration * float(sr_out)))
    if target_len <= 1:
        return y[:1].astype(np.float32, copy=False)
    t_orig = np.linspace(0.0, duration, num=y.size, endpoint=False)
    t_target = np.linspace(0.0, duration, num=target_len, endpoint=False)
    return np.interp(t_target, t_orig, y).astype(np.float32)

def _load_with_pydub(buf: io.BytesIO, mime: str | None, filename: str | None):
    if AudioSegment is None:
        raise RuntimeError("pydub not available")
    buf.seek(0)
    fmt = None
    name = (filename or "").lower()
    m = (mime or "").lower()
    if "mp3" in m or name.endswith(".mp3"):
        fmt = "mp3"
    elif "wav" in m or name.endswith(".wav"):
        fmt = "wav"
    seg = AudioSegment.from_file(buf, format=fmt) if fmt else AudioSegment.from_file(buf)
    seg = seg.set_channels(1)
    sr = int(seg.frame_rate)
    samples = np.array(seg.get_array_of_samples())
    if seg.sample_width == 1:
        y = (samples.astype(np.float32) / 128.0).astype(np.float32)
    elif seg.sample_width == 2:
        y = (samples.astype(np.float32) / 32768.0).astype(np.float32)
    elif seg.sample_width == 4:
        y = (samples.astype(np.float32) / 2147483648.0).astype(np.float32)
    else:
        y = samples.astype(np.float32)
        y = _normalize_audio(y)
        return y, sr
    return y, sr


_MAX_DECODE_SECONDS = float(os.environ.get("MAX_DECODE_SECONDS", os.environ.get("MAX_AUDIO_SECONDS", "45")))
_ENABLE_PYDUB_FALLBACK = os.environ.get("ENABLE_PYDUB_FALLBACK", "false").strip().lower() == "true"

def load_audio_mono_16k(buf: io.BytesIO, mime: str | None = None, filename: str | None = None):
    """
    Carga WAV/MP3 desde memoria y lo convierte a mono 16 kHz.
    Mantiene compatibilidad con el servidor que envía (mime, filename).
    """
    buf.seek(0)
    # Robust path for MP3/WAV in minimal cloud runtimes.
    temp_suffix = ".wav"
    name = (filename or "").lower()
    m = (mime or "").lower()
    if name.endswith(".mp3") or "mp3" in m:
        temp_suffix = ".mp3"
    tmp_path = None
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=temp_suffix) as tmp:
            tmp.write(buf.read())
            tmp_path = tmp.name
        y, sr = _load_with_ffmpeg_file(tmp_path, 16000, max_seconds=_MAX_DECODE_SECONDS)
        return _normalize_audio(y), int(sr)
    except Exception:
        pass
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
    buf.seek(0)
    if librosa is not None:
        try:
            data, sr = librosa.load(buf, sr=16000, mono=True)
            return _normalize_audio(data.astype(np.float32)), int(sr)
        except Exception:
            pass
    if _ENABLE_PYDUB_FALLBACK:
        try:
            y, sr = _load_with_pydub(buf, mime, filename)
            if librosa is not None:
                y = librosa.resample(y.astype(np.float32), orig_sr=int(sr), target_sr=16000).astype(np.float32)
                return _normalize_audio(y), 16000
            y = _resample_linear(y.astype(np.float32), int(sr), 16000)
            return _normalize_audio(y), 16000
        except Exception:
            pass
    try:
        with wave.open(buf, 'rb') as w:
            sr = w.getframerate()
            n_channels = w.getnchannels()
            sampwidth = w.getsampwidth()
            num_frames = w.getnframes()
            raw = w.readframes(num_frames)

        if sampwidth == 1:
            data = np.frombuffer(raw, dtype=np.uint8)
            data = (data.astype(np.float32) - 128.0) / 128.0
        elif sampwidth == 2:
            data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        elif sampwidth == 4:
            data = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
        else:
            data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

        if n_channels > 1:
            data = data.reshape(-1, n_channels).mean(axis=1)

        if sr != 16000 and sr > 0 and data.size > 0:
            duration = data.size / sr
            t_orig = np.linspace(0.0, duration, num=data.size, endpoint=False)
            target_len = int(round(duration * 16000))
            t_target = np.linspace(0.0, duration, num=target_len, endpoint=False)
            data = np.interp(t_target, t_orig, data).astype(np.float32)
            sr = 16000

        return _normalize_audio(data), sr
    except Exception:
        return np.array([], dtype=np.float32), 16000

def load_audio_mono_48k(buf: io.BytesIO | str, mime: str | None = None, filename: str | None = None):
    """
    Preprocesamiento recomendado para BirdNET:
    - Mono
    - 48 kHz
    - Normalización de amplitud
    - Soporte WAV y MP3 (si hay backend de decodificación disponible)
    """
    import tempfile

    tmp_path = None
    is_temp = False

    if isinstance(buf, str):
        tmp_path = buf
    else:
        buf.seek(0)
        temp_suffix = ".wav"
        if filename and filename.lower().endswith(".mp3"):
            temp_suffix = ".mp3"
        elif mime and "mp3" in mime.lower():
            temp_suffix = ".mp3"

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=temp_suffix) as tmp:
                tmp.write(buf.read())
                tmp_path = tmp.name
                is_temp = True
        except Exception:
            tmp_path = None

    if tmp_path:
         try:
             try:
                 if AudioSegment is not None:
                     seg = AudioSegment.from_file(tmp_path)
                     seg = seg.set_channels(1)
                     sr = int(seg.frame_rate)
                     samples = np.array(seg.get_array_of_samples())
                     if seg.sample_width == 1:
                         y = (samples.astype(np.float32) / 128.0).astype(np.float32)
                     elif seg.sample_width == 2:
                         y = (samples.astype(np.float32) / 32768.0).astype(np.float32)
                     elif seg.sample_width == 4:
                         y = (samples.astype(np.float32) / 2147483648.0).astype(np.float32)
                     else:
                         y = samples.astype(np.float32)
                     
                     if librosa is not None:
                         y = librosa.resample(y.astype(np.float32), orig_sr=int(sr), target_sr=48000).astype(np.float32)
                         return _normalize_audio(y), 48000
                     y = _resample_linear(y.astype(np.float32), int(sr), 48000)
                     return _normalize_audio(y), 48000
             except Exception:
                 pass

             if librosa is not None:
                 try:
                     y, sr = librosa.load(tmp_path, sr=48000, mono=True)
                     return _normalize_audio(y.astype(np.float32)), int(sr)
                 except Exception:
                     pass
         finally:
            if is_temp and tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

    # Fallback final (solo para buffers WAV)
    if not isinstance(buf, str):
        buf.seek(0)
        try:
            with wave.open(buf, 'rb') as w:
                sr = w.getframerate()
                n_channels = w.getnchannels()
                sampwidth = w.getsampwidth()
                num_frames = w.getnframes()
                raw = w.readframes(num_frames)

            if sampwidth == 1:
                data = np.frombuffer(raw, dtype=np.uint8)
                data = (data.astype(np.float32) - 128.0) / 128.0
            elif sampwidth == 2:
                data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
            elif sampwidth == 4:
                data = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
            else:
                data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

            if n_channels > 1:
                data = data.reshape(-1, n_channels).mean(axis=1)

            if sr != 48000 and sr > 0 and data.size > 0:
                if librosa is not None:
                    data = librosa.resample(data.astype(np.float32), orig_sr=int(sr), target_sr=48000).astype(np.float32)
                else:
                    data = _resample_linear(data.astype(np.float32), int(sr), 48000)
                sr = 48000

            return _normalize_audio(data), sr
        except Exception:
            pass

    return np.array([], dtype=np.float32), 48000

def mel_spectrogram(y: np.ndarray, sr: int):
    if y is None or y.size == 0:
        return np.zeros((1, 1), dtype=np.float32)

    n_fft = 1024
    hop = 256
    window = np.hanning(n_fft).astype(np.float32)

    # Número de frames
    if y.size < n_fft:
        num_frames = 1
    else:
        num_frames = 1 + (y.size - n_fft) // hop

    specs = []
    for i in range(num_frames):
        start = i * hop
        end = start + n_fft
        frame = np.zeros(n_fft, dtype=np.float32)
        if end <= y.size:
            frame[:] = y[start:end]
        else:
            valid = y.size - start
            if valid > 0:
                frame[:valid] = y[start:]
        frame *= window
        spec = np.fft.rfft(frame)
        power = (np.abs(spec) ** 2).astype(np.float32)
        specs.append(power)

    S = np.stack(specs, axis=1)  # (freq_bins, frames)
    S_db = 10.0 * np.log10(np.maximum(S, 1e-10))
    return S_db

def spectrogram_png_bytes(S_db: np.ndarray, cmap: str = 'magma', title: str = 'Spectrogram'):
    fig, ax = plt.subplots(figsize=(6, 3))
    img = ax.imshow(S_db, origin='lower', aspect='auto', cmap=cmap)
    if cmap != 'viridis':
        fig.colorbar(img, ax=ax, format='%+2.0f dB')
    ax.set(title=title, xlabel='Frames', ylabel='Freq bins')
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return buf.read()

def waveform_clean_noisy_png_bytes(y: np.ndarray, sr: int):
    if y is None or y.size == 0:
        y = np.zeros(16000, dtype=np.float32)
        sr = 16000
    duration = y.size / float(sr)
    t = np.linspace(0.0, duration, num=y.size, endpoint=False)
    noise = np.random.normal(0.0, 0.02, size=y.size).astype(np.float32)
    y_noisy = np.clip(y + noise, -1.0, 1.0)
    fig, axes = plt.subplots(2, 1, figsize=(10, 4), sharex=True)
    axes[0].plot(t, y, color='#1f77b4')
    axes[0].set_title('Audio Limpio en el dominio del tiempo')
    axes[0].set_ylabel('Amplitud')
    axes[1].plot(t, y_noisy, color='#d62728')
    axes[1].set_title('Audio Ruidoso en el dominio del tiempo')
    axes[1].set_xlabel('Tiempo [s]')
    axes[1].set_ylabel('Amplitud')
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return buf.read()

def bandpass_1_10k(y: np.ndarray, sr: int):
    if y is None or y.size == 0 or sr <= 0:
        return y
    Y = np.fft.rfft(y.astype(np.float32))
    freqs = np.fft.rfftfreq(y.size, d=1.0/float(sr))
    mask = (freqs >= 1000.0) & (freqs <= 10000.0)
    Y = Y * mask.astype(np.float32)
    out = np.fft.irfft(Y, n=y.size).astype(np.float32)
    return np.clip(out, -1.0, 1.0)

def noise_reduce_simple(y: np.ndarray):
    if y is None or y.size == 0:
        return y
    m = float(np.median(y))
    s = float(np.std(y) + 1e-6)
    thr = 0.5 * s
    yc = y.astype(np.float32) - m
    scale_low = 0.3
    out = np.where(np.abs(yc) < thr, yc * scale_low, yc)
    out = out + m
    return np.clip(out.astype(np.float32), -1.0, 1.0)

def segment_birdsong(y: np.ndarray, sr: int):
    segs = []
    if y is None or y.size == 0 or sr <= 0:
        return segs
    win = max(1, int(sr * 0.05))
    step = max(1, int(sr * 0.02))
    rms = []
    for i in range(0, y.size - win + 1, step):
        frame = y[i:i+win]
        rms.append(float(np.sqrt(np.mean(frame**2))))
    rms = np.array(rms, dtype=np.float32)
    thr = float(np.median(rms) + 2.0 * np.std(rms))
    active = rms > thr
    start = None
    for idx, a in enumerate(active):
        if a and start is None:
            start = idx
        elif (not a) and start is not None:
            s = start * step
            e = (idx * step) + win
            segs.append((float(s)/sr, float(e)/sr))
            start = None
    if start is not None:
        s = start * step
        e = ((len(active)) * step) + win
        segs.append((float(s)/sr, float(e)/sr))
    return segs
