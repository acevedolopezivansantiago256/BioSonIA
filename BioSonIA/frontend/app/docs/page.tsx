"use client";
import React from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-bioson-grayDark">{title}</h2>
      <div className="text-sm leading-6 text-bioson-grayDark">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  const onPrint = () => window.print();
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 print:p-0">
      <style>{`
        @media print {
          header { display: none !important; }
          nav { display: none !important; }
          body { background: #ffffff !important; }
          .btn-primary { display: none !important; }
          .print\:p-0 { padding: 0 !important; }
        }
      `}</style>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guía BioSonIA (Frontend, Backend, IA)</h1>
        <button className="btn-primary" onClick={onPrint}>Descargar PDF</button>
      </div>

      <Section title="Arquitectura">
        <ul className="list-disc ml-6">
          <li>Monorepo con <code>frontend</code>, <code>backend</code> y <code>ai</code>.</li>
          <li>Frontend: Next.js 14 con directorio <code>app</code>.</li>
          <li>Backend: NestJS con JWT y Prisma opcional.</li>
          <li>IA: FastAPI en Python para análisis y generación de imágenes.</li>
        </ul>
      </Section>

      <Section title="Frontend">
        <ul className="list-disc ml-6">
          <li>Páginas: <code>app/page.tsx</code>, <code>app/upload/page.tsx</code>, <code>app/results/[id]/page.tsx</code>, <code>app/auth/login/page.tsx</code>, <code>app/auth/register/page.tsx</code>.</li>
          <li>Layout global con logo y navbar: <code>BioSonIA2.0/BioSonIA/frontend/app/layout.tsx:9-21</code>.</li>
          <li>Cliente HTTP con token: <code>BioSonIA2.0/BioSonIA/frontend/lib/api.ts:5-13,18-47</code>.</li>
          <li>Paleta Tailwind: <code>BioSonIA2.0/BioSonIA/frontend/tailwind.config.js:7-10</code>.</li>
          <li>Utilidades de UI: <code>BioSonIA2.0/BioSonIA/frontend/app/globals.css:13-23</code>.</li>
          <li>Logo configurable: usa <code>NEXT_PUBLIC_LOGO_PATH</code> o <code>/public/logo.png</code>.</li>
        </ul>
      </Section>

      <Section title="Backend">
        <ul className="list-disc ml-6">
          <li>Inicio: <code>BioSonIA2.0/BioSonIA/backend/src/main.ts:1-33</code>.</li>
          <li>Auth: controlador <code>backend/src/auth/auth.controller.ts</code> y servicio <code>backend/src/auth/auth.service.ts:24-39</code>.</li>
          <li>Subida y análisis: <code>backend/src/upload/upload.controller.ts:19-33</code> y <code>backend/src/analysis/analysis.service.ts:20-47</code>.</li>
          <li>Resultados: <code>GET /results/:id</code> y <code>GET /history</code>.</li>
          <li>Modo demo sin BD: <code>DISABLE_DB=true</code>.</li>
        </ul>
      </Section>

      <Section title="IA (FastAPI)">
        <ul className="list-disc ml-6">
          <li>Endpoint: <code>POST /analyze</code> en <code>BioSonIA2.0/BioSonIA/ai/server.py:47-55,116-118</code>.</li>
          <li>Procesamiento y gráficos: <code>BioSonIA2.0/BioSonIA/ai/utils/audio_processing.py:96-126</code>.</li>
          <li>Devuelve: predicciones, espectrogramas y señal limpio/ruidoso en base64.</li>
        </ul>
      </Section>

      <Section title="Flujos">
        <ul className="list-disc ml-6">
          <li>Login/Registro → recibe tokens JWT, se guardan en <code>localStorage</code> y <code>api.token</code>.</li>
          <li>Subir audio → backend guarda y llama a IA → frontend muestra resultados en <code>results/[id]</code>.</li>
        </ul>
      </Section>

      <Section title="Cambios rápidos">
        <ul className="list-disc ml-6">
          <li>Logo: pon tu archivo en <code>frontend/public/logo.png</code> o define <code>NEXT_PUBLIC_LOGO_PATH</code>.</li>
          <li>Colores: edita <code>tailwind.config.js</code> y reinicia el frontend.</li>
          <li>Botones: ajusta <code>.btn-primary</code> en <code>globals.css</code>.</li>
        </ul>
      </Section>

      <Section title="Comandos de ejecución local">
        <ul className="list-disc ml-6">
          <li>Frontend: <code>npm run dev</code> en <code>/frontend</code> → <code>http://localhost:3000</code>.</li>
          <li>Backend: <code>$env:DISABLE_DB="true"; npm run dev</code> en <code>/backend</code> → <code>http://localhost:5000</code>.</li>
          <li>IA: <code>python server.py</code> en <code>/ai</code> → <code>http://localhost:5001</code>.</li>
        </ul>
      </Section>

      <Section title="Guía de uso de BioSonIA">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <div className="font-semibold">Regístrate</div>
                <div className="text-sm text-bioson-grayDark">Crea tu cuenta</div>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <span className="text-2xl">🔑</span>
              <div>
                <div className="font-semibold">Inicia sesión</div>
                <div className="text-sm text-bioson-grayDark">Accede con tus credenciales</div>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <span className="text-2xl">⬆️</span>
              <div>
                <div className="font-semibold">Sube un audio</div>
                <div className="text-sm text-bioson-grayDark">Carga .wav o .mp3</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="font-semibold">Espera el análisis</div>
                <div className="text-sm text-bioson-grayDark">Procesamos tu audio</div>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-semibold">Revisa tu Dashboard</div>
                <div className="text-sm text-bioson-grayDark">Consulta métricas y resultados</div>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <div>
                <div className="font-semibold">Explora resultados</div>
                <div className="text-sm text-bioson-grayDark">Visualiza espectrogramas y detecciones</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Propuesta de Investigación (SENA)">
        <div className="space-y-4">
          <div>
            <strong>Título:</strong> Sistema de reconocimiento de especies de aves mediante análisis de audio y visualización asistida por IA en entorno web
          </div>
          <div>
            <strong>Introducción:</strong> La bioacústica permite monitorear biodiversidad a partir de cantos. Se integra un frontend (Next.js), un backend (NestJS) y un servicio de IA (FastAPI) para analizar audios WAV/MP3 y mostrar resultados con espectrogramas y detecciones.
          </div>
          <div>
            <strong>Planteamiento del problema y justificación:</strong> La identificación manual requiere expertos y tiempo. La plataforma reduce barreras tecnológicas, facilita educación ambiental y monitoreo comunitario, y demuestra arquitectura moderna reproducible.
          </div>
          <div>
            <strong>Objetivos:</strong>
            <ul className="list-disc ml-6">
              <li>General: Implementar un sistema web que reconozca especies de aves por su canto con IA.</li>
              <li>Específicos: Autenticación JWT; orquestación backend-IA; procesamiento de audio y espectrogramas; UI de subida y resultados; evaluación de precisión y tiempos; persistencia opcional con Prisma.</li>
            </ul>
          </div>
          <div>
            <strong>Referente teórico:</strong>
            <ul className="list-disc ml-6">
              <li>Procesamiento de señal: mono 48 kHz, espectrogramas, waveform.</li>
              <li>Clasificación: modelo preentrenado (BirdNET) y top-N con umbral.</li>
              <li>Arquitectura: App Router, NestJS, FastAPI, CORS y FormData.</li>
              <li>Seguridad: JWT y separación de capas.</li>
            </ul>
          </div>
          <div>
            <strong>Metodología:</strong>
            <ul className="list-disc ml-6">
              <li>Tipo: investigación aplicada y desarrollo experimental.</li>
              <li>Diseño: cliente-servidor; pipeline de audio e inferencia.</li>
              <li>Población-muestra: audios de cantos en WAV/MP3.</li>
              <li>Técnicas: captura de audios, dataset de prueba, metadatos opcionales.</li>
              <li>Evaluación: precisión top-1/top-3, tiempos de respuesta y robustez.</li>
            </ul>
          </div>
          <div>
            <strong>Resultados:</strong> Plataforma funcional con espectrogramas y top3; soporte MP3/WAV y scripts de arranque; historial persistente opcional y evaluación básica de precisión.
          </div>
          <div>
            <strong>Conclusiones:</strong> Integración web + procesamiento de señal posibilita identificación útil para educación y monitoreo; arquitectura modular facilita mantenimiento y expansión.
          </div>
          <div>
            <strong>Bibliografía (5):</strong>
            <ul className="list-disc ml-6">
              <li>BirdNET (Cornell Lab of Ornithology).</li>
              <li>FastAPI Documentation.</li>
              <li>NestJS Documentation.</li>
              <li>Next.js Documentation.</li>
              <li>FFmpeg Documentation.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Mapa Conceptual (Referencia Teórica)">
        <div className="space-y-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <ul className="space-y-2">
              <li><strong>Bioacústica</strong> → captura de cantos</li>
              <li><strong>Procesamiento de audio</strong> → decodificación MP3/WAV → resampleo a 48 kHz → normalización</li>
              <li><strong>Representaciones</strong> → espectrogramas + waveform</li>
              <li><strong>Modelo IA (BirdNET)</strong> → inferencia → probabilidades por especie</li>
              <li><strong>Selección</strong> → top-N con umbral de confianza</li>
              <li><strong>Backend</strong> → orquesta flujo, guarda resultados</li>
              <li><strong>Frontend</strong> → visualización tipo holograma, UI de resultados</li>
              <li><strong>Usuario/Investigación</strong> → interpretación y toma de decisiones</li>
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}
