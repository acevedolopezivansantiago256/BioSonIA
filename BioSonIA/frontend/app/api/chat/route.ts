import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, species } = body;

    if (!messages) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 });
    }

    const groq = new Groq({
      apiKey: apiKey,
    });

    const systemPrompt = `Eres BioSonIA AI, un asistente experto en ornitología. 
    El usuario está analizando una grabación donde la especie detectada es "${species || 'Desconocida'}".
    
    Si la especie es "Desconocida", explica brevemente el proceso de análisis.
    Responde siempre en ESPAÑOL. Sé educativo y entusiasta.`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: fullMessages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false, // Set to true if you implement frontend streaming
      stop: null
    });

    return NextResponse.json(chatCompletion);
    
  } catch (error: any) {
    console.error('Groq SDK Error:', error);
    return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
  }
}
