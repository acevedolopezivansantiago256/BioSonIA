import { NextResponse } from 'next/server';

const buildOfflineReply = (messages: Array<{ role: string; content: string }>, species?: string) => {
  const lastUser = [...(messages || [])].reverse().find((m) => m?.role === 'user' && typeof m?.content === 'string')?.content;
  const s = (species && typeof species === 'string' && species.trim()) ? species.trim() : 'la especie detectada';
  const intro =
    `Hola. Puedo ayudarte con información sobre **${s}**, pero el chatbot en línea no está configurado.\n\n` +
    `Para activarlo, define la variable de entorno **GEMINI_API_KEY** y reinicia el frontend.\n\n`;
  const guidance =
    `Mientras tanto, aquí tienes una guía rápida:\n` +
    `- Qué significa la confianza (%): es un score del modelo (0–1) convertido a porcentaje.\n` +
    `- Umbral (min_confidence): por debajo de ese valor se considera “sin detección confiable”.\n` +
    `- Espectrograma: muestra energía por frecuencia a lo largo del tiempo; ayuda a ver patrones del canto.\n`;
  const echo = lastUser ? `\nTu pregunta fue: "${lastUser}"\n` : '';
  return intro + guidance + echo;
};

const toPrompt = (messages: Array<{ role: string; content: string }>) => {
  return messages
    .filter((m) => m && typeof m.content === 'string' && typeof m.role === 'string')
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, species } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          id: 'offline',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'offline',
          choices: [{ index: 0, message: { role: 'assistant', content: buildOfflineReply(messages, species) }, finish_reason: 'stop' }],
        },
        { status: 200 }
      );
    }

    const configuredModel = (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) ? process.env.GEMINI_MODEL.trim() : 'gemini-2.5-flash';
    const configuredVersion = (process.env.GEMINI_API_VERSION && process.env.GEMINI_API_VERSION.trim()) ? process.env.GEMINI_API_VERSION.trim() : '';
    const apiVersion =
      configuredVersion ||
      (configuredModel.includes('preview') || configuredModel.startsWith('gemini-3') ? 'v1alpha' : 'v1beta');

    const systemPrompt = `Eres BioSonIA AI, un asistente experto en ornitología. 
    El usuario está analizando una grabación donde la especie detectada es "${species || 'Desconocida'}".
    
    Si la especie es "Desconocida", explica brevemente el proceso de análisis.
    Responde siempre en ESPAÑOL. Sé educativo y entusiasta.`;

    const prompt = toPrompt(messages);
    const upstream = await fetch(`https://generativelanguage.googleapis.com/${encodeURIComponent(apiVersion)}/models/${encodeURIComponent(configuredModel)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 1 },
      }),
    });

    const json = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const msg = (json && typeof json === 'object' && (json as any).error?.message) ? (json as any).error.message : 'Error from Gemini API';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const text =
      json && typeof json === 'object'
        ? (json as any).candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n') || ''
        : '';

    return NextResponse.json(
      {
        id: 'gemini',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: configuredModel,
        choices: [{ index: 0, message: { role: 'assistant', content: text || buildOfflineReply(messages, species) }, finish_reason: 'stop' }],
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Chat Error:', error);
    return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
  }
}
