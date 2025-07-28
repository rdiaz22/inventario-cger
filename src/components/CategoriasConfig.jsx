// src/components/CategoriasConfig.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const CategoriasConfig = ({ isOpen, onClose }) => {
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setCategorias(data);
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategorias();
    }
  }, [isOpen]);

  const handleAddCategoria = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!nuevaCategoria.trim()) {
      setError("El nombre no puede estar vacío");
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("categories")
      .insert([{ name: nuevaCategoria.trim() }]);
    if (error) setError(error.message);
    else {
      setNuevaCategoria("");
      fetchCategorias();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Gestión de Categorías</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleAddCategoria} className="flex gap-2 mb-6">
          <input
            type="text"
            value={nuevaCategoria}
            onChange={e => setNuevaCategoria(e.target.value)}
            placeholder="Nueva categoría"
            className="border p-2 flex-1 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Agregando..." : "Agregar"}
          </button>
        </form>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <div className="max-h-60 overflow-y-auto">
          <ul className="divide-y border rounded bg-gray-50">
            {categorias.map(cat => (
              <li key={cat.id} className="p-3 bg-white">{cat.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CategoriasConfig;
