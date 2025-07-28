import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Sidebar from "./components/Sidebar";
import AssetList from "./components/AssetList";
import Login from "./components/Login";
import Topbar from "./components/Topbar";
import FichaActivo from "./components/FichaActivo";
import CategoriasConfig from "./components/CategoriasConfig";

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
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/activos" />} />
        <Route
          path="/activos"
          element={
            <div className="flex bg-gray-100 min-h-screen">
              <Sidebar onCategoriasClick={() => setIsCategoriasModalOpen(true)} />
              <div className="flex-1 bg-gray-100 p-6 overflow-auto">
                <Topbar />
                <AssetList />
              </div>
            </div>
          }
        />
        <Route path="/activos/:id" element={<FichaActivo />} />
      </Routes>
      
      <CategoriasConfig 
        isOpen={isCategoriasModalOpen} 
        onClose={() => setIsCategoriasModalOpen(false)} 
      />
    </Router>
  );
}

export default App;
