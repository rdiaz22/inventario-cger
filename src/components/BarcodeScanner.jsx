// BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { fetchProductDataFromUPC } from '../api/upcItemDB';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onDetected }) => {
  const videoRef = useRef(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [reader, setReader] = useState(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    setReader(codeReader);
    console.log('📸 Iniciando cámara para escanear...');

    // Intentar acceder a la cámara directamente
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        codeReader.decodeFromVideoDevice(null, videoRef.current, async (result, error) => {
          if (result) {
            const code = result.getText();
            if (code !== scannedCode) {
              console.log('✅ Código detectado:', code);
              setScannedCode(code);
              toast.success(`Código: ${code}`);

              const productData = await fetchProductDataFromUPC(code);
              if (productData) {
                onDetected(productData);
              }

              codeReader.reset(); // Detener escaneo tras encontrar código
              stream.getTracks().forEach((track) => track.stop()); // Apagar cámara
            }
          }
        });
      })
      .catch((err) => {
        console.error('❌ No se pudo acceder a la cámara', err);
        toast.error('No se pudo acceder a la cámara');
      });

    return () => {
      if (reader) {
        reader.reset();
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onDetected, scannedCode]);

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
