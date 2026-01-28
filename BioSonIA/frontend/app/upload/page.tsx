'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export const dynamic = 'force-dynamic';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // References for UI manipulation
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File) => {
    const allowed = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav', 'audio/flac'];
    const maxSizeMB = 25;
    if (!allowed.includes(f.type) && !f.name.match(/\.(wav|mp3|flac)$/i)) {
      return "Formato inválido. Usa .wav, .mp3 o .flac";
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      return `Archivo demasiado grande (> ${maxSizeMB}MB)`;
    }
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      const f = files[0];
      const v = validateFile(f);
      if (v) {
        setError(v);
        setFile(null);
      } else {
        setError(null);
        setFile(f);
      }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.uploadAudio(file);
      // Redirect to results page
      router.push(`/results/${res.analysisId}`);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Error subiendo el archivo");
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 min-h-screen font-sans transition-colors duration-300">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                <span className="material-symbols-rounded text-white">waves</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">BioSonIA</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors" href="/">Inicio</a>
              <a className="text-sm font-medium text-primary border-b-2 border-primary pb-1" href="/upload">Subir</a>
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors" href="/dashboard">Dashboard</a>
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors" href="/docs">Guía</a>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                onClick={() => document.documentElement.classList.toggle('dark')}
              >
                <span className="material-symbols-rounded text-[20px]">brightness_4</span>
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors">Iniciar sesión</button>
              <button className="px-5 py-2.5 bg-primary hover:bg-green-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-primary/25 transition-all active:scale-95">Registrarse</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-slate-900 dark:text-white mb-4">Analizar Canto de Aves</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Sube un archivo de audio (WAV, MP3) para identificar la especie mediante IA.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all group ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-slate-200 dark:border-slate-700 hover:border-primary'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {!file ? (
              <>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-rounded text-4xl text-primary">mic_none</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Arrastra y suelta tu archivo aquí</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Formatos compatibles: WAV, MP3, FLAC (Máx. 25MB)</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <label className="cursor-pointer px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all">
                    Seleccionar Archivo
                    <input 
                      ref={fileInputRef}
                      className="hidden" 
                      type="file" 
                      accept=".wav,.mp3,.flac" 
                      onChange={onFileChange} 
                    />
                  </label>
                  <button 
                    disabled 
                    className="px-10 py-3 bg-primary text-white font-bold rounded-xl opacity-50 cursor-not-allowed shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                  >
                    Analizar Ahora
                    <span className="material-symbols-rounded text-[20px]">analytics</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center justify-center p-6 rounded-2xl bg-white/95 dark:bg-slate-900/95" id="file-info">
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl w-full max-w-sm mb-8">
                  <span className="material-symbols-rounded text-3xl text-primary">audio_file</span>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={removeFile}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-rounded">close</span>
                  </button>
                </div>
                
                {error && (
                  <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                )}

                <button 
                  onClick={onSubmit}
                  disabled={loading}
                  className={`px-12 py-3.5 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3 ${
                    loading ? 'opacity-75 cursor-wait' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin material-symbols-rounded">refresh</span>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-rounded">auto_awesome</span>
                      Comenzar Análisis IA
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
            <span className="material-symbols-rounded text-blue-500 mb-3">timer</span>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Duración ideal</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Graba al menos 10 segundos para mejores resultados.</p>
          </div>
          <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
            <span className="material-symbols-rounded text-amber-500 mb-3">graphic_eq</span>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Ruido de fondo</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Intenta minimizar el ruido del viento o tráfico cercano.</p>
          </div>
          <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
            <span className="material-symbols-rounded text-purple-500 mb-3">straighten</span>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Distancia</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Mantente a una distancia segura pero clara del ave.</p>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Subidas Recientes</h2>
            <button className="text-primary text-sm font-semibold hover:underline">Ver todas</button>
          </div>
          <div className="grid gap-3">
            {/* Ejemplo estático para mantener el diseño, esto podría ser dinámico luego */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400">
                <span className="material-symbols-rounded">music_note</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">canto_tucan_amazonas.mp3</h4>
                <p className="text-xs text-slate-500">Hace 2 horas • 86.5% Confianza</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">
                <span className="material-symbols-rounded text-[14px]">check_circle</span>
                Analizado
              </div>
              <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-rounded text-slate-400 hover:text-primary">visibility</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-10 border-t border-slate-200 dark:border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="material-symbols-rounded text-primary">waves</span>
          <span className="font-display font-bold text-slate-900 dark:text-white">BioSonIA</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-500">© 2024 BioSonIA. Monitoreo acústico inteligente para la biodiversidad.</p>
      </footer>
    </div>
  );
}
