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
    </div>
  );
}
