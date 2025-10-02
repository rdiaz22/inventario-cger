import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import QRCode from 'react-qr-code';
import { ArrowLeft, QrCode, Calendar, User, Tag, Building } from 'lucide-react';
import { getSignedUrlIfNeeded } from '../utils/storage';

const PublicAssetView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activo, setActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [imageResolvedUrl, setImageResolvedUrl] = useState('');

  useEffect(() => {
    const fetchActivo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar en la tabla assets
        let { data, error } = await supabase
          .from('assets')
          .select(`
            id,
            name,
            codigo,
            category,
            brand,
            model,
            details,
            status,
            assigned_to,
            image_url,
            created_at
          `)
          .eq('id', id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No encontrado en assets, buscar en epi_assets
          const { data: epiData, error: epiError } = await supabase
            .from('epi_assets')
            .select(`
              id,
              codigo,
              epi_name,
              epi_type,
              brand,
              model,
              description,
              status,
              assigned_to,
              image_url,
              created_at
            `)
            .eq('id', id)
            .single();

          if (epiError) {
            throw epiError;
          }

          // Transformar datos de EPI al formato esperado
          setActivo({
            ...epiData,
            name: epiData.epi_name,
            category: 'EPI',
            details: epiData.description
          });
        } else if (error) {
          throw error;
        } else {
          setActivo(data);
        }
      } catch (err) {
        console.error('Error al cargar activo:', err);
        setError('No se pudo cargar la información del activo');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchActivo();
    }
  }, [id]);

  useEffect(() => {
    const resolveImage = async () => {
      if (!activo?.image_url) {
        setImageResolvedUrl('');
        return;
      }
      const url = await getSignedUrlIfNeeded(activo.image_url);
      setImageResolvedUrl(url);
    };
    resolveImage();
  }, [activo]);

  const DetailItem = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`bg-white rounded-lg p-4 shadow-sm border ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm text-gray-900 font-medium">
        {value || 'No disponible'}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del activo...</p>
        </div>
      </div>
    );
  }

  if (error || !activo) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Activo no encontrado
          </h2>
          <p className="text-red-600 mb-4">
            {error || 'El activo solicitado no existe o no está disponible.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header con navegación */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
      </div>

      {/* Información principal del activo */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Imagen del activo */}
        {imageResolvedUrl && (
          <div className="aspect-w-16 aspect-h-9 bg-gray-100">
            <img
              src={imageResolvedUrl}
              alt={activo.name}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Título y código */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {activo.name}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Tag className="h-4 w-4" />
                <span>Código: {activo.codigo || 'No definido'}</span>
              </div>
            </div>

            {/* Botón QR */}
            <button
              onClick={() => setMostrarQR(!mostrarQR)}
              className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              <span className="text-sm font-medium">Ver QR</span>
            </button>
          </div>

          {/* QR Code Modal */}
          {mostrarQR && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Código QR del activo
              </h3>
              <div className="flex justify-center">
                <QRCode
                  value={`${window.location.origin}/activos/${activo.id}`}
                  size={128}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Escanea este código para acceder a la información del activo
              </p>
            </div>
          )}

          {/* Grid de información */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailItem
              icon={Tag}
              label="Categoría"
              value={activo.category}
            />
            
            <DetailItem
              icon={Building}
              label="Marca"
              value={activo.brand}
            />
            
            <DetailItem
              icon={Tag}
              label="Modelo"
              value={activo.model}
            />
            
            <DetailItem
              icon={User}
              label="Estado"
              value={activo.status}
              className={activo.status === 'Activo' ? 'border-green-200 bg-green-50' : 
                        activo.status === 'Mantenimiento' ? 'border-yellow-200 bg-yellow-50' :
                        activo.status === 'Fuera de servicio' ? 'border-red-200 bg-red-50' : ''}
            />
            
            <DetailItem
              icon={User}
              label="Asignado a"
              value={activo.assigned_to}
            />
            
            <DetailItem
              icon={Calendar}
              label="Fecha de registro"
              value={activo.created_at ? new Date(activo.created_at).toLocaleDateString('es-ES') : 'No disponible'}
            />
          </div>

          {/* Descripción */}
          {activo.details && (
            <div className="mt-6">
              <DetailItem
                icon={Tag}
                label="Descripción"
                value={activo.details}
                className="col-span-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Información adicional para administradores */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Building className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-800">
            ¿Necesitas gestionar este activo?
          </h3>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Para editar, eliminar o realizar otras operaciones administrativas, 
          accede al panel de administración.
        </p>
        <a
          href="/admin/login"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <User className="h-4 w-4" />
          <span>Acceso Administrativo</span>
        </a>
      </div>
    </div>
  );
};

export default PublicAssetView;
