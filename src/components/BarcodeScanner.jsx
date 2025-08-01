// BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { fetchProductDataFromUPC } from '../../api/upcItemDB';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (!isScanning) return;

    const codeReader = new BrowserMultiFormatReader();
    console.log('📸 Iniciando cámara para escanear...');

    // Intentar acceder a la cámara directamente
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        codeReader.decodeFromVideoDevice(null, videoRef.current, async (result, error) => {
          if (result && isScanning) {
            const code = result.getText();
            if (code !== scannedCode) {
              console.log('✅ Código detectado:', code);
              setScannedCode(code);
              setIsScanning(false);
              toast.success(`Código: ${code}`);

              // Llamar a la función onScan con el código escaneado
              if (onScan && typeof onScan === 'function') {
                onScan(code);
              }

              // Detener escaneo y cámara
              codeReader.reset();
              stream.getTracks().forEach((track) => track.stop());
            }
          }
        });
      })
      .catch((err) => {
        console.error('❌ No se pudo acceder a la cámara', err);
        toast.error('No se pudo acceder a la cámara');
      });

    return () => {
      codeReader.reset();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isScanning, scannedCode, onScan]);

  const resetScanner = () => {
    setScannedCode(null);
    setIsScanning(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <video
          ref={videoRef}
          className="rounded-lg border border-gray-300 w-full max-w-md"
          autoPlay
          muted
          playsInline
        />
        <div className="absolute top-2 right-2">
          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Cámara activa
          </div>
        </div>
      </div>
      <p className="text-gray-600 text-sm">
        {scannedCode ? `Código detectado: ${scannedCode}` : 'Escaneando...'}
      </p>
      {scannedCode && (
        <button
          onClick={resetScanner}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Escanear otro código
        </button>
      )}
    </div>
  );
};

export default BarcodeScanner;
