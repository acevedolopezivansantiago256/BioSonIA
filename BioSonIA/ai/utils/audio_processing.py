import io
import wave
import numpy as np
import matplotlib.pyplot as plt
try:
    import librosa
except Exception:
    librosa = None

def load_audio_mono_16k(buf: io.BytesIO):
    buf.seek(0)
    if librosa is not None:
        try:
            data, sr = librosa.load(buf, sr=16000, mono=True)
            return data.astype(np.float32), int(sr)
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

        return data, sr
    except Exception:
        return np.array([], dtype=np.float32), 16000

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