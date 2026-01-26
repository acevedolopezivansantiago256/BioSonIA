"use client";

import React from "react";

type ConfidenceSliderProps = {
  initialValue?: number;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({ initialValue }) => {
  const [value, setValue] = React.useState(() => clamp(Number(initialValue ?? 0.3), 0.1, 0.9));

  const percent = Math.round(value * 100);

  return (
    <div className="card p-4 border-l-4 border-orange-500 bg-orange-50 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-orange-700 uppercase font-bold">Sensibilidad</p>
          <p className="text-sm text-orange-700/80">
            Ajusta el umbral para entender qué tan exigente es la detección.
          </p>
        </div>
        <div className="text-orange-800 font-semibold whitespace-nowrap">Umbral: {percent}%</div>
      </div>

      {/* Por ahora es solo visual: no dispara ningún re-análisis ni cambia el backend */}
      <input
        type="range"
        min={0.1}
        max={0.9}
        step={0.05}
        value={value}
        onChange={(e) => setValue(clamp(Number(e.target.value), 0.1, 0.9))}
        className="w-full accent-orange-500"
        aria-label="Umbral de confianza"
      />

      <div className="flex items-center justify-between text-xs text-orange-700/70">
        <span>0.1 (más sensible)</span>
        <span>0.9 (más estricto)</span>
      </div>
    </div>
  );
};

