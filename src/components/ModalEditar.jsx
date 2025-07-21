import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const ModalEditar = ({ asset, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    ...asset,
    image_url: asset.image_url || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = formData.image_url;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${formData.id}-${Date.now()}.${fileExt}`; // más seguro
      const filePath = fileName;
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("🔒 Sesión activa:", sessionData.session);
       
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("activos")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: true,
        });
    
      if (uploadError) {
        console.error("❌ Error al subir la imagen:", uploadError.message);
        setLoading(false);
        return;
      }
    
      const { data: publicUrlData, error: urlError } = supabase.storage
        .from("activos")
        .getPublicUrl(filePath);
    
      if (urlError) {
        console.error("❌ Error al obtener URL pública:", urlError.message);
        setLoading(false);
        return;
      }
    
      imageUrl = publicUrlData.publicUrl;
    }
    

    const { error } = await supabase
      .from("assets")
      .update({ ...formData, image_url: imageUrl })
      .eq("id", asset.id);

    if (error) {
      console.error("Error al guardar cambios:", error.message);
    } else {
      onUpdated();
    }

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-md shadow-md w-full max-w-md"
      >
        <h2 className="text-xl font-semibold mb-4">Editar Activo</h2>

        <input
          type="text"
          name="name"
          placeholder="Nombre"
          value={formData.name || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
        />
        <input
          type="text"
          name="brand"
          placeholder="Marca"
          value={formData.brand || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
        />
        <input
          type="text"
          name="model"
          placeholder="Modelo"
          value={formData.model || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
        />
        <input
          type="text"
          name="serial_number"
          placeholder="Número de serie"
          value={formData.serial_number || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
        />
        <input
          type="text"
          name="category"
          placeholder="Categoría"
          value={formData.category || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
        />
        <input
          type="text"
          name="status"
          placeholder="Estado"
          value={formData.status || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-3"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModalEditar;
