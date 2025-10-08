import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import logo from "../assets/logo_inventario_app.png";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (cooldown > 0) return;
    setLoading(true);

    const normalizedEmail = (formData.email || "").trim().toLowerCase();
    
    // Log muy visible para confirmar que se ejecuta
    console.log('🚀 INICIANDO LOGIN - CÓDIGO ACTUALIZADO', { email: normalizedEmail, timestamp: new Date().toISOString() });
    // Precheck anti fuerza bruta
    try {
      console.log('🛡️ Enviando precheck de rate limiting...', { email: normalizedEmail });
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/login-precheck`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email: normalizedEmail })
      });
      
      console.log('📊 Precheck response:', { status: res.status });
      
      if (res.status === 429) {
        const j = await res.json();
        const wait = Number(j?.retryAfterSeconds || 60);
        console.log('🚫 Rate limiting activado!', { wait, response: j });
        setCooldown(wait);
        const timer = setInterval(() => setCooldown((s) => { if (s <= 1) { clearInterval(timer); return 0; } return s - 1; }), 1000);
        setLoading(false);
        setError(`Demasiados intentos. Inténtalo en ${wait} segundos.`);
        return;
      } else if (res.status === 200) {
        const data = await res.json();
        console.log('✅ Precheck permitido:', data);
      } else {
        console.warn('⚠️ Precheck status inesperado:', res.status);
      }
    } catch (err) {
      console.warn('💥 Error en precheck:', err);
    }

    console.log('🔐 Intentando login con Supabase...', { email: normalizedEmail });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: formData.password,
    });

    if (error) {
      console.error("❌ Login error:", error);
      console.error("📊 Error details:", {
        message: error.message,
        status: error.status,
        code: error.code
      });
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
    } else {
      console.log("✅ Login exitoso:", data);
      // Redirigir manualmente a la vista principal administrativa
      window.location.href = "/admin/dashboard";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <div className="flex flex-col items-center">
          <img src={logo} alt="Logo" className="w-32 h-32 mb-2" />
          <h2 className="text-2xl font-bold mb-4">Iniciar sesión</h2>
        </div>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin}>
          <label className="block mb-2 text-sm font-medium">Correo electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
            required
            autoComplete="username"
          />

          <label className="block mb-2 text-sm font-medium">Contraseña</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6"
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {cooldown > 0 ? `Espera ${cooldown}s` : (loading ? 'Entrando...' : 'Entrar')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
