import React, { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { fetchProductDataFromUPC } from '../api/upcItemDB';

const ScanPage = () => {
  const [scannedCode, setScannedCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handleScan = async (code) => {
    setScannedCode(code);
    setSuccessMessage('');
  
    const product = await fetchProductDataFromUPC(code);
  
    if (product) {
      setFormData({
        name: product.title || '',
        description: product.description || '',
        category: product.category || '',
      });
    } else {
      toast.error('⚠️ Producto no encontrado. Rellena los datos manualmente.');
      setFormData({ name: '', description: '', category: '' });
    }
  };
  
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const { name, description, category } = formData;

    const { data, error } = await supabase.from('assets').insert([
      {
        code: scannedCode,
        name,
        description,
        category,
      },
    ]);

    if (error) {
      console.error('Error guardando en Supabase:', error.message);
      toast.error('❌ Error al guardar el producto.');
    } else {
      toast.success('✅ Producto guardado correctamente');
      setScannedCode('');
      setFormData({ name: '', description: '', category: '' });
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
            name="description"
            placeholder="Descripción"
            value={formData.description}
            onChange={handleChange}
          />
          <input
            className="border px-2 py-1 w-full mb-2"
            name="category"
            placeholder="Categoría"
            value={formData.category}
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
