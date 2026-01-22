import React from "react";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ResultPayload = {
  especie_predicha?: string;
  probabilidad?: number;
  top3?: Array<{ especie: string; prob?: number; probabilidad?: number }>;
  espectrograma_base64?: string | null;
  espectrograma_birdnet_base64?: string | null;
  waveform_pair_base64?: string | null;
  detecciones?: Array<any>;
  metadatos?: any;
};

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  let data: ResultPayload | null = null;
  try {
    const res = await fetch(`${API_BASE}/results/${id}`, { cache: 'no-store' });
    data = await res.json();
  } catch {
    data = null;
  }
  const sp = data?.especie_predicha || "Sin especie";
  const prob = (data?.probabilidad ?? 0);
  const specStd = data?.espectrograma_base64 || null;
  const specBN = data?.espectrograma_birdnet_base64 || null;
  const wavePair = data?.waveform_pair_base64 || null;
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold">Resultados</h1>
      <div className="card p-4 space-y-2">
        <p><strong>ID:</strong> {id}</p>
        <p><strong>Especie predicha:</strong> {sp}</p>
        <p><strong>Probabilidad:</strong> {(prob * 100).toFixed(1)}%</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Espectrograma estándar</h2>
          {specStd ? (
            <img src={`data:image/png;base64,${specStd}`} alt="Espectrograma estándar" className="w-full h-auto rounded" />
          ) : (
            <p>No disponible</p>
          )}
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Espectrograma estilo BirdNET</h2>
          {specBN ? (
            <img src={`data:image/png;base64,${specBN}`} alt="Espectrograma BirdNET" className="w-full h-auto rounded" />
          ) : (
            <p>No disponible</p>
          )}
        </div>
        <div className="card p-4 md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Waveform limpio vs. ruidoso</h2>
          {wavePair ? (
            <img src={`data:image/png;base64,${wavePair}`} alt="Waveform" className="w-full h-auto rounded" />
          ) : (
            <p>No disponible</p>
          )}
        </div>
      </div>
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Top-3</h2>
        <ul className="list-disc pl-6">
          {(data?.top3 || []).map((t, i) => (
            <li key={i}>
              {t.especie} — {(((t.prob ?? t.probabilidad) || 0) * 100).toFixed(1)}%
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Detecciones</h2>
        <pre className="text-sm overflow-auto">{JSON.stringify(data?.detecciones || [], null, 2)}</pre>
      </div>
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Metadatos</h2>
        <pre className="text-sm overflow-auto">{JSON.stringify(data?.metadatos || {}, null, 2)}</pre>
      </div>
    </div>
  );
}
