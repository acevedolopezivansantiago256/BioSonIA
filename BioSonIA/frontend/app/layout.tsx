import './globals.css';
import React from 'react';
import NavBar from '../components/NavBar';

const LOGO_SRC = process.env.NEXT_PUBLIC_LOGO_PATH || '/logo.png';

export const metadata = {
  title: 'BioSonIA',
  description: 'Identificación de aves por audio',
};
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
      </head>
      <body>
        {/* <header className="p-4 bg-bioson-grayLight">
          <div className="flex items-center gap-4">
            <a href="/">
              <img src={LOGO_SRC} alt="Logo" className="w-36 h-auto" />
            </a>
            <NavBar />
          </div>
        </header> */}
        <main>{children}</main>
      </body>
    </html>
  );
}
