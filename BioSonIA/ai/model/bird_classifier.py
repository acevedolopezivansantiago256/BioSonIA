import csv
import random

class BirdClassifier:
    def __init__(self):
        self.model = None
        self.model_name = "toy"
        self.classes = self._load_classes()
        # Intento de cargar YAMNet (opcional)
        try:
            import tensorflow as tf
            import tensorflow_hub as hub
            self.model = hub.KerasLayer("https://tfhub.dev/google/yamnet/1")
            self.model_name = "yamnet"
        except Exception:
            self.model = None
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

    def predict(self, y: np.ndarray, sr: int):
        # Si YAMNet disponible: usar embedding y un clasificador sencillo (placeholder)
        if self.model_name == "yamnet" and self.model is not None:
            # Placeholder: generar probabilidades aleatorias normalizadas
            vals = [random.random() for _ in range(len(self.classes))]
        else:
            vals = [random.random() for _ in range(len(self.classes))]
        s = sum(vals) or 1.0
        probs = [v / s for v in vals]
        idx = max(range(len(probs)), key=lambda i: probs[i])
        especie = self.classes[idx]
        # Obtener top3
        top3_idx = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)[:3]
        top3 = [(self.classes[i], float(probs[i])) for i in top3_idx]
        return especie, float(probs[idx]), top3