#!/usr/bin/env bash
set -euo pipefail

echo "Generando dataset de ejemplo en ai/data/sample_audio..."
mkdir -p ai/data/sample_audio

python - <<'PY'
import numpy as np
import soundfile as sf
import os

def tone(freq, sr=16000, seconds=2.0):
    t = np.linspace(0, seconds, int(sr*seconds), endpoint=False)
    y = 0.2*np.sin(2*np.pi*freq*t)
    return y

os.makedirs('ai/data/sample_audio', exist_ok=True)
sf.write('ai/data/sample_audio/example1.wav', tone(1000), 16000)
sf.write('ai/data/sample_audio/example2.wav', tone(1500), 16000)
sf.write('ai/data/sample_audio/example3.wav', tone(2000), 16000)
print('Samples creados.')
PY

echo "Listo."