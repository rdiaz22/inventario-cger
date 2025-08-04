// BarcodeScanner.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);

  const stopCamera = useCallback(() => {
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
  }, []);

  const handleScan = useCallback((code) => {
    if (scannedCode === code) {
      console.log('⚠️ Código ya procesado, ignorando...');
      return;
    }
    
    console.log('✅ Código detectado:', code);
    setScannedCode(code);
    setIsScanning(false);
    
    // Detener cámara inmediatamente
    stopCamera();
    
    // Notificar al componente padre
    if (onScan && typeof onScan === 'function') {
      onScan(code);
    }
  }, [scannedCode, onScan, stopCamera]);

  const startCamera = useCallback(async () => {
    if (isInitialized || isScanning) {
      console.log('⚠️ Cámara ya inicializada o escaneando...');
      return;
    }

    try {
      console.log('📸 Iniciando cámara para escanear...');
      setIsScanning(true);
      setIsInitialized(true);
      
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
        if (result && !scannedCode) {
          const code = result.getText();
          handleScan(code);
        }
      });
      
    } catch (error) {
      console.error('❌ Error al iniciar la cámara:', error);
      toast.error('No se pudo acceder a la cámara');
      setIsScanning(false);
      setIsInitialized(false);
    }
  }, [isInitialized, isScanning, scannedCode, handleScan]);

  useEffect(() => {
    if (!isInitialized && !scannedCode) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isInitialized, scannedCode, startCamera, stopCamera]);

  const resetScanner = useCallback(() => {
    console.log('🔄 Reiniciando escáner...');
    setScannedCode(null);
    setIsInitialized(false);
    setIsScanning(false);
    
    // Limpiar y reiniciar después de un breve delay
    setTimeout(() => {
      startCamera();
    }, 500);
  }, [startCamera]);

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
