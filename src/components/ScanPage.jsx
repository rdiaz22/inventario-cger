import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import toast from 'react-hot-toast';

const ScanPage = () => {
  const navigate = useNavigate();
  const [scannedCode, setScannedCode] = useState('');
  const [scannedCodes, setScannedCodes] = useState([]);
  const processedCodesRef = useRef(new Set());

  const handleScan = async (code) => {
    console.log('🔍 Código escaneado:', code);
    
    // Evitar procesar el mismo código múltiples veces
    if (processedCodesRef.current.has(code)) {
      console.log('⚠️ Código ya procesado, ignorando...');
      return;
    }
    
    processedCodesRef.current.add(code);
    setScannedCode(code);
    
    // Agregar a la lista de códigos escaneados
    const newCode = {
      id: Date.now(),
      code: code,
      timestamp: new Date().toLocaleString('es-ES'),
      type: code.length > 10 ? 'Código de barras' : 'Código QR'
    };
    
    setScannedCodes(prev => [newCode, ...prev]);
    toast.success(`✅ Código escaneado: ${code}`);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  const handleGoHome = () => {
    setScannedCode('');
    processedCodesRef.current.clear();
    navigate('/');
  };

  const handleScanAnother = () => {
    setScannedCode('');
    processedCodesRef.current.clear();
    // Recargar la página para reiniciar el escáner completamente
    window.location.reload();
  };

  const handleClearHistory = () => {
    setScannedCodes([]);
    toast.success('Historial limpiado');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Escanear códigos QR</h1>
        <button
          onClick={handleGoHome}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
        >
          <span>✕</span>
          Cerrar cámara
        </button>
      </div>
      
      {!scannedCode && (
        <div className="space-y-4">
          <BarcodeScanner onScan={handleScan} />
          <p className="text-center text-gray-600">
            Apunta la cámara hacia un código QR o código de barras
          </p>
        </div>
      )}

      {scannedCode && (
        <div className="space-y-4">
          {/* Código actual escaneado */}
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <div className="flex justify-between items-center">
              <div>
                <strong>Código escaneado:</strong> {scannedCode}
              </div>
              <button
                onClick={() => copyToClipboard(scannedCode)}
                className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
              >
                Copiar
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={handleScanAnother}
            >
              Escanear otro código
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={handleGoHome}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

      {/* Historial de códigos escaneados */}
      {scannedCodes.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Historial de códigos escaneados</h2>
            <button
              onClick={handleClearHistory}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Limpiar historial
            </button>
          </div>
          
          <div className="space-y-3">
            {scannedCodes.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">{item.type}</span>
                      <span className="text-xs text-gray-400">{item.timestamp}</span>
                    </div>
                    <div className="font-mono text-lg break-all">{item.code}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.code)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 ml-2"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
