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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, []);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
      asset.category?.toLowerCase().includes(query) ||
      asset.assigned_to?.toLowerCase().includes(query);

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
        // Para EPIs, cargar datos solo de epi_assets
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

        if (!epiError && epiData) {
          // Crear objeto completo con datos de epi_assets
          const completeAsset = {
            ...asset, // Datos base
            ...epiData, // Datos específicos de epi_assets
            category: "EPI", // Asegurar que la categoría sea EPI
            tallas: epiData.epi_sizes || []
          };
          
          console.log("Asset completo:", completeAsset); // Debug
          setSelectedAsset(completeAsset);
        } else {
          console.error("Error cargando EPI:", epiError);
          setSelectedAsset(asset); // Usar datos básicos si hay error
        }
      } else {
        // Para activos normales, usar los datos que ya tenemos
        setSelectedAsset(asset);
      }
    } catch (error) {
      console.error("Error al cargar asset:", error);
      setSelectedAsset(asset); // Usar datos básicos en caso de error
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
        placeholder="🔍 Buscar por nombre, modelo, marca, asignado a..."
        className="w-full px-4 py-2 border mb-4 rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filtros de categoría - Responsive */}
      <div className="mb-4">
        {/* Desktop: Botones horizontales */}
        <div className="hidden md:flex flex-wrap gap-2">
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

        {/* Mobile: Dropdown */}
        <div className="md:hidden relative dropdown-container">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="text-sm font-medium">
              {selectedCategory ? selectedCategory : "Todas las categorías"}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  selectedCategory === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                Todas las categorías
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    handleCategoryClick(cat.name);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                    selectedCategory === cat.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
