// src/components/CategoriasConfig.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const CategoriasConfig = () => {
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
    fetchCategorias();
  }, []);

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

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Categorías</h2>
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
      <ul className="divide-y border rounded bg-white">
        {categorias.map(cat => (
          <li key={cat.id} className="p-3">{cat.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default CategoriasConfig;
