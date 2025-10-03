import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { getSignedUrlIfNeeded, isStoragePath } from "../utils/storage";
import { 
  Building2, 
  Upload, 
  Save, 
  Edit3, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";

const ConfiguracionEmpresa = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    company_logo_url: "",
    tax_id: "",
    industry: ""
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_config")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setCompanyData(data);
        if (data.company_logo_url) {
          // If we store a storage path, resolve a signed URL for preview
          const previewUrl = isStoragePath(data.company_logo_url)
            ? await getSignedUrlIfNeeded(data.company_logo_url)
            : data.company_logo_url;
          setLogoPreview(previewUrl);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos de empresa:", error);
      toast.error("Error al cargar datos de empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor selecciona un archivo de imagen válido");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 5MB");
        return;
      }

      setLogoFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return companyData.company_logo_url;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `company_logo_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('activos')
        .upload(filePath, logoFile);

      if (uploadError) {
        throw uploadError;
      }

      // Return storage path; signed URLs will be created at read time
      return filePath;
    } catch (error) {
      console.error("Error al subir logo:", error);
      toast.error("Error al subir logo");
      return companyData.company_logo_url;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Subir logo si hay uno nuevo
      let logoUrl = companyData.company_logo_url;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      // Actualizar datos de empresa
      const { error } = await supabase
        .from("company_config")
        .upsert([{
          ...companyData,
          company_logo_url: logoUrl
        }], {
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      toast.success("Configuración de empresa guardada exitosamente");
      setIsEditing(false);
      setLogoFile(null);
      
      // Actualizar estado local
      setCompanyData(prev => ({
        ...prev,
        company_logo_url: logoUrl
      }));
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setIsEditing(false);
    setLogoFile(null);
    // Refresh preview with a new signed URL
    const refreshed = companyData.company_logo_url
      ? await getSignedUrlIfNeeded(companyData.company_logo_url)
      : "";
    setLogoPreview(refreshed);
    fetchCompanyData(); // Recargar datos originales
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuración de Empresa</h2>
            <p className="text-gray-600">Gestiona la información de tu empresa u organización</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Editar</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Guardando..." : "Guardar"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información Básica */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              Información Básica
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={companyData.company_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Nombre de tu empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  name="company_address"
                  value={companyData.company_address || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Dirección completa de la empresa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="company_phone"
                      value={companyData.company_phone || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      placeholder="+34 123 456 789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="company_email"
                      value={companyData.company_email || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      placeholder="info@empresa.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    name="company_website"
                    value={companyData.company_website || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="https://www.empresa.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Datos Fiscales */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              Datos Fiscales
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CIF/NIF
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={companyData.tax_id || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="B12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector Industrial
                </label>
                <input
                  type="text"
                  name="industry"
                  value={companyData.industry || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Tecnología, Manufactura, Servicios..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo y Preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="h-5 w-5 text-blue-600 mr-2" />
              Logo de la Empresa
            </h3>
            
            <div className="space-y-4">
              {/* Preview del Logo */}
              <div className="flex justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo de la empresa"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Sin logo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Input de archivo */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar nuevo logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: JPG, PNG, GIF. Máximo 5MB.
                  </p>
                </div>
              )}

              {/* Información del logo actual */}
              {companyData.company_logo_url && (
                <div className="text-sm text-gray-600">
                  <p><strong>Logo actual:</strong> {companyData.company_logo_url.split('/').pop()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
              Información del Sistema
            </h3>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>ID de Empresa:</span>
                <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                  {companyData.id || "No asignado"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Creado:</span>
                <span>{companyData.created_at ? new Date(companyData.created_at).toLocaleDateString() : "No disponible"}</span>
              </div>
              <div className="flex justify-between">
                <span>Última actualización:</span>
                <span>{companyData.updated_at ? new Date(companyData.updated_at).toLocaleDateString() : "No disponible"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionEmpresa;
