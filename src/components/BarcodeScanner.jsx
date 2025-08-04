// BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const stopCamera = () => {
    console.log('🛑 Deteniendo cámara...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('Track detenido:', track.kind);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
        console.log('CodeReader reseteado correctamente');
      } catch (error) {
        console.log('CodeReader ya estaba detenido:', error.message);
      }
      codeReaderRef.current = null;
    }
    
    setIsScanning(false);
  };

  const startCamera = async () => {
    if (isScanning || hasScanned) return;

    try {
      console.log('📸 Iniciando cámara para escanear...');
      setIsScanning(true);
      
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      codeReader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result && !hasScanned) {
          const code = result.getText();
          console.log('✅ Código detectado:', code);
          
          setHasScanned(true);
          toast.success(`Código: ${code}`);

          if (onScan && typeof onScan === 'function') {
            onScan(code);
          }

          // Detener cámara inmediatamente
          stopCamera();
        }
      });
      
    } catch (error) {
      console.error('❌ Error al iniciar la cámara:', error);
      toast.error('No se pudo acceder a la cámara');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!hasScanned) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, []); // Solo se ejecuta una vez al montar

  const resetScanner = () => {
    console.log('🔄 Reiniciando escáner...');
    setHasScanned(false);
    setIsScanning(false);
    // El useEffect no se ejecutará de nuevo porque las dependencias están vacías
    // Necesitamos forzar un re-render
    setTimeout(() => {
      startCamera();
    }, 100);
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
            {isScanning ? 'Cámara activa' : 'Cámara inactiva'}
          </div>
        </div>
      </div>
      <p className="text-gray-600 text-sm">
        {hasScanned ? 'Código detectado' : 'Escaneando...'}
      </p>
      {hasScanned && (
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
