import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import DrawerDetalle from "./DrawerDetalle";

const Dashboard = () => {
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);

  const fetchAssets = async () => {
    const { data, error } = await supabase.from("assets").select("*").order("name", { ascending: true });
    if (error) console.error("Error cargando activos:", error);
    else setAssets(data);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const query = searchTerm.toLowerCase();
    return (
      asset.name?.toLowerCase().includes(query) ||
      asset.model?.toLowerCase().includes(query) ||
      asset.brand?.toLowerCase().includes(query) ||
      asset.serial_number?.toLowerCase().includes(query) ||
      asset.category?.toLowerCase().includes(query) ||
      (asset.assigned_to && asset.assigned_to.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">📋 Inventario de Activos</h1>

      <input
        type="text"
        placeholder="🔍 Buscar por nombre, modelo, marca, serie, categoría o asignado a..."
        className="w-full px-4 py-2 border mb-6 rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="border p-4 rounded shadow hover:bg-gray-100 cursor-pointer"
            onClick={() => setSelectedAsset(asset)}
          >
            <h2 className="text-lg font-semibold">{asset.name}</h2>
            <p className="text-sm text-gray-600">{asset.brand} - {asset.model}</p>
            <p className="text-sm text-gray-500">Serie: {asset.serial_number}</p>
            <p className="text-sm text-blue-600">{asset.category}</p>
          </div>
        ))}
      </div>

      {selectedAsset && (
        <DrawerDetalle
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onUpdated={fetchAssets}
        />
      )}
    </div>
  );
};

export default Dashboard;