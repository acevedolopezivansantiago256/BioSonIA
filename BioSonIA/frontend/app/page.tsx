'use client';

import React, { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or preference on mount
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 transition-colors duration-300 min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-background-light/80 dark:bg-background-dark/80 glass border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                <span className="material-symbols-rounded text-white">eco</span>
              </div>
              <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BioSonIA
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8 font-medium">
              <a className="hover:text-primary transition-colors" href="/">
                Inicio
              </a>
              <a className="hover:text-primary transition-colors" href="/upload">
                Subir
              </a>
              <a className="hover:text-primary transition-colors" href="/dashboard">
                Dashboard
              </a>
              <a className="hover:text-primary transition-colors" href="/docs">
                Guía
              </a>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={toggleTheme}
                aria-label="Toggle Dark Mode"
              >
                {/* Sol (light mode) - mostrar en dark mode para cambiar a light */}
                <span className={`material-symbols-rounded ${isDark ? 'block' : 'hidden'}`}>light_mode</span>
                {/* Luna (dark mode) - mostrar en light mode para cambiar a dark */}
                <span className={`material-symbols-rounded ${isDark ? 'hidden' : 'block'}`}>dark_mode</span>
              </button>
              <a className="text-sm font-semibold hover:text-primary transition-colors px-4" href="/auth/login">
                Login
              </a>
              <a
                className="bg-primary hover:bg-secondary text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                href="/auth/register"
              >
                Registro
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 hero-pattern -z-10" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34, 197, 94, 0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm">
                <span className="material-symbols-rounded text-[18px]">verified</span>
                <span>IA de última generación para biodiversidad</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold font-display leading-[1.1] tracking-tight text-slate-900 dark:text-white">
                Descubre el canto de las <span className="text-primary italic">aves</span> con IA.
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                BioSonIA utiliza redes neuronales avanzadas para identificar especies de aves a partir de grabaciones de audio. Una herramienta científica poderosa para investigadores y entusiastas de la naturaleza.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-secondary transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95"
                  href="/upload"
                >
                  Comenzar ahora
                  <span className="material-symbols-rounded">arrow_forward</span>
                </a>
                <a
                  className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl font-bold text-lg hover:border-primary dark:hover:border-primary transition-all"
                  href="/upload"
                >
                  Ver Demo
                  <span className="material-symbols-rounded">play_circle</span>
                </a>
              </div>
              <div className="flex items-center gap-6 pt-6 grayscale opacity-60">
                <span className="font-display font-bold text-slate-400">Trusted by researchers at</span>
                <div className="flex gap-8">
                  <span className="font-bold text-lg italic">NatureSoft</span>
                  <span className="font-bold text-lg italic">BioLabs</span>
                </div>
              </div>
            </div>
            
            <div className="relative center-content">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
                <img
                  alt="Hermosa ave en la naturaleza"
                  className="w-full aspect-[4/5] object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUq1pwyFH4Y3c2soHFOz53agFxi3uR_hFNufHlruB1tnDtCiiAtmmb_LpelxIS6ULisrACisefIk8oMQuXFVNCEWE2b4J2IyOJyTCy8zGaqXxmSaJLZ0x6hpkEd6txrE6X9_Zn38g2i9JyxR1k2Ai6S9Ytg3tQltQj1bFHvtj90qTIAqpraw8_SFdODFH6zw-J4WVaAv5gh1332ld29TpR0fFU6Z-nEUEB_sv_0xiqlxhLi_KqMGDR_fvXAA5_qwnnDqrSAnTpC1Y"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-white/10 p-5 rounded-2xl border border-white/20 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-2 rounded-xl">
                      <span className="material-symbols-rounded text-primary">analytics</span>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Último Análisis</p>
                      <p className="text-white font-bold text-lg">Ramphastos vitellinus</p>
                    </div>
                    <div className="ml-auto bg-primary text-white text-sm font-bold px-3 py-1 rounded-lg">
                      86.5%
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/20 rounded-full blur-2xl animate-pulse"></div>
              <div
                className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse"
                style={{ animationDelay: '1s' }}
              ></div>
            </div>
          </div>
        </div>
      </main>

      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm">Características</h2>
            <h3 className="text-4xl font-extrabold font-display text-slate-900 dark:text-white">
              Todo lo que necesitas para el monitoreo acústico
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Nuestra plataforma combina la precisión de la IA con herramientas visuales intuitivas para un análisis profundo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-rounded text-3xl">upload_file</span>
              </div>
              <h4 className="text-xl font-bold mb-3 dark:text-white">Carga Instantánea</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Sube tus archivos de audio en cualquier formato (MP3, WAV, FLAC) y obtén resultados en segundos.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-rounded text-3xl">equalizer</span>
              </div>
              <h4 className="text-xl font-bold mb-3 dark:text-white">Visualización Detallada</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Analiza espectrogramas y formas de onda con herramientas de procesamiento que eliminan el ruido ambiental.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-rounded text-3xl">monitoring</span>
              </div>
              <h4 className="text-xl font-bold mb-3 dark:text-white">Métricas en Tiempo Real</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Dashboard interactivo para seguir la evolución de tus detecciones y precisión de los modelos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-[3rem] p-12 lg:p-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 grid md:grid-cols-3 gap-12 text-center text-white">
              <div className="space-y-2">
                <p className="text-5xl font-extrabold font-display">1,200+</p>
                <p className="text-primary-foreground/80 font-medium">Especies Identificadas</p>
              </div>
              <div className="space-y-2">
                <p className="text-5xl font-extrabold font-display">95.4%</p>
                <p className="text-primary-foreground/80 font-medium">Precisión Promedio</p>
              </div>
              <div className="space-y-2">
                <p className="text-5xl font-extrabold font-display">50k+</p>
                <p className="text-primary-foreground/80 font-medium">Audios Analizados</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-50 dark:bg-slate-900 pt-20 pb-10 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-lg">
                  <span className="material-symbols-rounded text-white text-sm">eco</span>
                </div>
                <span className="text-xl font-extrabold font-display dark:text-white">BioSonIA</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                Plataforma inteligente para la conservación de la biodiversidad mediante el análisis bioacústico impulsado por inteligencia artificial.
              </p>
              <div className="flex gap-4">
                <a
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                  href="#"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
                  </svg>
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                  href="#"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.819-.26.819-.578 0-.284-.01-1.04-.017-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h5 className="font-bold mb-6 dark:text-white">Plataforma</h5>
              <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Subir Audio
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Documentación
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 dark:text-white">Compañía</h5>
              <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Sobre nosotros
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Impacto ambiental
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Términos
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">© 2024 BioSonIA. Todos los derechos reservados.</p>
            <div className="flex gap-6 text-sm text-slate-400">
              <a className="hover:text-slate-600 dark:hover:text-slate-200" href="#">
                Español (ES)
              </a>
              <a className="hover:text-slate-600 dark:hover:text-slate-200" href="#">
                English (US)
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
