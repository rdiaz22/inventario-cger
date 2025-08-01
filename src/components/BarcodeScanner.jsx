import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';
import { fetchProductDataFromUPC } from '../api/upcItemDB';

const BarcodeScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const [error, setError] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    const startScanner = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setError('No se encontraron cámaras');
          return;
        }

        const selectedDeviceId = devices[0].deviceId;

        codeReader.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          async (result, err) => {
            if (result) {
              const code = result.getText();
              codeReader.current.reset(); // Detener escaneo tras detectar código
              setScannedCode(code);

              try {
                const data = await fetchProductDataFromUPC(code);
                setProductInfo(data); // Mostrar producto
              } catch (apiError) {
                console.error('Error buscando producto:', apiError);
                setError('Producto no encontrado');
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error('Error escaneando:', err);
              setError('Error escaneando código');
            }
          }
        );
      } catch (err) {
        console.error('Error accediendo a la cámara:', err);
        setError('Permiso denegado o cámara no disponible');
      }
    };

    startScanner();

    return () => {
      codeReader.current.reset();
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center mt-4">
      {error && <p className="text-red-500">{error}</p>}
      <video ref={videoRef} className="rounded-lg w-full max-w-md shadow-md" />

      {scannedCode && (
        <div className="mt-6 w-full max-w-md p-4 border border-gray-300 rounded-md shadow-md bg-white">
          <h3 className="font-semibold text-lg mb-2">Producto detectado:</h3>
          <p><strong>Código:</strong> {scannedCode}</p>
          {productInfo ? (
            <>
              <p><strong>Nombre:</strong> {productInfo.title || 'Sin nombre'}</p>
              <p><strong>Marca:</strong> {productInfo.brand || 'Desconocida'}</p>
              <p><strong>Descripción:</strong> {productInfo.description || 'N/A'}</p>
              <button
                onClick={() => onScan({ code: scannedCode, ...productInfo })}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Guardar producto escaneado
              </button>
            </>
          ) : (
            <p className="text-yellow-600 mt-2">Buscando información del producto...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
