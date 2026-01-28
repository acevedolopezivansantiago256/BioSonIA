'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BirdChatProps {
  speciesName: string;
}

export default function BirdChat({ speciesName }: BirdChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen || initialized.current || !speciesName) return;
    initialized.current = true;

    const fetchInitialInfo = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: `Dame un resumen introductorio breve pero interesante sobre el ${speciesName}. Menciona su hábitat y dieta principal. Saluda al usuario primero.` }],
            species: speciesName
          }),
        });
        const data = await res.json();
        
        if (!res.ok) {
           throw new Error(data.error || 'Failed to fetch response');
        }

        if (data.choices?.[0]?.message) {
           setMessages([{ role: 'assistant', content: data.choices[0].message.content }]);
        } else {
           throw new Error('Invalid response');
        }
      } catch (err) {
         setMessages([{ role: 'assistant', content: `¡Hola! He detectado un **${speciesName}**. ¿En qué puedo ayudarte?` }]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialInfo();
  }, [speciesName, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          species: speciesName
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      if (data.choices && data.choices[0]?.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message || 'Could not connect to AI service.'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end print:hidden">
      
      {/* Chat Window */}
      <div 
        className={`
          mb-4 w-[90vw] md:w-[400px] h-[600px] max-h-[70vh] 
          bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 
          flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none absolute bottom-0 right-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="material-symbols-rounded text-white text-sm">smart_toy</span>
              </div>
              <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">BioSonIA Assistant</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Powered by Groq AI</p>
              </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
             <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50"
        >
          {messages.length === 0 && loading && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                 <span className="material-symbols-rounded animate-spin text-3xl opacity-50">sync</span>
                 <p className="text-xs font-semibold animate-pulse">Consultando base de conocimientos...</p>
             </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-primary text-white rounded-br-sm' 
                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm'
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                   {m.content.split('\n').map((line, idx) => <p key={idx} className="mb-1 last:mb-0">{line}</p>)}
                </div>
              </div>
            </div>
          ))}
          {messages.length > 0 && loading && (
            <div className="flex justify-start">
               <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm p-3 shadow-sm flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
               </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta sobre esta ave..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
              />
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="p-3 bg-primary hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-rounded">send</span>
              </button>
          </div>
        </form>
      </div>

      {/* Floating Button */}
      <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`
            w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
            ${isOpen ? 'bg-slate-700 text-white rotate-90' : 'bg-primary text-white hover:bg-emerald-600'}
         `}
      >
         <span className="material-symbols-rounded text-3xl">
            {isOpen ? 'close' : 'smart_toy'}
         </span>
      </button>

    </div>
  );
}
