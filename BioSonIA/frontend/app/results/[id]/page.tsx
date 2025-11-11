import React from 'react';
import { api } from "../../../lib/api";

async function getData(id: string) {
  try {
    const data = await api.getResult(id);
    return data;
  } catch {
    return null;
  }
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  if (!data) {
    return <div className="p-6">No se encontró resultado.</div>;
  }
  const { especie_predicha, probabilidad, top3, espectrograma_base64, espectrograma_birdnet_base64 } = data;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Resultado de análisis</h1>
      <p>Especie principal: <strong>{especie_predicha}</strong></p>
      <p>Probabilidad: {(probabilidad * 100).toFixed(1)}%</p>
      <div>
        <h2 className="text-xl">Top-3</h2>
        <ul className="list-disc ml-6">
          {top3?.map((t: any, i: number) => (
            <li key={i}>{t.especie} — {(t.prob * 100).toFixed(1)}%</li>
          ))}
        </ul>
      </div>
      {(espectrograma_base64 || espectrograma_birdnet_base64) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {espectrograma_base64 && (
            <div>
              <h2 className="text-xl">Espectrograma estándar</h2>
              <img src={`data:image/png;base64,${espectrograma_base64}`} alt="Spectrogram" />
            </div>
          )}
          {espectrograma_birdnet_base64 && (
            <div>
              <h2 className="text-xl">Espectrograma estilo BirdNET</h2>
              <img src={`data:image/png;base64,${espectrograma_birdnet_base64}`} alt="BirdNET Spectrogram" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}