import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import DrawerDetalle from "./DrawerDetalle";
import ModalForm from "./ModalForm";
import AssetCard from "./AssetCard";

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, []);

  const fetchAssets = async () => {
    // Cargar activos normales
    const { data: assetsData, error: assetsError } = await supabase
      .from("assets")
      .select("*")
      .order("name", { ascending: true });
    
    if (assetsError) console.error("Error al cargar activos:", assetsError);

    // Cargar EPIs con sus tallas
    const { data: epiData, error: epiError } = await supabase
      .from("epi_assets")
      .select(`
        *,
        epi_sizes (*)
      `)
      .order("name", { ascending: true });

    if (epiError) console.error("Error al cargar EPIs:", epiError);

    // Combinar y formatear datos
    const normalAssets = (assetsData || []).filter(asset => 
      !asset.category || asset.category.toLowerCase() !== "epi"
    );
    const epiAssets = (epiData || []).map(epi => ({
      ...epi,
      id: epi.id,
      category: "EPI",
      // Crear un código único para EPIs si no existe
      codigo: epi.codigo || `EPI-${epi.id.slice(0, 8).toUpperCase()}`,
      // Agregar información de tallas
      tallas: epi.epi_sizes || []
    }));

    setAssets([...normalAssets, ...epiAssets]);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
    if (error) console.error("Error al cargar categorías:", error);
    else setCategories(data);
  };

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

  const handleAssetClick = async (asset) => {
    setIsLoadingAsset(true);
    
    console.log("Asset clickeado:", asset); // Debug
    
    try {
      if (asset.category === "EPI") {
        // Para EPIs, cargar datos de ambas tablas
        const { data: epiData, error: epiError } = await supabase
          .from("epi_assets")
          .select(`
            *,
            epi_sizes (*)
          `)
          .eq("id", asset.id)
          .single();

        console.log("Datos de epi_assets:", epiData); // Debug
        console.log("Error epi_assets:", epiError); // Debug

        // Intentar buscar por código primero
        let { data: assetData, error: assetError } = await supabase
          .from("assets")
          .select("*")
          .eq("codigo", asset.codigo)
          .eq("category", "EPI")
          .single();

        // Si no se encuentra por código, intentar por nombre
        if (assetError) {
          console.log("Buscando por nombre como fallback..."); // Debug
          const { data: assetDataByName, error: assetErrorByName } = await supabase
            .from("assets")
            .select("*")
            .eq("name", asset.name)
            .eq("category", "EPI")
            .single();
          
          if (!assetErrorByName) {
            assetData = assetDataByName;
            assetError = null;
          }
        }

        console.log("Datos de assets:", assetData); // Debug
        console.log("Error assets:", assetError); // Debug

        if (!epiError) {
          const completeAsset = {
            ...asset, // Datos base
            ...epiData, // Datos específicos de epi_assets
            ...(assetData || {}), // Datos generales de assets
            tallas: epiData.epi_sizes || []
          };
          
          console.log("Asset completo:", completeAsset); // Debug
          setSelectedAsset(completeAsset);
        }
      } else {
        // Para activos normales, usar los datos que ya tenemos
        setSelectedAsset(asset);
      }
    } catch (error) {
      console.error("Error cargando datos del activo:", error);
      setSelectedAsset(asset); // Usar datos básicos si hay error
    } finally {
      setIsLoadingAsset(false);
    }
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
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.name)}
            className={`px-3 py-1 rounded-full border transition-all duration-150 ease-in-out hover:shadow-md hover:scale-105 text-sm font-medium ${
              selectedCategory === cat.name
                ? "bg-blue-600 text-white border-blue-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onClick={() => handleAssetClick(asset)}
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
