"use client";
import React, { useEffect, useState } from 'react';
import { api } from "../../lib/api";
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

export const dynamic = 'force-dynamic';

const getTop1 = (h: any): { species: string; confidence: number } => {
  if (h?.aiResult?.especie) {
    return { species: h.aiResult.especie, confidence: typeof h.aiResult.probabilidad === 'number' ? h.aiResult.probabilidad : 0 };
  }
  const r = h?.result;
  if (r?.detected === true && Array.isArray(r?.top3) && r.top3.length > 0) {
    const t = r.top3[0] || {};
    const species = typeof t.species === 'string' ? t.species : typeof t.especie === 'string' ? t.especie : '—';
    const confidence =
      typeof t.confidence === 'number' ? t.confidence : typeof t.probabilidad === 'number' ? t.probabilidad : typeof t.prob === 'number' ? t.prob : 0;
    return { species, confidence };
  }
  return { species: '—', confidence: 0 };
};

export default function DashboardPage() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api.getHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const totalAudios = history.length;
  const latest = history[0];
  const latestTop1 = getTop1(latest);
  const latestSpecies = latestTop1.species;
  const latestPrecision = (latestTop1.confidence * 100);

  // Confidence evolution data (last 30)
  // Reversed because history is usually DESC
  const chartData = [...history].reverse().slice(-30).map((h, idx) => ({
    name: `ID ${h.id}`,
    confidence: getTop1(h).confidence,
    date: new Date(h.createdAt || Date.now()).toLocaleDateString()
  }));

  const avgPrecision = chartData.length 
    ? (chartData.reduce((s, x) => s + (x.confidence), 0) / chartData.length) * 100 
    : 0;

  // Top species calculation
  const speciesCounts: Record<string, number> = {};
  history.forEach(h => {
    const s = getTop1(h).species;
    if (s !== '—') {
      speciesCounts[s] = (speciesCounts[s] || 0) + 1;
    }
  });
  
  const topSpecies = Object.entries(speciesCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));

  const maxCount = topSpecies.length > 0 ? topSpecies[0].count : 1;

  // Recent 5 for table
  const recentHistory = history.slice(0, 5);

  const colors = ['bg-primary', 'bg-emerald-500', 'bg-teal-500', 'bg-slate-400'];

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 min-h-screen font-sans transition-colors duration-300">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg shadow-lg shadow-primary/20">
                <span className="material-symbols-rounded text-white">waves</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">BioSonIA</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a className="text-sm font-medium hover:text-primary transition-colors" href="/">Inicio</a>
              <a className="text-sm font-medium hover:text-primary transition-colors" href="/upload">Subir</a>
              <a className="text-sm font-medium text-primary border-b-2 border-primary pb-1" href="/dashboard">Dashboard</a>
              <a className="text-sm font-medium hover:text-primary transition-colors" href="/docs">Guía</a>
            </div>
            <div className="flex items-center gap-3">
               <button 
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                onClick={() => document.documentElement.classList.toggle('dark')}
              >
                <span className="material-symbols-rounded text-[20px]">brightness_4</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Panel de Análisis</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Monitorea el rendimiento de tus identificaciones de bioacústica.</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                 <span className="material-symbols-rounded text-lg">picture_as_pdf</span>
                 Exportar PDF
             </button>
             <a href="/upload" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-emerald-600 transition-all shadow-lg shadow-primary/25">
                 <span className="material-symbols-rounded text-lg">add</span>
                 Nuevo Análisis
             </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 group hover:shadow-md transition-shadow">
             <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                     <span className="material-symbols-rounded">headset</span>
                 </div>
                 <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">+12% vs mes ant.</span>
             </div>
             <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">Total de audios analizados</h3>
             <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalAudios}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 group hover:shadow-md transition-shadow">
             <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-primary/10 rounded-xl text-primary">
                     <span className="material-symbols-rounded">auto_awesome</span>
                 </div>
                 <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reciente</span>
             </div>
             <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">Último resultado</h3>
             <div className="flex items-baseline gap-2 mt-2">
                 <p className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{latestSpecies}</p>
                 <p className="text-sm font-medium text-primary">{latestPrecision.toFixed(1)}%</p>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 group hover:shadow-md transition-shadow">
             <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-400">
                     <span className="material-symbols-rounded">insights</span>
                 </div>
                 <div className="flex gap-1">
                     <div className="w-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                     <div className="w-1 h-6 bg-amber-400 rounded-full"></div>
                     <div className="w-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                 </div>
             </div>
             <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">Precisión promedio</h3>
             <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{avgPrecision.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Evolución de Confianza</h3>
                  <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">Últimos {chartData.length} registros</div>
              </div>
              <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#64748b', marginBottom: '0.25rem', fontSize: '0.75rem' }}
                            itemStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '0.875rem' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="confidence" 
                            stroke="#22c55e" 
                            strokeWidth={3}
                            dot={{ fill: '#ffffff', stroke: '#22c55e', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#22c55e' }}
                          />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                  <span>Antiguo</span>
                  <span>Reciente</span>
              </div>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
               <div className="flex items-center justify-between mb-8">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white">Especies Más Detectadas</h3>
               </div>
               <div className="space-y-6">
                   {topSpecies.map((s, i) => (
                     <div key={s.name}>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">0{i + 1}</span>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{s.name}</h4>
                            </div>
                            <span className="text-xs font-bold text-slate-500">{s.count} detecciones</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-1000`} 
                                style={{ width: `${(s.count / maxCount) * 100}%` }}
                            ></div>
                        </div>
                     </div>
                   ))}
                   {topSpecies.length === 0 && <p className="text-slate-400 text-sm">No hay datos suficientes.</p>}
               </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Últimos Análisis</h3>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                         <tr>
                             <th className="px-6 py-4">ID / Archivo</th>
                             <th className="px-6 py-4">Fecha</th>
                             <th className="px-6 py-4">Resultado Principal</th>
                             <th className="px-6 py-4">Confianza</th>
                             <th className="px-6 py-4 text-right">Acción</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                         {recentHistory.map((h) => {
                             const top = getTop1(h);
                             return (
                                 <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                 <span className="material-symbols-rounded text-sm">audiotrack</span>
                                             </div>
                                             <span className="text-sm font-medium text-slate-700 dark:text-slate-300">ID #{h.id}</span>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 text-sm text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</td>
                                     <td className="px-6 py-4">
                                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            {top.species}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-2">
                                             <div className="flex-1 h-1.5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full">
                                                 <div className="h-full bg-primary rounded-full" style={{ width: `${top.confidence * 100}%` }}></div>
                                             </div>
                                             <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{(top.confidence * 100).toFixed(0)}%</span>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 text-right">
                                         <a href={`/results/${h.id}`} className="text-slate-400 hover:text-primary transition-colors">
                                             <span className="material-symbols-rounded">open_in_new</span>
                                         </a>
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-12 border-t border-slate-200 dark:border-slate-800 text-center">
         <p className="text-xs text-slate-400 font-medium">© 2024 BioSonIA Project. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
