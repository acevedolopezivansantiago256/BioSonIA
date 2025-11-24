"use client";
import React, { useState } from "react";
import { api } from "../../../lib/api";

const LOGO_SRC = process.env.NEXT_PUBLIC_LOGO_PATH || '/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onSubmit = async () => {
    setError(null);
    try {
      const res = await api.login(email, password);
      if (!res?.ok) {
        setError(res?.message || "Credenciales inválidas");
        return;
      }
      const token: string | undefined = res.accessToken;
      if (token) {
        try { localStorage.setItem("token", token); } catch {}
        api.setToken(token);
      }
      setOk(true);
    } catch (e: any) {
      setError(e?.message || "Error iniciando sesión");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" style={{ backgroundImage: 'url(/background-waves.svg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img src={LOGO_SRC} alt="BioSonIA" className="w-64 h-auto mx-auto" />
        </div>
        <div className="card p-6 space-y-4">
          <h1 className="text-2xl font-semibold text-bioson-grayDark">Iniciar Sesión</h1>
          <div className="space-y-2">
            <label className="block text-sm text-bioson-grayDark">Correo Electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-bioson-grayDark">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
          </div>
          <div className="flex justify-end">
            <a href="#" className="text-sm text-bioson-blue">¿Olvidaste tu contraseña?</a>
          </div>
          {error && <p className="text-bioson-red">{error}</p>}
          <button onClick={onSubmit} className="btn-primary w-full">Iniciar Sesión</button>
          {ok && <div className="text-bioson-green">Sesión iniciada. Ahora puedes subir audios.</div>}
        </div>
        <p className="text-center text-sm text-bioson-grayDark">¿No tienes una cuenta? <a href="#" className="text-bioson-blue">Regístrate</a></p>
        <p className="text-center text-xs text-gray-500">Modo demostración sin BD: cualquier email/contraseña funciona.</p>
      </div>
    </div>
  );
}