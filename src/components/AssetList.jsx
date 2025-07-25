import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import DrawerDetalle from "./DrawerDetalle";
import ModalForm from "./ModalForm";
import AssetCard from "./AssetCard";

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .order("name", { ascending: true });
    if (error) console.error("Error al cargar activos:", error);
    else setAssets(data);
  };

  const uniqueCategories = [
    ...new Set(assets.map((a) => a.category).filter(Boolean)),
  ];

  const filteredAssets = assets.filter((asset) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      asset.name?.toLowerCase().includes(query) ||
      asset.model?.toLowerCase().includes(query) ||
      asset.brand?.toLowerCase().includes(query) ||
      asset.serial_number?.toLowerCase().includes(query) ||
      asset.category?.toLowerCase().includes(query);

    const matchesCategory = selectedCategory
      ? asset.category === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  const handleCategoryClick = (category) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📋 Inventario de Activos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded shadow"
        >
          ➕ Añadir Activo
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total de activos</p>
          <p className="text-2xl font-bold">{assets.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Activos con categoría</p>
          <p className="text-2xl font-bold">{assets.filter((a) => a.category).length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Sin categoría</p>
          <p className="text-2xl font-bold">{assets.filter((a) => !a.category).length}</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="🔍 Buscar por nombre, modelo, marca..."
        className="w-full px-4 py-2 border mb-4 rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full border transition-all duration-150 ease-in-out hover:shadow-md hover:scale-105 text-sm font-medium ${
            selectedCategory === null
              ? "bg-gray-800 text-white border-gray-900"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Todos
        </button>
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-3 py-1 rounded-full border transition-all duration-150 ease-in-out hover:shadow-md hover:scale-105 text-sm font-medium ${
              selectedCategory === cat
                ? "bg-blue-600 text-white border-blue-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onClick={() => setSelectedAsset(asset)}
          />
        ))}
      </div>

      {selectedAsset && (
        <DrawerDetalle
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onUpdated={fetchAssets}
        />
      )}

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          setIsModalOpen(false);
          fetchAssets();
        }}
      />
    </div>
  );
};

export default AssetList;
