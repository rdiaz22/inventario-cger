import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const ModalEditar = ({ asset, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    ...asset,
    image_url: asset.image_url || "",
  });
  const [epiSizes, setEpiSizes] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verificar si es un EPI
  const isEPI = asset.category === "EPI";

  // Cargar tallas si es un EPI
  useEffect(() => {
    if (isEPI && asset.tallas) {
      setEpiSizes(asset.tallas.map(t => ({ size: t.size, units: t.units })));
    }
  }, [asset, isEPI]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEpiSizeChange = (index, field, value) => {
    const newSizes = [...epiSizes];
    newSizes[index][field] = value;
    setEpiSizes(newSizes);
  };

  const addEpiSize = () => {
    setEpiSizes([...epiSizes, { size: "", units: 1 }]);
  };

  const removeEpiSize = (index) => {
    if (epiSizes.length > 1) {
      const newSizes = epiSizes.filter((_, i) => i !== index);
      setEpiSizes(newSizes);
    }
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
      const fileName = `${formData.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;
       
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

    // Si es EPI, actualizar en epi_assets, epi_sizes Y assets
    if (isEPI) {
      // Actualizar EPI principal
      const { error: epiError } = await supabase
        .from("epi_assets")
        .update({
          name: formData.name,
          model: formData.model,
          supplier: formData.supplier,
          image_url: imageUrl
        })
        .eq("id", asset.id);

      if (epiError) {
        console.error("Error al actualizar EPI:", epiError);
        setLoading(false);
        return;
      }

      // Eliminar tallas existentes
      await supabase
        .from("epi_sizes")
        .delete()
        .eq("epi_id", asset.id);

      // Insertar nuevas tallas
      const sizesToInsert = epiSizes
        .filter(size => size.size && size.units > 0)
        .map(size => ({
          epi_id: asset.id,
          size: size.size,
          units: size.units
        }));

      if (sizesToInsert.length > 0) {
        const { error: sizesError } = await supabase
          .from("epi_sizes")
          .insert(sizesToInsert);

        if (sizesError) {
          console.error("Error al actualizar tallas:", sizesError);
        }
      }

      // También actualizar en assets para mantener consistencia
      // Solo campos que existen en la tabla assets
      const assetUpdateData = {
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        details: formData.details,
        serial_number: formData.serial_number,
        assigned_to: formData.assigned_to,
        category: formData.category,
        fecha_compra: formData.fecha_compra,
        status: formData.status,
        image_url: imageUrl
      };

      const { error: assetError } = await supabase
        .from("assets")
        .update(assetUpdateData)
        .eq("id", asset.id);

      if (assetError) {
        console.error("Error al actualizar activo:", assetError.message);
      }
    } else {
      // Actualizar activo normal
      const { error } = await supabase
        .from("assets")
        .update({ ...formData, image_url: imageUrl })
        .eq("id", asset.id);

      if (error) {
        console.error("Error al guardar cambios:", error.message);
      }
    }

    onUpdated();
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

        {isEPI && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Tallas del EPI</h3>
            {epiSizes.map((size, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  placeholder="Talla"
                  value={size.size}
                  onChange={(e) => handleEpiSizeChange(index, "size", e.target.value)}
                  className="w-24 border px-2 py-1 rounded mr-2"
                />
                <input
                  type="number"
                  placeholder="Unidades"
                  value={size.units}
                  onChange={(e) => handleEpiSizeChange(index, "units", parseInt(e.target.value) || 0)}
                  className="w-16 border px-2 py-1 rounded"
                />
                <button
                  type="button"
                  onClick={() => removeEpiSize(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addEpiSize}
              className="mt-2 px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Agregar talla
            </button>
          </div>
        )}

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
