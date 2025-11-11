import io
import wave
import numpy as np
import matplotlib.pyplot as plt

def load_audio_mono_16k(buf: io.BytesIO):
    """Carga audio WAV, mezcla a mono y re-muestrea a 16 kHz.

    Esta implementación evita dependencias pesadas (librosa/soundfile) y usa
    únicamente librerías estándar + numpy. Soporta WAV PCM de 8/16/32 bits.
    """
    buf.seek(0)
    try:
        with wave.open(buf, 'rb') as w:
            sr = w.getframerate()
            n_channels = w.getnchannels()
            sampwidth = w.getsampwidth()  # bytes per sample
            num_frames = w.getnframes()
            raw = w.readframes(num_frames)

        # Convertir a float32 en rango [-1, 1]
        if sampwidth == 1:
            data = np.frombuffer(raw, dtype=np.uint8)
            data = (data.astype(np.float32) - 128.0) / 128.0
        elif sampwidth == 2:
            data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        elif sampwidth == 4:
            data = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
        else:
            # Ancho no soportado: intentar int16 por defecto
            data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

        if n_channels > 1:
            data = data.reshape(-1, n_channels).mean(axis=1)

        # Re-muestrear a 16 kHz mediante interpolación lineal
        if sr != 16000 and sr > 0 and data.size > 0:
            duration = data.size / sr
            t_orig = np.linspace(0.0, duration, num=data.size, endpoint=False)
            target_len = int(round(duration * 16000))
            t_target = np.linspace(0.0, duration, num=target_len, endpoint=False)
            data = np.interp(t_target, t_orig, data).astype(np.float32)
            sr = 16000

        return data, sr
    except Exception:
        # Si falla (formato no-WAV, etc.), devolver vacío para activar degradación.
        return np.array([], dtype=np.float32), 16000

def mel_spectrogram(y: np.ndarray, sr: int):
    """Calcula un espectrograma log-power simple vía STFT.

    Nota: No usa escala mel para evitar dependencias. Aun así, produce
    una visualización útil para la UI.
    """
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
    """Renderiza el espectrograma en PNG.

    Parámetros:
    - cmap: mapa de colores de matplotlib (p. ej., 'magma', 'viridis').
    - title: título a mostrar en la figura.
    """
    fig, ax = plt.subplots(figsize=(6, 3))
    img = ax.imshow(S_db, origin='lower', aspect='auto', cmap=cmap)
    # Para estilo tipo BirdNET, típicamente sin colorbar; lo hacemos opcional
    if cmap != 'viridis':
        fig.colorbar(img, ax=ax, format='%+2.0f dB')
    ax.set(title=title, xlabel='Frames', ylabel='Freq bins')
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return buf.read()