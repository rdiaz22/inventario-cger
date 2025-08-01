import React, { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { fetchProductDataFromUPC } from '../../api/upcItemDB';

const ScanPage = () => {
  const [scannedCode, setScannedCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    details: '',
    category: '',
    image_url: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handleScan = async (code) => {
    setScannedCode(code);
    setSuccessMessage('');

    const product = await fetchProductDataFromUPC(code);

    if (product) {
      setFormData({
        name: product.title || '',
        details: product.description || '',
        category: product.category || '',
        image_url: product.image || '',
      });
    } else {
      toast.error('⚠️ Producto no encontrado. Rellena los datos manualmente.');
      setFormData({ name: '', details: '', category: '', image_url: '' });
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const { name, details, category, image_url } = formData;

    const { error } = await supabase.from('assets').insert([
      {
        codigo: scannedCode,
        name,
        details,
        category,
        image_url,
      },
    ]);

    if (error) {
      console.error('Error guardando en Supabase:', error.message);
      toast.error('❌ Error al guardar el producto.');
    } else {
      toast.success('✅ Producto guardado correctamente');
      setScannedCode('');
      setFormData({ name: '', details: '', category: '', image_url: '' });
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Escanear código de barras</h1>
      {!scannedCode && <BarcodeScanner onScan={handleScan} />}

      {scannedCode && (
        <div className="bg-white rounded p-4 shadow mt-4">
          <p className="text-sm mb-2">Código escaneado:</p>
          <input
            className="border px-2 py-1 w-full mb-2"
            value={scannedCode}
            readOnly
          />
          <input
            className="border px-2 py-1 w-full mb-2"
            name="name"
            placeholder="Nombre del producto"
            value={formData.name}
            onChange={handleChange}
          />
          <textarea
            className="border px-2 py-1 w-full mb-2"
            name="details"
            placeholder="Descripción"
            value={formData.details}
            onChange={handleChange}
          />
          <input
            className="border px-2 py-1 w-full mb-2"
            name="category"
            placeholder="Categoría"
            value={formData.category}
            onChange={handleChange}
          />
          <input
            className="border px-2 py-1 w-full mb-2"
            name="image_url"
            placeholder="URL de imagen"
            value={formData.image_url}
            onChange={handleChange}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Guardar producto escaneado
          </button>
        </div>
      )}

      {successMessage && (
        <p className="mt-4 text-green-600 font-medium">{successMessage}</p>
      )}
    </div>
  );
};

export default ScanPage;
