'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SpectrogramCard from "../../components/SpectrogramCard";
import BirdChat from "../../components/BirdChat";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ResultPayload = {
  status?: string;
  detected?: boolean;
  message?: string;
  top3?: Array<{ species: string; confidence: number }>;
  metadata?: any;
  espectrograma_base64?: string | null;
  espectrograma_birdnet_base64?: string | null;
  espectrograma_referencia_base64?: string | null;
  waveform_pair_base64?: string | null;
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
          const p = typeof (t as any).probabilidad === "number" ? (t as any).probabilidad
                  : typeof (t as any).prob === "number" ? (t as any).prob
                  : 0;
          return { species: (t as any).especie, confidence: p };
        }
      }
      return null;
    })
    .filter((x): x is { species: string; confidence: number } => Boolean(x));
};

export default function ResultsPage() {
  const params = useParams();
  const id = params?.id as string;
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  const [data, setData] = useState<ResultPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [minConf, setMinConf] = useState(0.25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const pendingStatuses = new Set(['queued', 'processing', 'running']);

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/results/${id}`, { cache: 'no-store' });
        const d = await res.json();
        if (cancelled) return;
        setData(d);
        if (d?.metadata?.min_confidence) {
          setMinConf(d.metadata.min_confidence);
        }
        if (pendingStatuses.has(String(d?.status || ''))) {
          setLoading(true);
          timeoutId = setTimeout(load, 3000);
          return;
        }
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [id, API_BASE]);

  // Audio Player Simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1; // 1% every 100ms approx 10s duration simulated
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleExport = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } catch {
      alert("Failed to copy link.");
    }
  };

  const toggleTheme = () => document.documentElement.classList.toggle('dark');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
         <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-rounded animate-spin text-5xl text-primary">graphic_eq</span>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Analyzing Audio...</p>
            <p className="text-xs text-slate-400">El archivo se subio correctamente y el analisis sigue en progreso.</p>
         </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-slate-500">Error loading analysis results.</div>;
  }

  if (data.status === 'failed') {
    return <div className="p-8 text-center text-red-500">{data.message || 'El analisis fallo.'}</div>;
  }

  const detected = data.detected === true;
  const top3 = normalizeTop3(data.top3);
  const top1 = top3[0] || null;

  const speciesName = (detected && top1) ? top1.species : "No Detection";
  const confidence = (detected && top1) ? top1.confidence : 0;
  const confidencePct = (confidence * 100).toFixed(1);
  
  // Metadata
  const meta = data.metadata || {};
  const dateStr = meta.date ? new Date(meta.date).toLocaleDateString() : new Date().toLocaleDateString();
  const timeStr = meta.date ? new Date(meta.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const duration = meta.duration || 0; 

  const formatDuration = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const specStd = data.espectrograma_base64 ? `data:image/png;base64,${data.espectrograma_base64}` : null;
  const specBN = data.espectrograma_birdnet_base64 ? `data:image/png;base64,${data.espectrograma_birdnet_base64}` : null;
  const specRef = data.espectrograma_referencia_base64 ? `data:image/png;base64,${data.espectrograma_referencia_base64}` : null;
  const wavePair = data.waveform_pair_base64 ? `data:image/png;base64,${data.waveform_pair_base64}` : null;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 transition-colors duration-300 min-h-screen font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="BioSonIA" className="h-16 w-auto object-contain" />
           </div>
          <div className="hidden md:flex items-center space-x-1">
             <a href="/upload" className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Start New Analysis</a>
             <a href="/dashboard" className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Dashboard</a>
             <a href="/docs" className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Library</a>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
               <span className="material-symbols-rounded">contrast</span>
             </button>
             <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
             <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-6 py-8 pb-32">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
           <div>
             <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
               <a href="/dashboard" className="hover:text-primary transition-colors">Analyst</a>
               <span className="material-symbols-rounded text-[14px]">chevron_right</span>
               <span className="text-primary">Recording Analysis</span>
             </nav>
             <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Detailed Analysis Results</h1>
             <div className="flex items-center gap-4 mt-3">
               <p className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded">SID: {id}</p>
               <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <span className="material-symbols-rounded text-[16px]">schedule</span>
                  Analyzed on {dateStr} • {timeStr}
               </span>
             </div>
           </div>
           <div className="flex gap-3">
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg transition-all text-sm font-bold"
              >
                 <span className="material-symbols-rounded text-[20px]">file_download</span> Export PDF
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:brightness-110 shadow-lg shadow-primary/25 transition-all text-sm font-bold"
              >
                 <span className="material-symbols-rounded text-[20px]">share</span> Share Results
              </button>
           </div>
        </header>

        {/* Top Hero Section */}
        <div className="grid grid-cols-12 gap-6 mb-8">
           {/* Confidence Card */}
           <div className="col-span-12 lg:col-span-8">
              <div className="bg-card-light dark:bg-card-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-8 items-center h-full relative overflow-hidden shadow-sm">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                 
                 <div className="relative flex-shrink-0">
                    <div className="w-44 h-44 rounded-full p-4 flex items-center justify-center relative bg-slate-100 dark:bg-slate-800">
                       <div 
                        className="absolute inset-0 rounded-full"
                        style={{ background: `conic-gradient(#10b981 ${confidence * 360}deg, transparent 0)` }}
                       ></div>
                       <div className="absolute inset-2 bg-white dark:bg-slate-900 rounded-full z-10 flex flex-col items-center justify-center shadow-inner">
                           <span className="text-4xl font-black text-slate-900 dark:text-white">{confidencePct}<span className="text-lg text-primary">%</span></span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Confidence</span>
                       </div>
                    </div>
                    {detected && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg">Verified</div>}
                 </div>

                 <div className="flex-1 text-center md:text-left z-10">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-extrabold rounded-lg uppercase tracking-wider mb-4 inline-block">Primary Match</span>
                    <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white italic tracking-tight leading-tight mb-2">
                       {speciesName}
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-semibold">
                       {detected ? "Species Detected" : "Low Confidence / Noise"}
                    </p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                          <span className="material-symbols-rounded text-primary text-sm">timer</span>
                          <span className="text-xs font-bold">{formatDuration(duration)} duration</span>
                       </div>
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                          <span className="material-symbols-rounded text-orange-500 text-sm">settings</span>
                          <span className="text-xs font-bold uppercase">Model v2.4</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Species Profile / Info */}
           <div className="col-span-12 lg:col-span-4">
              <div className="bg-card-light dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full shadow-sm">
                 <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/30">
                    <span className="material-symbols-rounded text-primary text-xl">info</span>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Analysis Details</h3>
                 </div>
                 <div className="p-6 flex-1 flex flex-col gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex-1">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sensitivity Threshold</h4>
                       <div className="flex items-center gap-4">
                           <input 
                              type="range" 
                              min="0.1" 
                              max="0.9" 
                              step="0.05" 
                              value={minConf} 
                              onChange={(e) => setMinConf(parseFloat(e.target.value))}
                              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                           />
                           <span className="text-xs font-mono font-bold text-primary">{minConf}</span>
                       </div>
                       <p className="text-[10px] text-slate-500 mt-2 italic">
                         Adjust the visualization threshold (This does not re-analyze the audio).
                       </p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Top Predictions</h4>
                       <ul className="space-y-2">
                          {top3.slice(0, 3).map((t, idx) => (
                             <li key={idx} className="flex justify-between items-center text-xs">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{t.species}</span>
                                <span className={`font-mono font-bold ${(t.confidence * 100) >= (minConf * 100) ? 'text-primary' : 'text-slate-400'}`}>
                                   {(t.confidence * 100).toFixed(1)}%
                                </span>
                             </li>
                          ))}
                          {top3.length === 0 && <li className="text-xs text-slate-400 italic">No predictions available</li>}
                       </ul>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Spectrogram Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${specRef ? 'lg:grid-cols-3' : ''} gap-6 mb-6`}>
             <div className="h-80">
                <SpectrogramCard 
                  title="Standard Linear Spectrogram" 
                  imageSrc={specStd} 
                  altText="Standard Spectrogram" 
                />
             </div>
             <div className="h-80">
                <SpectrogramCard 
                  title="BirdNET-Style Spectrogram" 
                  imageSrc={specBN} 
                  altText="BirdNET Spectrogram" 
                />
             </div>
             {specRef && (
               <div className="h-80">
                  <SpectrogramCard 
                    title={`Reference: ${speciesName}`}
                    imageSrc={specRef} 
                    altText={`Reference spectrogram for ${speciesName}`}
                  />
               </div>
             )}
        </div>

        {/* Waveform Full Width */}
         <div className="bg-card-light dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mb-6">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
               <div className="flex items-center gap-4">
                  <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">Temporal Waveform Comparison</h3>
                  <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700"></div>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Amplitude</span>
                     </div>
                  </div>
               </div>
            </div>
            <div className="p-8 h-80">
              <SpectrogramCard
                title="Waveform Visualizer"
                imageSrc={wavePair}
                altText="Waveform"
              />
            </div>
        </div>

        {/* Floating Chat */}
        <BirdChat speciesName={speciesName} />

      </main>

      {/* Floating Audio Player */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-40 print:hidden">
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-2 rounded-[28px] flex items-center gap-4 shadow-2xl">
           <div className="flex items-center gap-2 p-1">
             <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full">
               <span className="material-symbols-rounded text-[24px]">replay_10</span>
             </button>
             <button 
                className="w-14 h-14 flex items-center justify-center bg-primary text-white rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/30"
                onClick={() => setIsPlaying(!isPlaying)}
             >
               <span className="material-symbols-rounded text-[36px] fill-current">{isPlaying ? 'pause' : 'play_arrow'}</span>
             </button>
             <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full">
               <span className="material-symbols-rounded text-[24px]">forward_10</span>
             </button>
           </div>
           
           <div className="flex-1 px-2">
             <div className="flex justify-between text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tighter">
                <span>{formatDuration((duration * progress) / 100)}</span>
                {detected && <span className="text-primary bg-primary/5 px-2 py-0.5 rounded">{speciesName} Detected</span>}
                <span>{formatDuration(duration)}</span>
             </div>
             <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer group" onClick={() => { /* Seek logic could go here */ }}>
                <div className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%` }}></div>
             </div>
           </div>

           <div className="flex items-center gap-1 pr-4">
             <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50"><span className="material-symbols-rounded text-[22px]">volume_up</span></button>
             <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50"><span className="material-symbols-rounded text-[22px]">speed</span></button>
           </div>
        </div>
      </div>
      
    </div>
  );
}
