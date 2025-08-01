// src/pages/ScanPage.jsx
import React, { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';

const ScanPage = () => {
  const [result, setResult] = useState('');

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Escanear Producto</h2>
      <BarcodeScanner onScan={(data) => setResult(data)} />
      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
          <p><strong>Código detectado:</strong> {result}</p>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
