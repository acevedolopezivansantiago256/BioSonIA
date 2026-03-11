'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BirdChatProps {
  speciesName: string;
}

type ChatSession = {
  id: string;
  speciesName: string;
  updatedAt: number;
  messages: Message[];
};

const STORAGE_KEY = 'biosonia_chat_sessions_v1';
const MAX_SESSIONS = 20;

const safeParseSessions = (raw: string | null): ChatSession[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s: any) => s && typeof s.id === 'string' && typeof s.speciesName === 'string' && typeof s.updatedAt === 'number' && Array.isArray(s.messages))
      .map((s: any) => ({
        id: s.id,
        speciesName: s.speciesName,
        updatedAt: s.updatedAt,
        messages: s.messages
          .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .map((m: any) => ({ role: m.role, content: m.content })),
      }));
  } catch {
    return [];
  }
};

const newId = () => {
  const c: any = globalThis as any;
  if (c?.crypto?.randomUUID) return c.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function BirdChat({ speciesName }: BirdChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);
  const lastPrefillSessionId = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const raw = localStorage.getItem(STORAGE_KEY);
    const loaded = safeParseSessions(raw).sort((a, b) => b.updatedAt - a.updatedAt);
    setSessions(loaded.slice(0, MAX_SESSIONS));
  }, [speciesName, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!speciesName) return;
    if (activeSessionId) return;

    const existing = sessions
      .filter((s) => s.speciesName === speciesName)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];

    if (existing) {
      setActiveSessionId(existing.id);
      setMessages(existing.messages);
      return;
    }

    const id = newId();
    const next: ChatSession = { id, speciesName, updatedAt: Date.now(), messages: [] };
    const nextSessions = [next, ...sessions].slice(0, MAX_SESSIONS);
    setSessions(nextSessions);
    setActiveSessionId(id);
    setMessages([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  }, [activeSessionId, isOpen, sessions, speciesName]);

  useEffect(() => {
    if (!activeSessionId) return;
    const nextSessions = sessions
      .map((s) => (s.id === activeSessionId ? { ...s, messages, updatedAt: Date.now() } : s))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSIONS);
    setSessions(nextSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  }, [activeSessionId, messages]);

  useEffect(() => {
    if (!isOpen || !speciesName || !activeSessionId) return;
    if (loading) return;
    if (messages.length > 0) return;
    if (lastPrefillSessionId.current === activeSessionId) return;
    lastPrefillSessionId.current = activeSessionId;

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
  }, [activeSessionId, isOpen, messages.length, speciesName, loading]);

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

  const startNewChat = () => {
    if (!speciesName) return;
    const id = newId();
    const next: ChatSession = { id, speciesName, updatedAt: Date.now(), messages: [] };
    const nextSessions = [next, ...sessions].slice(0, MAX_SESSIONS);
    setSessions(nextSessions);
    setActiveSessionId(id);
    setMessages([]);
    setShowHistory(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  };

  const loadChat = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    setActiveSessionId(s.id);
    setMessages(s.messages);
    setShowHistory(false);
  };

  const deleteChat = (id: string) => {
    const nextSessions = sessions.filter((s) => s.id !== id);
    setSessions(nextSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
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
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Powered by Gemini</p>
              </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              aria-label="Historial"
            >
              <span className="material-symbols-rounded">history</span>
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
               <span className="material-symbols-rounded">close</span>
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Historial</div>
              <button
                type="button"
                onClick={startNewChat}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Nuevo chat
              </button>
            </div>

            <div className="mt-2 max-h-40 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400 py-2">Aún no hay chats guardados.</div>
              ) : (
                <div className="space-y-1">
                  {sessions
                    .slice()
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between gap-2 rounded-lg px-2 py-2 ${
                          s.id === activeSessionId ? 'bg-primary/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => loadChat(s.id)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {s.speciesName || 'Desconocida'}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(s.updatedAt).toLocaleString()}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteChat(s.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          aria-label="Eliminar chat"
                        >
                          <span className="material-symbols-rounded text-base">delete</span>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

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
