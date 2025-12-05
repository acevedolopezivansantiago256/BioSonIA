import os
import sys
import glob
import json
import numpy as np
from typing import List, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib

def _load_audio(path: str) -> Tuple[np.ndarray, int]:
    import io
    from utils.audio_processing import load_audio_mono_16k
    with open(path, 'rb') as f:
        buf = io.BytesIO(f.read())
    y, sr = load_audio_mono_16k(buf)
    return y, sr

def _load_yamnet():
    import tensorflow_hub as hub
    return hub.load('https://tfhub.dev/google/yamnet/1')

def _embedding(model, y: np.ndarray, sr: int) -> np.ndarray:
    import tensorflow as tf
    if y is None or y.size == 0:
        return np.zeros((1024,), dtype=np.float32)
    if sr != 16000:
        duration = y.size / float(sr)
        t_orig = np.linspace(0.0, duration, num=y.size, endpoint=False)
        t_target = np.linspace(0.0, duration, num=int(round(duration*16000)), endpoint=False)
        y = np.interp(t_target, t_orig, y).astype(np.float32)
        sr = 16000
    wf = tf.convert_to_tensor(y, dtype=tf.float32)
    scores, embeddings, spectrogram = model(wf)
    e = embeddings.numpy()
    if e.ndim == 2:
        vec = e.mean(axis=0)
    else:
        vec = np.mean(e, axis=0)
    return vec.astype(np.float32)

def _scan_dataset(root: str) -> List[Tuple[str, str]]:
    pairs = []
    classes = [d for d in os.listdir(root) if os.path.isdir(os.path.join(root, d))]
    for c in classes:
        for ext in ('*.wav','*.mp3'):
            for p in glob.glob(os.path.join(root, c, ext)):
                pairs.append((p, c))
    return pairs

def main():
    data_root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'data', 'train')
    out_path = os.path.join(os.path.dirname(__file__), 'yamnet_logreg.pkl')
    pairs = _scan_dataset(data_root)
    if not pairs:
        print('No hay datos en', data_root)
        return 1
    model = _load_yamnet()
    X = []
    y_labels = []
    for path, label in pairs:
        y, sr = _load_audio(path)
        vec = _embedding(model, y, sr)
        X.append(vec)
        y_labels.append(label)
    X = np.array(X, dtype=np.float32)
    le = LabelEncoder()
    y = le.fit_transform(y_labels)
    clf = Pipeline([
        ('scaler', StandardScaler()),
        ('logreg', LogisticRegression(max_iter=1000, solver='saga'))
    ])
    clf.fit(X, y)
    joblib.dump({'pipeline': clf, 'labels': le.classes_.tolist()}, out_path)
    meta = {
        'samples': len(pairs),
        'classes': le.classes_.tolist(),
        'features': int(X.shape[1])
    }
    with open(os.path.join(os.path.dirname(__file__), 'yamnet_logreg.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print('Guardado', out_path)
    return 0

if __name__ == '__main__':
    sys.exit(main())
