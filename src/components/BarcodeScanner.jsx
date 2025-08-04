// BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const hasScannedRef = useRef(false);
  const mountedRef = useRef(true);

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
    
    setIsActive(false);
  };

  // Función para forzar la detención de la cámara
  const forceStopCamera = () => {
    console.log('🛑 Forzando detención de cámara...');
    
    // Detener todos los tracks de media
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('Track forzado detenido:', track.kind);
          });
        })
        .catch(err => console.log('No hay streams activos para detener'));
    }
    
    stopCamera();
  };

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      if (!mounted || isActive || hasScannedRef.current) return;

      try {
        console.log('📸 Iniciando cámara para escanear...');
        setIsActive(true);
        
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        codeReader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
          if (result && mounted && !hasScannedRef.current) {
            const code = result.getText();
            console.log('✅ Código detectado:', code);
            
            hasScannedRef.current = true;
            setScannedCode(code);
            setIsActive(false);
            
            // Detener cámara inmediatamente
            stopCamera();
            
            // Notificar al componente padre
            if (onScan && typeof onScan === 'function') {
              onScan(code);
            }
          }
        });
        
      } catch (error) {
        console.error('❌ Error al iniciar la cámara:', error);
        if (mounted) {
          toast.error('No se pudo acceder a la cámara');
          setIsActive(false);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      mountedRef.current = false;
      forceStopCamera();
    };
  }, []); // Sin dependencias para evitar re-renders

  // Cleanup adicional cuando el componente se desmonta
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      forceStopCamera();
    };
  }, []);

  const resetScanner = () => {
    console.log('🔄 Reiniciando escáner...');
    hasScannedRef.current = false;
    setScannedCode(null);
    setIsActive(false);
    
    // Forzar detención antes de reiniciar
    forceStopCamera();
    
    // Recargar la página para un reinicio completo
    setTimeout(() => {
      window.location.reload();
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
            {isActive ? 'Cámara activa' : 'Cámara inactiva'}
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
