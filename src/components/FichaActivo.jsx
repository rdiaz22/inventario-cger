// src/pages/FichaActivo.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { getSignedUrlIfNeeded } from "../utils/storage";
import QRCode from "react-qr-code";

const FichaActivo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activo, setActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarEtiqueta, setMostrarEtiqueta] = useState(false);
  const [imageResolvedUrl, setImageResolvedUrl] = useState("");

  useEffect(() => {
    const fetchActivo = async () => {
      try {
        // Primero buscar en la tabla assets
        let { data, error } = await supabase
          .from("assets")
          .select("*")
          .eq("id", id)
          .single();

        // Si se encuentra en assets, verificar si es un EPI
        if (!error && data) {
          if (data.category === "EPI") {
            // Es un EPI en assets, buscar datos adicionales en epi_assets
            const { data: epiData, error: epiError } = await supabase
              .from("epi_assets")
              .select(`
                *,
                epi_sizes (*)
              `)
              .eq("codigo", data.codigo)
              .single();

            if (!epiError && epiData) {
              setActivo({
                ...data, // Datos generales de assets
                ...epiData, // Datos específicos de epi_assets
                tallas: epiData.epi_sizes || []
              });
            } else {
              setActivo(data);
            }
          } else {
            // Es un activo normal
            setActivo(data);
          }
        } else {
          // No se encuentra en assets, buscar en epi_assets
          const { data: epiData, error: epiError } = await supabase
            .from("epi_assets")
            .select(`
              *,
              epi_sizes (*)
            `)
            .eq("id", id)
            .single();

          if (!epiError && epiData) {
            // Combinar datos de epi_assets
            setActivo({
              ...epiData, // Datos específicos de epi_assets
              category: "EPI",
              codigo: epiData.codigo || `EPI-${epiData.id.slice(0, 8).toUpperCase()}`,
              tallas: epiData.epi_sizes || []
            });
          } else {
            console.error("Error al cargar activo", epiError);
          }
        }
      } catch (error) {
        console.error("Error al cargar activo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivo();
  }, [id]);

  useEffect(() => {
    const resolve = async () => {
      if (!activo?.image_url) {
        setImageResolvedUrl("");
        return;
      }
      const url = await getSignedUrlIfNeeded(activo.image_url);
      setImageResolvedUrl(url);
    };
    resolve();
  }, [activo]);

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
          <div className="flex justify-between items-center w-full max-w-xl mb-4">
            <h1 className="text-2xl font-bold">Ficha del Activo</h1>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <span>←</span>
              Volver al inicio
            </button>
          </div>
          <div className="bg-gray-100 rounded-xl shadow-md w-full max-w-xl p-4">
            <img
              src={imageResolvedUrl}
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
              <p><strong>Fecha de Compra:</strong> {activo.fecha_compra ? new Date(activo.fecha_compra).toLocaleDateString("es-ES") : "No registrada"}</p>
              <p><strong>Fecha de Garantía:</strong> {activo.fecha_garantia ? new Date(activo.fecha_garantia).toLocaleDateString("es-ES") : "No registrada"}</p>
              <p><strong>Precio de Compra:</strong> {activo.precio_compra ? `${parseFloat(activo.precio_compra).toFixed(2)} €` : "No registrado"}</p>
              <p><strong>Propiedad:</strong> CGER, La Palma</p>
              
              {/* Información específica para EPIs */}
              {activo.category === "EPI" && (
                <>
                  <p><strong>Proveedor:</strong> {activo.supplier || "No disponible"}</p>
                  {activo.tallas && activo.tallas.length > 0 && (
                    <div>
                      <p><strong>Tallas y Unidades:</strong></p>
                      <div className="ml-4 space-y-1">
                        {activo.tallas.map((talla, index) => (
                          <p key={index} className="text-sm">
                            • {talla.size}: {talla.units} unidades
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
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
