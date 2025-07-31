import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabaseClient';

const BarcodeScanner = () => {
  const [scannedCode, setScannedCode] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [status, setStatus] = useState('');
  const qrRef = useRef();

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        html5QrCode.stop();
        setScannedCode(decodedText);
      },
      (error) => {}
    ).catch((err) => console.error("QR error:", err));

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!scannedCode) return;

    const fetchProduct = async () => {
      setStatus('🔍 Buscando producto...');
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${scannedCode}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setProductInfo(data.items[0]);
        setStatus('');
      } else {
        setStatus('⚠️ Producto no encontrado en base pública');
      }
    };

    fetchProduct();
  }, [scannedCode]);

  const guardarActivo = async () => {
    if (!productInfo) return;

    const { title, brand, category, images } = productInfo;

    const { error } = await supabase.from('assets').insert([{
      codigo: scannedCode,
      name: title,
      brand: brand || '',
      category: category || 'Sin categoría',
      image_url: images?.[0] || null,
      status: 'Disponible',
      details: 'Agregado por escaneo',
      publico: true
    }]);

    if (error) {
      setStatus('❌ Error al guardar en Supabase');
      console.error(error);
    } else {
      setStatus('✅ Activo guardado con éxito');
    }
  };

  return (
    <div className="p-4">
      {!scannedCode && (
        <div id="qr-reader" className="w-full h-64 rounded border border-gray-300" />
      )}

      {status && <p className="mt-2 text-sm text-blue-600">{status}</p>}

      {productInfo && (
        <div className="mt-4 bg-white p-4 rounded shadow text-left">
          <img src={productInfo.images?.[0]} alt={productInfo.title} className="w-24 h-24 object-contain mb-2" />
          <h2 className="font-bold text-lg">{productInfo.title}</h2>
          <p className="text-sm">Marca: {productInfo.brand}</p>
          <p className="text-sm">Categoría: {productInfo.category || 'Sin categoría'}</p>
          <p className="text-sm">Código: {scannedCode}</p>
          <button
            onClick={guardarActivo}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Guardar como activo
          </button>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
