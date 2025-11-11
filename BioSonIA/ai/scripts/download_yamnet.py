"""
Descarga artefactos de YAMNet desde TF Hub.
Si falla por restricciones de red, deja instrucciones claras.
"""
import os
import sys

def main():
    try:
        import tensorflow_hub as hub
        # Esto descarga y cachea el modelo en ~/.cache/tfhub_modules
        print("Descargando YAMNet desde TF Hub...")
        _ = hub.KerasLayer("https://tfhub.dev/google/yamnet/1")
        print("YAMNet descargado y cacheado correctamente.")
    except Exception as e:
        print("No se pudo descargar YAMNet automáticamente.")
        print("Error:", e)
        print("Alternativa: descarga manual del archivo y configura el clasificador.")
        print("Ver docs/modelo_ia.md para detalles.")

if __name__ == '__main__':
    main()