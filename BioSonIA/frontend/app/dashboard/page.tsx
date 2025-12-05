"use client";
import React, { useEffect, useState } from 'react';
import { api } from "../../lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function DashboardPage() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api.getHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const chartData = history.map((h, idx) => ({
    name: `#${idx+1}`,
    confidence: h?.aiResult?.probabilidad || Math.random()
  }));

  const totalAudios = history.length;
  const latest = history[0];
  const latestSpecies = latest?.aiResult?.especie ?? latest?.result?.especie_predicha ?? '—';
  const latestPrecision = ((latest?.aiResult?.probabilidad ?? latest?.result?.probabilidad ?? 0) * 100);

  const precisionSeries = history.map((h, idx) => ({
    name: (() => {
      const d = new Date(h?.createdAt ?? Date.now());
      return d.toLocaleDateString('es-ES');
    })(),
    precision: ((h?.aiResult?.probabilidad ?? h?.result?.probabilidad ?? 0) * 100)
  }));

  const groups: Record<string, number> = {};
  history.forEach((h) => {
    const d = new Date(h?.createdAt ?? Date.now()).toISOString().slice(0,10);
    groups[d] = (groups[d] || 0) + 1;
  });
  const barData = Object.entries(groups).sort(([a],[b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
  const avgPrecision = precisionSeries.length ? (precisionSeries.reduce((s, x) => s + (x.precision || 0), 0) / precisionSeries.length) : 0;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p>Métricas de análisis recientes</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-bioson-grayDark">Total de audios analizados</div>
            <div className="text-2xl font-bold">{totalAudios}</div>
          </div>
          <div className="text-3xl">🎧</div>
        </div>
        <div className="card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-bioson-grayDark">Último resultado</div>
            <div className="text-lg font-semibold">{latestSpecies}</div>
            <div className="text-sm text-bioson-grayDark">{latestPrecision.toFixed(1)}%</div>
          </div>
          <div className="text-3xl">🕊️</div>
        </div>
        <div className="card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-bioson-grayDark">Precisión del análisis (%)</div>
            <div className="text-2xl font-bold">{avgPrecision.toFixed(1)}%</div>
          </div>
          <div className="text-3xl">📊</div>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="confidence" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Evolución de la precisión</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={precisionSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="precision" stroke="#3498DB" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Audios analizados por fecha</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2ECC71" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <h2 className="text-xl">Historial</h2>
        <ul className="list-disc ml-6">
          {history.map((h) => (
            <li key={h.id}>
              <a className="text-blue-700 underline" href={`/results/${h.id}`}>Análisis {h.id}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
