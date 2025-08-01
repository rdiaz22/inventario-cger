// BarcodeScanner.jsx (actualizado y listo para probar)
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { fetchProductDataFromUPC } from '../api/upcItemDB';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onDetected }) => {
  const videoRef = useRef(null);
  const [scannedCode, setScannedCode] = useState(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    console.log('📸 Iniciando cámara para escanear...');

    codeReader.listVideoInputDevices()
      .then((videoInputDevices) => {
        const selectedDeviceId = videoInputDevices[0]?.deviceId;
        if (!selectedDeviceId) {
          console.error('🚫 No se encontró cámara disponible.');
          toast.error('No se encontró cámara');
          return;
        }

        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          async (result, error) => {
            if (result) {
              const code = result.getText();
              console.log('✅ Código detectado:', code);
              setScannedCode(code);
              toast.success(`Código: ${code}`);

              // Busca info en API externa y llama a función padre
              const productData = await fetchProductDataFromUPC(code);
              if (productData) {
                onDetected(productData);
              }

              codeReader.reset();
            }
            if (error) {
              // Evitamos spam de errores en consola
            }
          }
        );
      })
      .catch((err) => {
        console.error('❌ Error accediendo a cámara:', err);
        toast.error('Error accediendo a cámara');
      });

    return () => {
      codeReader.reset();
    };
  }, [onDetected]);

  return (
    <div className="flex flex-col items-center gap-4">
      <video
        ref={videoRef}
        className="rounded-lg border border-gray-300 w-full max-w-md"
        autoPlay
        muted
        playsInline
      />
      <p className="text-gray-600 text-sm">
        {scannedCode ? `Código detectado: ${scannedCode}` : 'Escaneando...'}
      </p>
    </div>
  );
};

export default BarcodeScanner;
