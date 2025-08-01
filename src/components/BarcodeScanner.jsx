// BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const stopCamera = () => {
    console.log('🛑 Deteniendo cámara...');
    
    // Detener el stream de la cámara
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('Track detenido:', track.kind);
      });
      streamRef.current = null;
    }

    // Limpiar el video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Resetear el codeReader de forma segura
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
        console.log('CodeReader reseteado correctamente');
      } catch (error) {
        console.log('CodeReader ya estaba detenido o no es válido');
      }
      codeReaderRef.current = null;
    }
  };

  const startCamera = async () => {
    if (isInitialized) return;

    try {
      console.log('📸 Iniciando cámara para escanear...');
      
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Configurar el callback de detección
      codeReader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result && isScanning) {
          const code = result.getText();
          console.log('✅ Código detectado:', code);
          
          // Evitar múltiples detecciones del mismo código
          if (code !== scannedCode) {
            setScannedCode(code);
            setIsScanning(false);
            toast.success(`Código: ${code}`);

            // Llamar a la función onScan con el código escaneado
            if (onScan && typeof onScan === 'function') {
              onScan(code);
            }

            // Detener cámara después de detectar
            setTimeout(() => {
              stopCamera();
            }, 100);
          }
        }
      });

      setIsInitialized(true);
      
    } catch (error) {
      console.error('❌ Error al iniciar la cámara:', error);
      toast.error('No se pudo acceder a la cámara');
    }
  };

  useEffect(() => {
    if (isScanning && !isInitialized) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isScanning, isInitialized]);

  const resetScanner = () => {
    console.log('🔄 Reiniciando escáner...');
    setScannedCode(null);
    setIsScanning(true);
    setIsInitialized(false);
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
            {isScanning ? 'Cámara activa' : 'Cámara detenida'}
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
