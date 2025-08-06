import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const ModalEditar = ({ asset, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({});
  const [epiSizes, setEpiSizes] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verificar si es un EPI
  const isEPI = asset.category === "EPI";

  // Cargar datos completos del activo
  useEffect(() => {
    const loadAssetData = async () => {
      if (isEPI) {
        // Para EPIs, buscar por código en lugar de ID
        let epiData = null;
        let epiError = null;

        // Intentar buscar por código primero
        if (asset.codigo) {
          const { data, error } = await supabase
            .from("epi_assets")
            .select(`
              *,
              epi_sizes (*)
            `)
            .eq("codigo", asset.codigo)
            .single();
          
          epiData = data;
          epiError = error;
        }

        // Si no se encuentra por código, intentar por ID
        if (!epiData && asset.id) {
          const { data, error } = await supabase
            .from("epi_assets")
            .select(`
              *,
              epi_sizes (*)
            `)
            .eq("id", asset.id)
            .single();
          
          epiData = data;
          epiError = error;
        }

        if (!epiError && epiData) {
          setFormData({
            ...asset, // Usar los datos que ya tenemos del asset
            ...epiData, // Agregar datos específicos de epi_assets
            image_url: epiData.image_url || asset.image_url || ""
          });
          
          // Cargar tallas
          if (epiData.epi_sizes) {
            setEpiSizes(epiData.epi_sizes.map(t => ({ size: t.size, units: t.units })));
          }
        } else {
          console.error("Error cargando datos de EPI:", epiError);
          setFormData(asset); // Usar datos básicos si hay error
        }
      } else {
        // Para activos normales, usar los datos que ya tenemos
        setFormData({
          ...asset,
          image_url: asset.image_url || ""
        });
      }
    };

    loadAssetData();
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

    // Si es EPI, actualizar solo en epi_assets y epi_sizes
    if (isEPI) {
      // Primero necesitamos obtener el ID correcto del EPI
      let epiId = asset.id;
      
      // Si no tenemos el ID correcto, buscarlo por código
      if (!epiId || epiId === asset.id) {
        const { data: epiData, error: epiError } = await supabase
          .from("epi_assets")
          .select("id")
          .eq("codigo", asset.codigo)
          .single();
        
        if (!epiError && epiData) {
          epiId = epiData.id;
        } else {
          console.error("Error obteniendo ID del EPI:", epiError);
          setLoading(false);
          return;
        }
      }

      // Actualizar EPI principal con todos los campos disponibles
      const epiUpdateData = {
        name: formData.name || null,
        category: formData.category || null,
        brand: formData.brand || null,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        details: formData.details || null,
        assigned_to: formData.assigned_to || null,
        status: formData.status || 'Activo',
        supplier: formData.supplier || null,
        image_url: imageUrl || null,
        codigo: formData.codigo || asset.codigo || null,
        // Campos de fechas y precio - manejar tipos correctamente
        fecha_compra: formData.fecha_compra ? formData.fecha_compra : null,
        fecha_garantia: formData.fecha_garantia ? formData.fecha_garantia : null,
        precio_compra: (() => {
          if (!formData.precio_compra || formData.precio_compra === '' || formData.precio_compra === 'null') {
            return null;
          }
          const num = parseFloat(formData.precio_compra);
          return isNaN(num) ? null : num;
        })()
      };

      // Filtrar campos que no sean null, undefined o string vacío
      const filteredUpdateData = Object.fromEntries(
        Object.entries(epiUpdateData).filter(([key, value]) => 
          value !== null && value !== undefined && value !== '' && value !== 'null'
        )
      );

      console.log("Actualizando EPI con ID:", epiId, "Datos filtrados:", filteredUpdateData);

      // Log detallado de cada campo
      console.log("Campos individuales a enviar:");
      Object.entries(filteredUpdateData).forEach(([key, value]) => {
        console.log(`${key}:`, value, `(tipo: ${typeof value})`);
      });

      // Primero intentar con solo los campos básicos
      const basicFields = {
        name: filteredUpdateData.name,
        model: filteredUpdateData.model,
        supplier: filteredUpdateData.supplier,
        status: filteredUpdateData.status
      };

      console.log("Prueba con campos básicos:", basicFields);

      const { error: basicError } = await supabase
        .from("epi_assets")
        .update(basicFields)
        .eq("id", epiId);

      if (basicError) {
        console.error("Error con campos básicos:", basicError);
        setLoading(false);
        return;
      }

      // Si los campos básicos funcionan, intentar con todos los campos
      const { error: epiError } = await supabase
        .from("epi_assets")
        .update(filteredUpdateData)
        .eq("id", epiId);

      if (epiError) {
        console.error("Error al actualizar EPI:", epiError);
        console.error("Detalles del error:", {
          message: epiError.message,
          details: epiError.details,
          hint: epiError.hint,
          code: epiError.code
        });
        console.error("Datos que se intentaron enviar:", filteredUpdateData);
        setLoading(false);
        return;
      }

      // Eliminar tallas existentes
      await supabase
        .from("epi_sizes")
        .delete()
        .eq("epi_id", epiId);

      // Insertar nuevas tallas
      const sizesToInsert = epiSizes
        .filter(size => size.size && size.units > 0)
        .map(size => ({
          epi_id: epiId,
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
    } else {
      // Actualizar activo normal en tabla assets
      const updateData = {
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        details: formData.details,
        serial_number: formData.serial_number,
        assigned_to: formData.assigned_to,
        category: formData.category,
        fecha_compra: formData.fecha_compra || null,
        fecha_garantia: formData.fecha_garantia || null,
        precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
        status: formData.status || 'Activo',
        image_url: imageUrl
      };

      const { error } = await supabase
        .from("assets")
        .update(updateData)
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
          autoComplete="off"
        />
        <textarea
          name="details"
          placeholder="Descripción del producto"
          value={formData.details || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3 h-20 resize-none"
          rows="3"
          autoComplete="off"
        />
        <input
          type="text"
          name="brand"
          placeholder="Marca"
          value={formData.brand || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />
        <input
          type="text"
          name="model"
          placeholder="Modelo"
          value={formData.model || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />
        <input
          type="text"
          name="serial_number"
          placeholder="Número de serie"
          value={formData.serial_number || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />
        <input
          type="text"
          name="assigned_to"
          placeholder="Asignado a"
          value={formData.assigned_to || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />
        <input
          type="date"
          name="fecha_compra"
          placeholder="Fecha de Compra"
          value={formData.fecha_compra?.split('T')[0] || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />
        <input
          type="date"
          name="fecha_garantia"
          placeholder="Fecha de Garantía"
          value={formData.fecha_garantia?.split('T')[0] || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />
        <input
          type="number"
          step="0.01"
          name="precio_compra"
          placeholder="Precio de Compra (€)"
          value={formData.precio_compra || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />
        <input
          type="text"
          name="category"
          placeholder="Categoría"
          value={formData.category || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />
        <input
          type="text"
          name="status"
          placeholder="Estado"
          value={formData.status || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />
        <input
          type="text"
          name="codigo"
          placeholder="Código"
          value={formData.codigo || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded mb-3"
          autoComplete="off"
        />

        {/* Campos específicos para EPIs */}
        {isEPI && (
          <input
            type="text"
            name="supplier"
            placeholder="Proveedor"
            value={formData.supplier || ""}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded mb-3"
            autoComplete="off"
          />
        )}

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
                  autoComplete="off"
                />
                <input
                  type="number"
                  placeholder="Unidades"
                  value={size.units}
                  onChange={(e) => handleEpiSizeChange(index, "units", parseInt(e.target.value) || 0)}
                  className="w-16 border px-2 py-1 rounded"
                  autoComplete="off"
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
