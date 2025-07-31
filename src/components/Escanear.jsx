// src/pages/Escanear.jsx
import React, { useState } from 'react';
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const Escanear = () => {
  const [scanned, setScanned] = useState(null);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Escanear producto</h2>
      <div className="bg-white p-4 shadow-md rounded">
        <BarcodeScannerComponent
          width={400}
          height={300}
          onUpdate={(err, result) => {
            if (result) setScanned(result.text);
          }}
        />
        <p className="mt-4 text-center">
          {scanned ? `Código escaneado: ${scanned}` : 'Escanea un código de barras'}
        </p>
      </div>
    </div>
  );
};

export default Escanear;
