import './globals.css';
import React from 'react';

export const metadata = {
  title: 'BioSonIA',
  description: 'Identificación de aves por audio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <nav className="p-4 bg-gray-100 flex gap-4">
          <a href="/" className="underline">Inicio</a>
          <a href="/upload" className="underline">Subir</a>
          <a href="/dashboard" className="underline">Dashboard</a>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}