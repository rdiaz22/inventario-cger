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
    fecha_compra:""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = async (e) => {
      e.preventDefault();

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

      await supabase.from("assets").insert([{ ...form, image_url: imageUrl }]);
      onCreated();
      onClose();
    };
    

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Añadir nuevo activo</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" onChange={handleChange} placeholder="Nombre" className="border p-2 w-full" />
          <input name="brand" onChange={handleChange} placeholder="Marca" className="border p-2 w-full" />
          <input name="model" onChange={handleChange} placeholder="Modelo" className="border p-2 w-full" />
          <input name="details" onChange={handleChange} placeholder="Descripción" className="border p-2 w-full" />
          <input name="serial_number" onChange={handleChange} placeholder="Número de serie" className="border p-2 w-full" />
          <input name="assigned_to" onChange={handleChange} placeholder="Asignado a" className="border p-2 w-full" />
          <input type="date" value={form.fecha_compra?.split('T')[0] || ""} name="fecha_compra" onChange={handleChange} placeholder="Fecha de Compra" className="border p-2 w-full" />
          <select name="category" onChange={handleChange} className="border p-2 w-full">
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat, i) => ( 
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
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