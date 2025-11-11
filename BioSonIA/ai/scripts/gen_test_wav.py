import wave
import math
import os
import array
import sys

def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'ai/data/test.wav'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sr = 16000
    sec = 2.0
    freq = 440.0
    n = int(sr * sec)
    samples = array.array('h')
    samples.extend(
        int(32767 * 0.5 * math.sin(2 * math.pi * freq * i / sr))
        for i in range(n)
    )
    with wave.open(out, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(samples.tobytes())
    print(out)

if __name__ == '__main__':
    main()