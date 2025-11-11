#!/usr/bin/env bash
set -euo pipefail

AI_URL=${AI_URL:-http://localhost:5001}
SAMPLE=ai/data/sample_audio/example1.wav
OUT=docs/sample_response.json

if [ ! -f "$SAMPLE" ]; then
  echo "No existe $SAMPLE. Ejecuta ai/scripts/fetch_dataset.sh primero." >&2
  exit 1
fi

echo "Haciendo POST a $AI_URL/analyze con $SAMPLE ..."
curl -s -X POST "$AI_URL/analyze" \
  -F "file=@$SAMPLE" \
  -H "Expect:" \
  | tee "$OUT"

echo "Guardado en $OUT"