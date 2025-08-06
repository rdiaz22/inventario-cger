import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const categorias = [
"Accesorios",
"Altavoz",
"Batería",
"Cámara",
"Cargador",
"Disco duro",
"Dispositivo móvil",
"Escáner",
"Epi",
"Impresora",
"Monitor",
"Micrófono",
"Ordenador de sobremesa",
"Ordenador portátil",
"Proyector",
"Ratón",
"Router / Switch",
"Teclado",
"Tarjeta de Memoria",
  "Otro"
];

const ModalForm = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    details: "",
    serial_number: "",
    assigned_to: "",
    category: "",
    fecha_compra: "",
    fecha_garantia: "",
    precio_compra: "",
    status: "Activo", // valor por defecto
    // Campos específicos para EPIs
    supplier: "",
    fabricante: "",
    certificacion: "",
    codigo: "" // Nuevo campo para el código
  });

  const [epiSizes, setEpiSizes] = useState([
    { size: "", units: 1 }
  ]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  const [imageFile, setImageFile] = useState(null);

  // Verificar si la categoría seleccionada es EPI
  const isEPI = form.category.toLowerCase() === "epi";

  const handleSubmit = async (e) => {
      e.preventDefault();

      console.log("Datos del formulario:", form); // Debug
      console.log("Tallas:", epiSizes); // Debug

      let imageUrl = "";

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("activos")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("Error subiendo imagen:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase
            .storage
            .from("activos")
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        }
      }

      // Si es EPI, guardar solo en tabla epi_assets y epi_sizes
      if (isEPI) {
        // Generar un código único si no existe
        const codigo = form.codigo || `EPI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        
        console.log("Guardando EPI con código:", codigo); // Debug
        
        // Guardar en epi_assets con solo los campos que existen en la tabla
        const epiDataToInsert = {
          name: form.name,
          model: form.model || null,
          supplier: form.supplier || null,
          image_url: imageUrl || null,
          codigo
        };
        
        console.log("Datos EPI a insertar:", epiDataToInsert); // Debug
        
        const { data: epiData, error: epiError } = await supabase
          .from("epi_assets")
          .insert([epiDataToInsert])
          .select();

        if (epiError) {
          console.error("Error guardando EPI:", epiError);
          return;
        }

        console.log("EPI guardado:", epiData); // Debug

        // Guardar tallas
        const sizesToInsert = epiSizes
          .filter(size => size.size && size.units > 0)
          .map(size => ({
            epi_id: epiData[0].id,
            size: size.size,
            units: size.units
          }));

        if (sizesToInsert.length > 0) {
          const { error: sizesError } = await supabase
            .from("epi_sizes")
            .insert(sizesToInsert);

          if (sizesError) {
            console.error("Error guardando tallas:", sizesError);
          }
        }

        // También guardar en assets para tener fechas y precio
        const assetDataToInsert = {
          name: form.name,
          category: form.category || 'EPI',
          brand: form.brand || null,
          model: form.model || null,
          serial_number: form.serial_number || null,
          details: form.details || null,
          assigned_to: form.assigned_to || null,
          status: form.status || 'Activo',
          image_url: imageUrl || null,
          codigo,
          // Campos de fechas y precio
          fecha_compra: form.fecha_compra || null,
          fecha_garantia: form.fecha_garantia || null,
          precio_compra: form.precio_compra && form.precio_compra !== '' ? parseFloat(form.precio_compra) : null
        };

        console.log("Datos Asset a insertar:", assetDataToInsert); // Debug
        
        const { error: assetError } = await supabase.from("assets").insert([assetDataToInsert]);
        
        if (assetError) {
          console.error("Error guardando en assets:", assetError);
        }
      } else {
        // Guardar activo normal en tabla assets
        const assetData = {
          name: form.name,
          brand: form.brand,
          model: form.model,
          details: form.details,
          serial_number: form.serial_number,
          assigned_to: form.assigned_to,
          category: form.category,
          fecha_compra: form.fecha_compra || null,
          fecha_garantia: form.fecha_garantia || null,
          precio_compra: form.precio_compra ? parseFloat(form.precio_compra) : null,
          status: form.status,
          image_url: imageUrl
        };
        
        console.log("Guardando activo normal:", assetData); // Debug
        
        const { error: assetError } = await supabase.from("assets").insert([assetData]);
        
        if (assetError) {
          console.error("Error guardando activo:", assetError);
        }
      }

      onCreated();
      onClose();
    };
    

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Añadir nuevo activo</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" onChange={handleChange} placeholder="Nombre" className="border p-2 w-full" />
          <input name="brand" onChange={handleChange} placeholder="Marca" className="border p-2 w-full" />
          <input name="model" onChange={handleChange} placeholder="Modelo" className="border p-2 w-full" />
          <input name="details" onChange={handleChange} placeholder="Descripción" className="border p-2 w-full" />
          <input name="serial_number" onChange={handleChange} placeholder="Número de serie" className="border p-2 w-full" />
          <input name="assigned_to" onChange={handleChange} placeholder="Asignado a" className="border p-2 w-full" />
          <input type="date" value={form.fecha_compra?.split('T')[0] || ""} name="fecha_compra" onChange={handleChange} placeholder="Fecha de Compra" className="border p-2 w-full" />
          <input type="date" value={form.fecha_garantia?.split('T')[0] || ""} name="fecha_garantia" onChange={handleChange} placeholder="Fecha de Garantía" className="border p-2 w-full" />
          <input type="number" step="0.01" name="precio_compra" onChange={handleChange} placeholder="Precio de Compra (€)" className="border p-2 w-full" />
          <select name="category" onChange={handleChange} className="border p-2 w-full">
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat, i) => ( 
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
          <select name="status" value={form.status} onChange={handleChange} className="border p-2 w-full">
            <option value="Activo">Activo</option>
            <option value="De baja">De baja</option>
          </select>
          
          {/* Campos específicos para EPIs */}
          {isEPI && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-blue-600 mb-3">Información específica de EPI</h3>
              <input 
                name="supplier" 
                value={form.supplier}
                onChange={handleChange} 
                placeholder="Proveedor" 
                className="border p-2 w-full mb-3" 
              />
              <input 
                name="fabricante" 
                value={form.fabricante}
                onChange={handleChange} 
                placeholder="Fabricante" 
                className="border p-2 w-full mb-3" 
              />
              <input 
                name="certificacion" 
                value={form.certificacion}
                onChange={handleChange} 
                placeholder="Certificación" 
                className="border p-2 w-full mb-3" 
              />
              <input 
                name="codigo" 
                value={form.codigo}
                onChange={handleChange} 
                placeholder="Código (opcional)" 
                className="border p-2 w-full mb-3" 
              />
              
              {/* Gestión de tallas */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Tallas y Unidades</h4>
                  <button 
                    type="button"
                    onClick={addEpiSize}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                  >
                    + Agregar Talla
                  </button>
                </div>
                
                {epiSizes.map((size, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input 
                      type="text"
                      value={size.size}
                      onChange={(e) => handleEpiSizeChange(index, 'size', e.target.value)}
                      placeholder="Talla"
                      className="border p-2 flex-1"
                    />
                    <input 
                      type="number"
                      value={size.units}
                      onChange={(e) => handleEpiSizeChange(index, 'units', parseInt(e.target.value) || 0)}
                      placeholder="Unidades"
                      className="border p-2 w-24"
                    />
                    <button 
                      type="button"
                      onClick={() => removeEpiSize(index)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      disabled={epiSizes.length === 1}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="border p-2 w-full"
            />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalForm;