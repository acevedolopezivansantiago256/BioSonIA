'use client';

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../lib/api";

export const dynamic = 'force-dynamic';

export default function AuthPage({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams?.get('mode');
  
  const [isLogin, setIsLogin] = useState(initialMode === 'login' && modeParam !== 'register');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(loginEmail, loginPassword);
      if (!res?.ok) {
        throw new Error(res?.message || "Credenciales inválidas");
      }
      const token = res.accessToken;
      if (token) {
        try { localStorage.setItem("token", token); } catch {}
        api.setToken(token);
        router.push("/upload");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!regEmail || !regPassword || !regName) {
        throw new Error("Todos los campos son obligatorios");
      }
      // Register
      const resReg = await api.register(regEmail, regPassword);
      if (!resReg?.ok) {
         throw new Error(resReg?.message || "Error al registrarse");
      }
      
      // Auto Login after register
      const resLogin = await api.login(regEmail, regPassword);
      const token = resLogin?.accessToken;
      if (token) {
        try { localStorage.setItem("token", token); } catch {}
        api.setToken(token);
        router.push("/upload");
      } else {
        setIsLogin(true); // Switch to login if auto-login fails for some reason
        setError("Cuenta creada. Por favor inicia sesión.");
      }
    } catch (err: any) {
      setError(err.message || "Error en el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark transition-colors duration-300 min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary items-center justify-center p-12">
        <img 
          alt="Hermosa ave en la naturaleza" 
          className="absolute inset-0 object-cover w-full h-full opacity-60 mix-blend-multiply" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuOJHyUHMD96FCperERUl93M59YtzUnoWSCtHFSZiw1xOS4uY8GsJ1sK9J1nRlIe1ks1LHDr2_0EpfjRG0nj4aIauYKq8n2mNwnaoCpCBiWXN3WtxTZObcGDieiSaWtRA8p2hEUHFMQhQw7xKk82B3TkOjvSum9WrJKTJ7ehvnck2wPWlI9TQQeu8L4wwLvGoSJWlftwIx_kPTK-9eapsZaCGlYNlQuTbLgZirFxzBeMEiAHZ8Nx79pzmq8KiAHi0dKqTEJ_OGsEo" 
        />
        <div className="relative z-10 max-w-lg text-white">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="BioSonIA" className="h-32 w-auto bg-white/20 p-2 rounded-xl backdrop-blur-sm" />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">Identifica la Voz de la Naturaleza con IA.</h1>
          <p className="text-xl text-emerald-50 mb-10 leading-relaxed">
            Nuestras redes neuronales avanzadas analizan las vocalizaciones de aves para ayudar a investigadores y entusiastas a monitorear la biodiversidad en tiempo real.
          </p>
          <div className="backdrop-blur-md bg-white/10 border border-white/20 p-6 rounded-2xl">
            <p className="italic text-emerald-50 mb-4">"BioSonIA ha revolucionado la forma en que realizamos estudios de campo, haciendo que la identificación de especies sea más rápida y precisa que nunca."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-400"></div>
              <div>
                <p className="font-semibold text-sm">Dra. Elena Rodriguez</p>
                <p className="text-xs text-emerald-200 uppercase tracking-wider">Ornitóloga e Investigadora</p>
              </div>
            </div>
          </div>
        </div>
        <button 
          className="absolute top-8 right-8 p-2 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors" 
          onClick={toggleDarkMode}
        >
          <span className="material-symbols-rounded dark:hidden">dark_mode</span>
          <span className="material-symbols-rounded hidden dark:block">light_mode</span>
        </button>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 lg:px-24 bg-background-light dark:bg-background-dark">
        <div className="lg:hidden flex items-center gap-2 mb-12">
          <span className="material-symbols-rounded text-primary text-4xl">waves</span>
          <span className="text-2xl font-bold dark:text-white">BioSonIA</span>
        </div>
        
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isLogin ? 'Bienvenido de nuevo' : 'Crear una cuenta'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? 'Ingresa tus datos para iniciar sesión' : 'Únete a BioSonIA y comienza a identificar cantos de aves'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-white text-sm font-medium">
              <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDo3UOPjnTKD5jVvMWRpJFJyXZ3EE-hIaas1MsxCGRRoBKZ6v3aGxFMgpiyLbR54Ps1yARdUIzA9ufyCESU_D3suHoLBTiNy-ITvInbVSdZWcJiZjIBqI8dxRQDKI-qbJxLh6BKThGj_Hx83HNtYVCxBI9twkecfO5i5VSA0mZyEDlcUCMKsR2fhCYcGMCzGCdxQUKNFdCvR12IK30sz7eijjxuj9xrStn_Rs3raA1_TuuSZ9UNqwpPcrmGsH29RGPLTZQAoN4WSmA"/>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-white text-sm font-medium">
              <img alt="Facebook" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2SdF9Lt6WlnO3Vmua3BD1Md4sMI3COCF7l35hx_jf00xKYx9bQ0io8BOqmqYthwB8fcoF2sYcm4cj11kGbZp0B08SD6tuK_c2mAbAE_Hn6H-yYGKSl880arYTMmy_MyNdHEXklmv765m6CnkMvY_FoMXTT23lHQVwaTnvhvG3kn-MAxPe6Er0X6cCWSZlwQ-NS7u8x9lWXCNIPXw5Hr00dC6yki0Ne-8oxq_ezDXB4YdDrutYqayOAcdwbDDiymTv8TPzdTmQ8dI"/>
              Facebook
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
            <div className="relative flex justify-center text-sm uppercase"><span className="px-2 bg-background-light dark:bg-background-dark text-gray-500 dark:text-gray-400">O continúa con</span></div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">Correo electrónico</label>
                <input 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                  id="email" 
                  type="email" 
                  placeholder="Ingresa tu correo" 
                  required 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">Contraseña</label>
                  <a className="text-sm font-medium text-primary hover:text-emerald-600 transition-colors" href="#">¿Olvidaste tu contraseña?</a>
                </div>
                <input 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <input className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800" id="remember-me" type="checkbox"/>
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300" htmlFor="remember-me">Recordar por 30 días</label>
              </div>
              <button 
                disabled={loading}
                className={`w-full py-3 px-4 bg-primary hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-emerald-200 dark:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${loading ? 'opacity-70 cursor-wait' : ''}`} 
                type="submit"
              >
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            <form onSubmit={onRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="reg-name">Nombre completo</label>
                <input 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  id="reg-name" 
                  type="text" 
                  placeholder="Juan Pérez" 
                  required 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="reg-email">Correo electrónico</label>
                <input 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  id="reg-email" 
                  type="email" 
                  placeholder="juan@ejemplo.com" 
                  required 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="reg-password">Contraseña</label>
                <input 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  id="reg-password" 
                  type="password" 
                  placeholder="Mín. 8 caracteres" 
                  required 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
              <button 
                disabled={loading}
                className={`w-full py-3 px-4 bg-primary hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-emerald-200 dark:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${loading ? 'opacity-70 cursor-wait' : ''}`} 
                type="submit"
              >
                {loading ? 'Creando Cuenta...' : 'Crear Cuenta'}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <span>{isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}</span>
            <button 
              className="ml-1 font-semibold text-primary hover:text-emerald-600 transition-colors focus:outline-none" 
              onClick={toggleAuthMode}
            >
              {isLogin ? "Regístrate gratis" : "Iniciar sesión"}
            </button>
          </p>

          <div className="mt-12 flex justify-center gap-6 text-xs text-gray-500 dark:text-gray-500">
            <a className="hover:text-primary transition-colors" href="#">Política de Privacidad</a>
            <a className="hover:text-primary transition-colors" href="#">Términos de Servicio</a>
            <a className="hover:text-primary transition-colors" href="#">Contactar Soporte</a>
          </div>
        </div>

        <button 
          className="lg:hidden absolute top-8 right-8 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm" 
          onClick={toggleDarkMode}
        >
          <span className="material-symbols-rounded dark:hidden">dark_mode</span>
          <span className="material-symbols-rounded hidden dark:block">light_mode</span>
        </button>
      </div>
    </div>
  );
}
