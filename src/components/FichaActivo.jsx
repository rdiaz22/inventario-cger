// src/pages/FichaActivo.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FichaActivo = () => {
  const { id } = useParams();
  const [activo, setActivo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivo = async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error al cargar activo", error);
      } else {
        setActivo(data);
      }
      setLoading(false);
    };

    fetchActivo();
  }, [id]);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!activo) return <div className="p-6 text-red-500">Activo no encontrado.</div>;

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Ficha del Activo</h1>
      <div className="bg-gray-100 rounded-xl shadow-md w-full max-w-xl p-4">
        <img
          src={activo.image_url}
          alt="Imagen del activo"
          className="w-full h-64 object-contain rounded mb-4"
        />
        <div className="text-gray-700 space-y-2">
          <p><strong>Nombre:</strong> {activo.name}</p>
          <p><strong>Descripción:</strong> {activo.details}</p>
          <p><strong>Ubicación:</strong> {activo.location}</p>
          <p><strong>Categoría:</strong> {activo.category}</p>
          <p><strong>Estado:</strong> {activo.status}</p>
          <p><strong>Código:</strong> {activo.codigo}</p>
          <p><strong>Propiedad:</strong> CGER, La Palma</p>
        </div>
      </div>
    </div>
  );
};

export default FichaActivo;
