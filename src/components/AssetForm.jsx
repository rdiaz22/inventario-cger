import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AssetForm() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    serial_number: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await supabase.from("assets").insert([formData]);
    alert("Asset saved!");
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="name" placeholder="Name" onChange={handleChange} className="border p-2 w-full" />
      <input name="category" placeholder="Category" onChange={handleChange} className="border p-2 w-full" />
      <input name="serial_number" placeholder="Serial Number" onChange={handleChange} className="border p-2 w-full" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2">Save</button>
    </form>
  );
}