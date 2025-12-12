import React from 'react';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">BioSonIA</h1>
      <p>Sube un audio en la sección "Subir" para analizar.</p>
    </div>
  );
}
