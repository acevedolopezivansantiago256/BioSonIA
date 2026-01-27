import React from "react";
import { AnalysisSummary } from "../../../components/AnalysisSummary";
import { ConfidenceSlider } from "../../../components/ConfidenceSlider";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ResultPayload = {
  detected?: boolean;
  message?: string;
  top3?: Array<
    | { species: string; confidence: number }
    | { especie: string; prob?: number; probabilidad?: number }
  >;
  metadata?: any;
  especie_predicha?: string;
  probabilidad?: number;
  metadatos?: any;
  espectrograma_base64?: string | null;
  espectrograma_birdnet_base64?: string | null;
  waveform_pair_base64?: string | null;
  detecciones?: Array<any>;
};

const normalizeTop3 = (raw: any): Array<{ species: string; confidence: number }> => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => {
      if (t && typeof t === "object") {
        if (typeof (t as any).species === "string" && typeof (t as any).confidence === "number") {
          return { species: (t as any).species, confidence: (t as any).confidence };
        }
        if (typeof (t as any).especie === "string") {
          const p =
            typeof (t as any).probabilidad === "number"
              ? (t as any).probabilidad
              : typeof (t as any).prob === "number"
                ? (t as any).prob
                : 0;
          return { species: (t as any).especie, confidence: p };
        }
      }
      return null;
    })
    .filter((x): x is { species: string; confidence: number } => Boolean(x));
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

  const detected = data?.detected === true;
  const notDetected = data?.detected === false;

  const top3 = normalizeTop3(detected ? data?.top3 : data?.top3);
  const top1 = top3[0] || null;

  const sp = detected
    ? (top1?.species || "Sin detección")
    : data?.especie_predicha || "Sin detección";
  const prob = detected ? (top1?.confidence ?? 0) : (data?.probabilidad ?? 0);
  const specStd = data?.espectrograma_base64 || null;
  const specBN = data?.espectrograma_birdnet_base64 || null;
  const wavePair = data?.waveform_pair_base64 || null;
  const detecciones = data?.detecciones || [];
  const showNoDetections = notDetected || (!detected && (detecciones.length === 0 || prob === 0)) || top3.length === 0;
  
  // Datos para el resumen
  const meta = (data?.metadata ?? data?.metadatos) || {};
  const duration = meta.duracion || 0;
  const date = meta.date || new Date().toISOString().split('T')[0];
  const minConf = meta.min_confidence || 0.6;
  const model = meta.model || meta.modelo || "Desconocido";
  
  // Lógica simple para "Ave Detectada"
  const speciesFound = detected && sp !== "Sin detección";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-bioson-grayDark">Resultados del Análisis</h1>
        <span className="text-sm text-gray-400">ID: {id}</span>
      </div>

      {/* Nuevo componente de resumen amigable */}
      <AnalysisSummary 
        duration={duration}
        date={date}
        speciesFound={speciesFound}
        minConfidence={minConf}
        model={model}
      />

      <ConfidenceSlider initialValue={minConf} />

      {showNoDetections && (
        <div className="card p-4 border-l-4 border-orange-500 bg-orange-50 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐦</span>
            <p className="text-orange-900 font-semibold">{data?.message || "No se detectaron aves con suficiente confianza"}</p>
          </div>
          <div className="text-sm text-orange-800/90">
            <p className="font-medium mb-1">Esto puede pasar por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Audio con mucho ruido</li>
              <li>Canto débil o lejano</li>
              <li>Umbral de confianza alto</li>
            </ul>
          </div>
        </div>
      )}

      <div className="card p-4 space-y-2 border-l-4 border-bioson-blue">
        <p className="text-sm text-gray-500 uppercase font-bold">Especie Predicha</p>
        <div className="flex items-end gap-4">
          <p className="text-3xl font-bold text-bioson-grayDark">{sp}</p>
          <p className="text-lg text-gray-600 pb-1">Confianza: {(prob * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Espectrograma estándar</h2>
          {specStd ? (
            <img src={`data:image/png;base64,${specStd}`} alt="Espectrograma estándar" className="w-full h-auto rounded" />
          ) : (
            <p className="text-gray-400 italic">No disponible</p>
          )}
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Espectrograma estilo BirdNET</h2>
          {specBN ? (
            <img src={`data:image/png;base64,${specBN}`} alt="Espectrograma BirdNET" className="w-full h-auto rounded" />
          ) : (
            <p className="text-gray-400 italic">No disponible</p>
          )}
        </div>
        <div className="card p-4 md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Waveform (Limpio vs Ruidoso)</h2>
          {wavePair ? (
            <img src={`data:image/png;base64,${wavePair}`} alt="Waveform" className="w-full h-auto rounded" />
          ) : (
            <p className="text-gray-400 italic">No disponible</p>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Top-3 Candidatos</h2>
        {top3.length > 0 ? (
          <ul className="list-disc pl-6 space-y-1">
            {top3.map((t, i) => (
              <li key={i} className="text-bioson-grayDark">
                <span className="font-medium">{t.species}</span> —{" "}
                <span className="text-gray-500">{((t.confidence || 0) * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No hay candidatos detectados en este audio.</p>
        )}
      </div>

      {/* Sección técnica oculta por defecto */}
      <div className="pt-8 border-t border-gray-200">
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-bioson-blue flex items-center gap-2 select-none">
            <span>🛠️ Ver detalles técnicos y metadatos (Debug)</span>
            <span className="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Detecciones Crudas</h3>
              <pre className="text-xs overflow-auto bg-white p-2 border rounded max-h-40">{JSON.stringify(detecciones, null, 2)}</pre>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Metadatos Completos</h3>
              <pre className="text-xs overflow-auto bg-white p-2 border rounded max-h-40">{JSON.stringify(meta || {}, null, 2)}</pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
