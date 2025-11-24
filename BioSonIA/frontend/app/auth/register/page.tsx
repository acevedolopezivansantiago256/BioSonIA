"use client";
import React, { useState } from "react";
import { api } from "../../../lib/api";
import { useRouter } from "next/navigation";

const LOGO_SRC = process.env.NEXT_PUBLIC_LOGO_PATH || '/logo.png';

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const onSubmit = async () => {
    setError(null);
    try {
      if (!email || !password || !name) {
        setError("Completa nombre, correo y contraseña");
        return;
      }
      if (password !== confirm) {
        setError("Las contraseñas no coinciden");
        return;
      }
      const res = await api.register(email, password);
      if (!res?.ok) {
        setError(res?.message || "No se pudo registrar");
        return;
      }
      const loginRes = await api.login(email, password);
      const token: string | undefined = loginRes?.accessToken;
      if (token) {
        try { localStorage.setItem("token", token); } catch {}
        api.setToken(token);
      }
      router.push("/upload");
    } catch (e: any) {
      setError(e?.message || "Error registrando");
    }
  };
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" style={{ backgroundImage: 'url(/background-orbits.svg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={LOGO_SRC} alt="BioSonIA" className="w-64 h-auto mx-auto" />
        </div>
        <div className="card-lg p-6 space-y-4">
          <h1 className="text-2xl font-semibold text-bioson-grayDark">Crear Cuenta Nueva</h1>
          <div className="space-y-2">
            <label className="block text-sm text-bioson-grayDark">Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-bioson-grayDark">Correo Electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-bioson-grayDark">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-bioson-grayDark">Confirma tu contraseña</label>
            <div className="flex items-center gap-2">
              <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="px-3 py-2 border rounded">{showConfirm ? 'Ocultar' : 'Ver'}</button>
            </div>
          </div>
          {error && <p className="text-bioson-red">{error}</p>}
          <button onClick={onSubmit} className="btn-primary w-full">Registrarse</button>
          <div className="text-center text-sm"><a href="/auth/login" className="text-bioson-blue">¿Ya tienes cuenta? Inicia sesión</a></div>
        </div>
      </div>
    </div>
  );
}