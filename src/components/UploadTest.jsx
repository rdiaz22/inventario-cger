import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function UploadTest() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    setMessage("Subiendo...");

    const userResult = await supabase.auth.getUser();
    console.log("👤 Usuario:", userResult.data.user);

    if (!file) {
      setMessage("⚠️ No has seleccionado ningún archivo.");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("activos")
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error("❌ Error al subir:", error.message);
      setMessage("❌ Error: " + error.message);
    } else {
      setMessage("✅ ¡Archivo subido correctamente!");
    }
  };

  return (
    <div className="p-4 bg-white border rounded shadow max-w-md mx-auto mt-10">
      <h2 className="text-lg font-bold mb-2">Test de subida a Supabase</h2>
      <input type="file" onChange={handleFileChange} className="mb-2" />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Subir archivo
      </button>
      <p className="mt-3 text-sm">{message}</p>
    </div>
  );
}
