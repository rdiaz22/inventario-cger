// src/components/CategoriasConfig.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function CategoriasConfig() {
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");

  const fetchCategorias = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("created_at");
    if (!error) setCategorias(data);
  };

  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: nuevaCategoria.trim() });
    if (!error) {
      setNuevaCategoria("");
      fetchCategorias();
    }
  };

  const eliminarCategoria = async (id) => {
    await supabase.from("categories").delete().eq("id", id);
    fetchCategorias();
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Categorías</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="border px-2 py-1 flex-1 rounded"
          placeholder="Nueva categoría"
          value={nuevaCategoria}
          onChange={(e) => setNuevaCategoria(e.target.value)}
        />
        <button onClick={agregarCategoria} className="bg-blue-600 text-white px-3 py-1 rounded">
          Añadir
        </button>
      </div>
      <ul className="space-y-2">
        {categorias.map((cat) => (
          <li key={cat.id} className="flex justify-between items-center border-b pb-1">
            <span>{cat.name}</span>
            <button
              className="text-red-500 text-sm"
              onClick={() => eliminarCategoria(cat.id)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
