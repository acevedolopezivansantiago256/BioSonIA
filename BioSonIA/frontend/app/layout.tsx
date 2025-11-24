import './globals.css';
import React from 'react';
import NavBar from '../components/NavBar';

const LOGO_SRC = process.env.NEXT_PUBLIC_LOGO_PATH || '/logo.png';

export const metadata = {
  title: 'BioSonIA',
  description: 'Identificación de aves por audio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="p-4 bg-bioson-grayLight">
          <div className="flex items-center gap-4">
            <a href="/">
              <img src={LOGO_SRC} alt="Logo" className="w-36 h-auto" />
            </a>
            <NavBar />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}