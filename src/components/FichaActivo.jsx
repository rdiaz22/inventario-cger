// src/pages/FichaActivo.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import QRCode from "react-qr-code";

const FichaActivo = () => {
  const { id } = useParams();
  const [activo, setActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarEtiqueta, setMostrarEtiqueta] = useState(false);

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

  const imprimirEtiqueta = () => {
    setMostrarEtiqueta(true);
    setTimeout(() => {
      window.print();
      setMostrarEtiqueta(false);
    }, 300);
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!activo) return <div className="p-6 text-red-500">Activo no encontrado.</div>;

  const etiqueta = (
    <div className="p-4 bg-white w-[250px] h-[200px] border border-black rounded text-center">
      <div className="flex justify-center mb-2">
        <QRCode value={`${window.location.origin}/activos/${activo.id}`} size={80} />
      </div>
      <p className="text-xs font-bold mt-2">{activo.codigo}</p>
      <p className="text-[10px] mt-1">Propiedad de CGER, La Palma</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center">
      {!mostrarEtiqueta && (
        <>
          <h1 className="text-2xl font-bold mb-4">Ficha del Activo</h1>
          <div className="bg-gray-100 rounded-xl shadow-md w-full max-w-xl p-4">
            <img
              src={activo.image_url}
              alt="Imagen del activo"
              className="w-full h-1/2 object-contain rounded mb-4"
            />
            <div className="text-gray-700 space-y-2 text-lg">
              <p><strong>Nombre:</strong> {activo.name}</p>
              <p><strong>Marca:</strong> {activo.brand}</p>
              <p><strong>Modelo:</strong> {activo.model}</p>
              <p><strong>Descripción:</strong> {activo.details}</p>
              <p><strong>Ubicación:</strong> {activo.location}</p>
              <p><strong>Categoría:</strong> {activo.category}</p>
              <p><strong>Estado:</strong> {activo.status}</p>
              <p><strong>Asignado a:</strong> {activo.assigned_to}</p>
              <p><strong>Código:</strong> {activo.codigo}</p>
              <p><strong>Propiedad:</strong> CGER, La Palma</p>
            </div>

            <button
              onClick={imprimirEtiqueta}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Imprimir Etiqueta
            </button>
          </div>
        </>
      )}

      {mostrarEtiqueta && (
        <div className="mt-10 print:mt-0 print:flex print:items-center print:justify-center">
          {etiqueta}
        </div>
      )}
    </div>
  );
};

export default FichaActivo;
