import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Layout from "./components/Layout";
import PublicLayout from "./components/PublicLayout";
import Home from "./components/Home";
import AssetList from "./components/AssetList";
import Login from "./components/Login";
import Registro from "./components/Registro";
import FichaActivo from "./components/FichaActivo";
import PublicAssetView from "./components/PublicAssetView";
import CategoriasConfig from './components/CategoriasConfig';
import ScanPage from './components/ScanPage';
import Configuracion from './components/Configuracion';
import Auditorias from './components/Auditorias';
import { Toaster } from 'react-hot-toast';
import Mantenimiento from './components/Mantenimiento';
  
function App() {
  const [session, setSession] = useState(null);
  const [isCategoriasModalOpen, setIsCategoriasModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Rutas públicas (sin autenticación) */}
        <Route path="/activos/:id" element={
          <PublicLayout>
            <PublicAssetView />
          </PublicLayout>
        } />
        
        {/* Rutas administrativas (requieren autenticación) */}
        {!session ? (
          <>
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={
              <Layout onCategoriasClick={() => setIsCategoriasModalOpen(true)}>
                <Home />
              </Layout>
            } />
            <Route path="/admin/activos" element={
              <Layout onCategoriasClick={() => setIsCategoriasModalOpen(true)}>
                <AssetList />
              </Layout>
            } />
            <Route path="/admin/activos/:id" element={<FichaActivo />} />
            <Route path="/admin/escanear" element={<ScanPage />} />
            <Route path="/admin/configuracion" element={<Configuracion />} />
            <Route path="/admin/auditorias" element={<Auditorias />} />
            <Route path="/admin/mantenimiento" element={
              <Layout onCategoriasClick={() => setIsCategoriasModalOpen(true)}>
                <Mantenimiento />
              </Layout>
            } />
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </>
        )}
      </Routes>
      <Toaster position="top-right" />  
      <CategoriasConfig 
        isOpen={isCategoriasModalOpen} 
        onClose={() => setIsCategoriasModalOpen(false)} 
      />
    </Router>
  );
}

export default App;
