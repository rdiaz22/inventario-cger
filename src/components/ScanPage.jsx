import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { fetchProductDataFromUPC } from '../../api/upcItemDB';

const ScanPage = () => {
  const navigate = useNavigate();
  const [scannedCode, setScannedCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    details: '',
    category: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const isProcessingRef = useRef(false);
  const processedCodesRef = useRef(new Set());

  const handleScan = async (code) => {
    console.log('🔍 Procesando código escaneado:', code);
    
    // Evitar procesar el mismo código múltiples veces
    if (processedCodesRef.current.has(code) || isProcessingRef.current) {
      console.log('⚠️ Código ya procesado o procesando, ignorando...');
      return;
    }
    
    processedCodesRef.current.add(code);
    isProcessingRef.current = true;
    setScannedCode(code);
    setSuccessMessage('');

    try {
      const product = await fetchProductDataFromUPC(code);

      if (product) {
        setFormData({
          name: product.title || '',
          details: product.description || '',
          category: product.category || '',
          image_url: product.image || '',
        });
        toast.success('✅ Producto encontrado en la base de datos');
      } else {
        toast.error('⚠️ Producto no encontrado. Rellena los datos manualmente.');
        setFormData({ name: '', details: '', category: '', image_url: '' });
      }
    } catch (error) {
      console.error('Error al buscar producto:', error);
      toast.error('❌ Error al buscar el producto');
      setFormData({ name: '', details: '', category: '', image_url: '' });
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!scannedCode) {
      toast.error('No hay código escaneado');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert({
          name: formData.name,
          details: formData.details,
          category: formData.category,
          image_url: formData.image_url,
          codigo: scannedCode,
          status: 'Activo'
        });

      if (error) throw error;

      setSuccessMessage('Producto guardado exitosamente');
      toast.success('✅ Producto guardado correctamente');
      
      // Limpiar formulario después de guardar
      setTimeout(() => {
        setScannedCode('');
        setFormData({ name: '', details: '', category: '', image_url: '' });
        setSuccessMessage('');
        processedCodesRef.current.clear();
      }, 2000);

    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('❌ Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    // Limpiar el estado antes de navegar
    setScannedCode('');
    setFormData({ name: '', details: '', category: '', image_url: '' });
    setSuccessMessage('');
    isProcessingRef.current = false;
    processedCodesRef.current.clear();
    navigate('/');
  };

  const handleScanAnother = () => {
    setScannedCode('');
    setFormData({ name: '', details: '', category: '', image_url: '' });
    isProcessingRef.current = false;
    processedCodesRef.current.clear();
    // Recargar la página para reiniciar el escáner completamente
    window.location.reload();
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Escanear código de barras</h1>
        <button
          onClick={handleGoHome}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
        >
          <span>✕</span>
          Cerrar cámara
        </button>
      </div>
      
      {!scannedCode && <BarcodeScanner onScan={handleScan} />}

      {scannedCode && (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Código escaneado:</strong> {scannedCode}
          </div>

          {successMessage && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              name="name"
              placeholder="Nombre del producto"
              value={formData.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <textarea
              name="details"
              placeholder="Descripción del producto"
              value={formData.details}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded h-20 resize-none"
              rows="3"
            />
            <input
              type="text"
              name="category"
              placeholder="Categoría"
              value={formData.category}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="text"
              name="image_url"
              placeholder="URL de la imagen"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar producto escaneado'}
            </button>
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              onClick={handleScanAnother}
            >
              Escanear otro código
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={handleGoHome}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
