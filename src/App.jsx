import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Layout from "./components/Layout";
import Home from "./components/Home";
import AssetList from "./components/AssetList";
import Login from "./components/Login";
import Registro from "./components/Registro";
import FichaActivo from "./components/FichaActivo";
import CategoriasConfig from "./components/CategoriasConfig";
import ScanPage from './components/ScanPage';
import Configuracion from './components/Configuracion';
import { Toaster } from 'react-hot-toast';
  
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

  if (!session) {
    return (
      <Router>
        <Routes>
          <Route path="/registro" element={<Registro />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout onCategoriasClick={() => setIsCategoriasModalOpen(true)}>
            <Home />
          </Layout>
        } />
        <Route
          path="/activos"
          element={
            <Layout onCategoriasClick={() => setIsCategoriasModalOpen(true)}>
              <AssetList />
            </Layout>
          }
        />
        <Route path="/activos/:id" element={<FichaActivo />} /> 
        <Route path="/escanear" element={<ScanPage />} />
        <Route path="/configuracion" element={<Configuracion />} />
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
