import React, { useState } from 'react';
import { FaInfoCircle, FaPrint, FaCamera, FaCheckCircle } from 'react-icons/fa';

const PrintingTips = () => {
  const [showTips, setShowTips] = useState(false);

  const tips = [
    {
      icon: <FaPrint className="text-blue-500" />,
      title: "Configuración de Impresora",
      items: [
        "Usa etiquetas de 24mm x 12mm o más grandes",
        "Ajusta la densidad de impresión al máximo",
        "Limpia regularmente el cabezal de impresión",
        "Usa papel de calidad para mejor contraste"
      ]
    },
    {
      icon: <FaCamera className="text-green-500" />,
      title: "Mejores Prácticas de Escaneo",
      items: [
        "Mantén el código a 10-15cm de la cámara",
        "Asegúrate de que haya buena iluminación",
        "Evita reflejos y sombras",
        "Mantén el código recto y plano"
      ]
    },
    {
      icon: <FaCheckCircle className="text-purple-500" />,
      title: "Formatos Recomendados",
      items: [
        "CODE128: Mejor para códigos alfanuméricos",
        "CODE39: Bueno para códigos cortos",
        "EAN13/EAN8: Solo para códigos numéricos",
        "Evita QR en etiquetas de 24mm"
      ]
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowTips(!showTips)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <FaInfoCircle />
        Consejos de Impresión
      </button>

      {showTips && (
        <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-20 min-w-80 max-w-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Consejos para Mejor Escaneo</h3>
              <button
                onClick={() => setShowTips(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {tips.map((tip, index) => (
              <div key={index} className="border-l-4 border-gray-200 pl-3">
                <div className="flex items-center gap-2 mb-2">
                  {tip.icon}
                  <h4 className="font-medium text-gray-700">{tip.title}</h4>
                </div>
                <ul className="space-y-1">
                  {tip.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-start gap-2">
                <FaInfoCircle className="text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Problema común:</strong> Si el escáner no lee el código, 
                  prueba con una etiqueta más grande (18mm) o ajusta la distancia de escaneo.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintingTips;
