"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    try {
      setToken(localStorage.getItem("token"));
    } catch {}
  }, []);
  const logout = () => {
    try {
      localStorage.removeItem("token");
    } catch {}
    setToken(null);
    router.push("/auth/login");
  };
  return (
    <div className="flex items-center gap-4">
      <nav className="flex gap-4 text-bioson-grayDark items-center">
        <a href="/" className="hover:text-bioson-blue">Inicio</a>
        <a href="/upload" className="hover:text-bioson-blue">Subir</a>
        <a href="/dashboard" className="hover:text-bioson-blue">Dashboard</a>
        <a href="/docs" className="hover:text-bioson-blue">Guía</a>
        {!token ? (
          <>
            <a href="/auth/login" className="btn-primary">Login</a>
            <a href="/auth/register" className="btn-primary">Registro</a>
          </>
        ) : (
          <button onClick={logout} className="btn-primary">Cerrar sesión</button>
        )}
      </nav>
    </div>
  );
}