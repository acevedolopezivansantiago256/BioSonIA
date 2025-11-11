"use client";
import React, { useState } from 'react';
import { api } from "../../lib/api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const validateFile = (f: File) => {
    const allowed = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-wav"]; // mp3/wav
    const maxSizeMB = 25;
    if (!allowed.includes(f.type)) return "Formato inválido. Usa .wav o .mp3";
    if (f.size > maxSizeMB * 1024 * 1024) return `Archivo demasiado grande (> ${maxSizeMB}MB)`;
    return null;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    const v = validateFile(f);
    if (v) {
      setError(v);
      setFile(null);
    } else {
      setError(null);
      setFile(f);
    }
  };

  const onSubmit = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const res = await api.uploadAudio(file);
      setAnalysisId(res.analysisId);
    } catch (e: any) {
      setError(e?.message || "Error subiendo el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Subir audio de ave</h1>
      <input type="file" accept=".wav,.mp3" onChange={onFileChange} />
      {error && <p className="text-red-600">{error}</p>}
      <button onClick={onSubmit} disabled={!file || loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? "Subiendo..." : "Analizar"}
      </button>
      {analysisId && (
        <div className="mt-4">
          <p>Subido correctamente. ID de análisis: {analysisId}</p>
          <a className="text-blue-700 underline" href={`/results/${analysisId}`}>Ver resultados</a>
        </div>
      )}
    </div>
  );
}