import React from 'react';

interface AnalysisSummaryProps {
  duration: number;
  date?: string;
  speciesFound: boolean;
  minConfidence: number;
  model: string;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  duration,
  date,
  speciesFound,
  minConfidence,
  model
}) => {
  const formatDuration = (s: number) => {
    if (!s) return '0:00';
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold mb-4 text-bioson-grayDark">Resumen del Análisis</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Duración</p>
          <p className="text-xl font-bold text-bioson-blue">{formatDuration(duration)}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Fecha</p>
          <p className="text-xl font-bold text-bioson-grayDark">{date || 'N/A'}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">¿Ave Detectada?</p>
          <p className={`text-xl font-bold ${speciesFound ? 'text-bioson-green' : 'text-orange-500'}`}>
            {speciesFound ? 'Sí' : 'No'}
          </p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Confianza Mín.</p>
          <p className="text-xl font-bold text-bioson-grayDark">{minConfidence}</p>
        </div>
      </div>
      <div className="mt-2 text-right">
        <span className="text-xs text-gray-400">Modelo: {model}</span>
      </div>
    </div>
  );
};
