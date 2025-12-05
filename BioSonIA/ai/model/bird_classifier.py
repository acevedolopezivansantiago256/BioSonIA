import os
import csv
import random
import numpy as np
import joblib

class BirdClassifier:
    def __init__(self):
        self.model = None
        self.model_name = "toy"
        self.classes = self._load_classes()
        self.yamnet = None
        self.pipeline = None
        try:
            import tensorflow_hub as hub
            self.yamnet = hub.load("https://tfhub.dev/google/yamnet/1")
        except Exception:
            self.yamnet = None
        try:
            pkl_path = os.path.join(os.path.dirname(__file__), "yamnet_logreg.pkl")
            if os.path.exists(pkl_path):
                data = joblib.load(pkl_path)
                self.pipeline = data.get("pipeline")
                labels = data.get("labels") or []
                if labels:
                    self.classes = labels
                self.model_name = "yamnet_sklearn"
            elif self.yamnet is not None:
                self.model_name = "yamnet"
            else:
                self.model_name = "toy"
        except Exception:
            self.pipeline = None
            self.model_name = "toy"

    def _load_classes(self):
        mapping = []
        try:
            with open('ai/model/class_map.csv', 'r', encoding='utf-8') as f:
                rdr = csv.reader(f)
                for row in rdr:
                    if row:
                        mapping.append(row[0])
        except Exception:
            mapping = ["Passer domesticus", "Columba livia", "Turdus migratorius"]
        return mapping

    def _embedding(self, y: np.ndarray, sr: int):
        if self.yamnet is None or y is None or getattr(y, "size", 0) == 0:
            return None
        try:
            import tensorflow as tf
            if sr != 16000 and sr > 0 and y.size > 0:
                duration = y.size / float(sr)
                t_orig = np.linspace(0.0, duration, num=y.size, endpoint=False)
                t_target = np.linspace(0.0, duration, num=int(round(duration*16000)), endpoint=False)
                y = np.interp(t_target, t_orig, y).astype(np.float32)
                sr = 16000
            wf = tf.convert_to_tensor(y, dtype=tf.float32)
            scores, embeddings, spectrogram = self.yamnet(wf)
            e = embeddings.numpy()
            if e.ndim == 2:
                vec = e.mean(axis=0)
            else:
                vec = np.mean(e, axis=0)
            return vec.astype(np.float32)
        except Exception:
            return None

    def predict(self, y: np.ndarray, sr: int):
        if self.pipeline is not None and self.yamnet is not None:
            vec = self._embedding(y, sr)
            if vec is not None:
                probs = self.pipeline.predict_proba(vec.reshape(1, -1))[0]
                idx = int(np.argmax(probs))
                especie = self.classes[idx]
                top3_idx = np.argsort(probs)[::-1][:3]
                top3 = [(self.classes[i], float(probs[i])) for i in top3_idx]
                return especie, float(probs[idx]), top3
        vals = [random.random() for _ in range(len(self.classes))]
        s = sum(vals) or 1.0
        probs = [v / s for v in vals]
        idx = max(range(len(probs)), key=lambda i: probs[i])
        especie = self.classes[idx]
        # Obtener top3
        top3_idx = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)[:3]
        top3 = [(self.classes[i], float(probs[i])) for i in top3_idx]
        return especie, float(probs[idx]), top3
