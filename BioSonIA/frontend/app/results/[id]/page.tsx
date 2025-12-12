import React from 'react';
import { api } from "../../../lib/api";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const { especie_predicha, probabilidad, top3, espectrograma_base64, waveform_pair_base64, detecciones } = data;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Resultado de análisis</h1>
      <p>Especie principal: <strong>{especie_predicha}</strong></p>
      <p>Probabilidad: {(((probabilidad ?? 0) * 100)).toFixed(1)}%</p>
      <div>
        <h2 className="text-xl">Top-3</h2>
        <ul className="list-disc ml-6">
          {top3?.map((t: any, i: number) => {
            const p = t?.prob ?? t?.probabilidad ?? 0;
            return (
              <li key={i}>{t.especie} — {(p * 100).toFixed(1)}%</li>
            );
          })}
        </ul>
      </div>
      {waveform_pair_base64 && (
        <div>
          <h2 className="text-xl">Señal en el dominio del tiempo</h2>
          <img src={`data:image/png;base64,${waveform_pair_base64}`} alt="Waveform clean/noisy" />
        </div>
      )}
      {espectrograma_base64 && (
        <div>
          <h2 className="text-xl">Espectrograma estándar</h2>
          <img src={`data:image/png;base64,${espectrograma_base64}`} alt="Spectrogram" />
        </div>
      )}
      <div>
        <h2 className="text-xl">Detecciones BirdNET</h2>
        {Array.isArray(detecciones) && detecciones.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Inicio (s)</th>
                <th className="text-left p-2">Fin (s)</th>
                <th className="text-left p-2">Especie</th>
                <th className="text-left p-2">Confianza</th>
              </tr>
            </thead>
            <tbody>
              {detecciones.map((d: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{Number(d.inicio ?? 0).toFixed(2)}</td>
                  <td className="p-2">{Number(d.fin ?? 0).toFixed(2)}</td>
                  <td className="p-2">{d.especie} <span className="text-gray-500">({d.nombre_cientifico})</span></td>
                  <td className="p-2">{Number(d.confianza ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">Semillero Tesla SENA.</p>
        )}
      </div>
    </div>
  );
}
