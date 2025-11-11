"use client";
import React, { useEffect, useState } from 'react';
import { api } from "../../lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api.getHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const chartData = history.map((h, idx) => ({
    name: `#${idx+1}`,
    confidence: h?.aiResult?.probabilidad || Math.random()
  }));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p>Métricas de análisis recientes</p>
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