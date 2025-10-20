import React, { useEffect, useState } from "react";
import { FaEye, FaPrint } from "react-icons/fa";
// import { useNavigate } from "react-router-dom"; // Eliminar esta línea
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import bwipjs from "bwip-js";
import { toDataURL } from 'qrcode'; // Agregar esta importación
import { getSignedUrlIfNeeded, getThumbnailPublicUrl } from "../utils/storage";

const AssetCard = ({ asset, onClick }) => { // Agregar onClick como prop
  // const navigate = useNavigate(); // Eliminar esta línea
  const [showQR, setShowQR] = useState(false);
  const [dymoHeightMm, setDymoHeightMm] = useState(12); // altura configurable: 7, 12, 18
  const [barcodeFormat, setBarcodeFormat] = useState("CODE128"); // formato de código de barras
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  // Eliminar handleCardClick

  const handlePrint = async (e) => {
    e.stopPropagation();
    const qrValue = `${window.location.origin}/activos/${asset.id}`;
    // Generar QR más grande para mejor definición
    const qrDataUrl = await toDataURL(qrValue, { width: 200, margin: 1 });

    const pdf = new jsPDF({
      orientation: "landscape", // horizontal
      unit: "mm",
      format: [60, 40],
    });

    // Centrar el QR (20mm de ancho, centrado en 60mm)
    pdf.addImage(qrDataUrl, "PNG", 20, 5, 20, 20);

    // Centrar el código (ancho total 60mm)
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(asset.codigo || '', 30, 30, { align: 'center' });

    // Centrar el texto de propiedad
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text("Propiedad de CGER, La Palma", 30, 35, { align: 'center' });

    pdf.save(`etiqueta-${asset.codigo}.pdf`);
  };

  // Impresión específica para etiqueta DYMO 24mm x H mm
  const handlePrintDymo = async (e) => {
    e.stopPropagation();

    // Dimensiones de la etiqueta en mm
    const labelWidthMm = 24;
    const labelHeightMm = Number(dymoHeightMm || 12);

    // Crear PDF con tamaño exacto de la etiqueta
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [labelWidthMm, labelHeightMm],
    });

    // Generar símbolo en un canvas
    const canvas = document.createElement("canvas");
    const barcodeValue = asset.codigo || String(asset.id || "");

    let barcodeDataUrl = "";
    // Objetivo de alta resolución para impresoras térmicas (mejor definición)
    const targetDpi = 600; // 300-600; usamos 600 para mayor nitidez
    const pxPerMm = targetDpi / 25.4;
    const targetPxWidth = Math.max(200, Math.round(labelWidthMm * pxPerMm));
    const targetPxHeight = Math.max(80, Math.round(labelHeightMm * pxPerMm));
    if (barcodeFormat === "DATAMATRIX") {
      // Data Matrix rectangular optimizado para 24x12mm
      // Nota: usar contenido corto para reducir módulos
      bwipjs.toCanvas(canvas, {
        bcid: 'datamatrix',
        text: barcodeValue,
        // módulos pequeños para caber en 12mm de alto
        scale: 2, // escala del módulo
        rows: 16, // sugerido; bwip puede ajustar
        columns: 48,
        includetext: false,
        padding: 8, // quiet zone
        backgroundcolor: 'FFFFFF',
        monochrome: true
      });
      barcodeDataUrl = canvas.toDataURL('image/png');
    } else {
      // Configuración optimizada según el formato elegido (lineal)
      const barcodeConfig = {
        format: barcodeFormat,
        displayValue: false,
        background: "#ffffff",
        lineColor: "#000000",
        fontSize: 0,
        textMargin: 0
      };

      switch (barcodeFormat) {
        case "CODE128":
          Object.assign(barcodeConfig, {
            // Quiet zone ~1.2mm
            margin: Math.round(1.2 * pxPerMm),
            // Altura usable ~80% de la etiqueta
            height: Math.round(targetPxHeight * 0.8),
            // x-dimension ~0.25mm para móvil
            width: Math.max(3, Math.round(0.25 * pxPerMm))
          });
          break;
        case "CODE39":
          Object.assign(barcodeConfig, {
            margin: Math.round(1.0 * pxPerMm),
            height: Math.round(targetPxHeight * 0.8),
            width: Math.max(3, Math.round(0.28 * pxPerMm))
          });
          break;
        case "EAN13":
          Object.assign(barcodeConfig, {
            margin: Math.round(1.4 * pxPerMm),
            height: Math.round(targetPxHeight * 0.75),
            width: Math.max(2, Math.round(0.22 * pxPerMm))
          });
          break;
        case "EAN8":
          Object.assign(barcodeConfig, {
            margin: Math.round(1.2 * pxPerMm),
            height: Math.round(targetPxHeight * 0.78),
            width: Math.max(2, Math.round(0.24 * pxPerMm))
          });
          break;
        default:
          Object.assign(barcodeConfig, {
            margin: Math.round(1.2 * pxPerMm),
            height: Math.round(targetPxHeight * 0.8),
            width: Math.max(3, Math.round(0.25 * pxPerMm))
          });
      }

      // Ajustar el tamaño del canvas para alta resolución antes de dibujar
      canvas.width = targetPxWidth;
      canvas.height = Math.round(targetPxHeight * 0.85);
      JsBarcode(canvas, barcodeValue, barcodeConfig);
      barcodeDataUrl = canvas.toDataURL("image/png");
    }

    // Márgenes optimizados para mejor escaneo
    const marginX = labelHeightMm >= 12 ? 1.0 : 0.8;
    const marginY = labelHeightMm >= 12 ? 0.6 : 0.4;

    // Área útil
    const usableWidth = labelWidthMm - marginX * 2;
    const usableHeight = labelHeightMm - marginY * 2;

    // Añadir barcode ocupando casi toda el área útil; priorizar contraste y escala
    // Para mejorar nitidez en impresión, renderizamos imagen fuente a alta resolución
    pdf.addImage(barcodeDataUrl, "PNG", marginX, marginY, usableWidth, usableHeight * 0.82);

    // Texto opcional: si es Data Matrix, texto más pequeño para dejar más área al símbolo
    const textSize = barcodeFormat === 'DATAMATRIX'
      ? (labelHeightMm >= 12 ? 2.8 : 2.4)
      : (labelHeightMm >= 18 ? 4.0 : labelHeightMm >= 12 ? 3.5 : 3.0);
    pdf.setFontSize(textSize);
    pdf.setFont(undefined, "bold");
    pdf.text(barcodeValue, labelWidthMm / 2, labelHeightMm - 0.8, { align: "center" });

    pdf.save(`dymo-${barcodeValue}.pdf`);
  };

  const [imageResolvedUrl, setImageResolvedUrl] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");

  useEffect(() => {
    // Estrategia confiable: usa URL firmada (o pública) sin transform, que sabemos funciona
    const resolve = async () => {
      const url = await getSignedUrlIfNeeded(asset.image_url);
      setThumbUrl(url);
      setImageResolvedUrl(url);
    };
    resolve();
  }, [asset.image_url]);

  const placeholderDataUrl =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="#9ca3af">Sin imagen</text></svg>`
    );

  return (
    <div
      onClick={onClick} // Usar la prop onClick
      className="cursor-pointer rounded-xl border shadow-sm hover:shadow-md transition-shadow p-4 bg-white flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full min-w-0"
    >
      {/* Imagen */}
      <img
        src={thumbUrl || placeholderDataUrl}
        alt={asset.name}
        width={128}
        height={128}
        loading="lazy"
        decoding="async"
        className="w-full sm:w-32 h-32 object-cover rounded-md flex-shrink-0 bg-gray-100 transition-opacity duration-200 opacity-0"
        onLoad={(e)=> e.currentTarget.classList.remove('opacity-0')}
        onError={(e) => {
          if (e?.currentTarget?.src !== placeholderDataUrl) {
            e.currentTarget.src = placeholderDataUrl;
          }
        }}
      />

      {/* Info */}
      <div className="flex flex-col flex-1 gap-1 text-center sm:text-left w-full min-w-0">
        <h2 className="text-lg font-semibold truncate">{asset.name}</h2>
        <p className="text-sm text-gray-600 truncate">{asset.details}</p>
        <span className="text-xs bg-gray-200 px-2 py-1 rounded inline-block w-fit">
          {asset.codigo}
        </span>
      </div>

      {/* Acciones */}
      <div className="relative flex flex-col items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowQR(!showQR);
          }}
          className="text-sm text-blue-500 hover:underline flex items-center gap-1 whitespace-nowrap"
        >
          <FaEye />
          Ver QR
        </button>
        <button
          onClick={handlePrint}
          className="text-sm text-green-600 hover:underline flex items-center gap-1 whitespace-nowrap"
        >
          <FaPrint />
          Imprimir
        </button>
        {/* Selector de tamaño para DYMO */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Alto etiqueta:</span>
          <select
            value={dymoHeightMm}
            onChange={(e) => setDymoHeightMm(Number(e.target.value))}
            className="text-xs border rounded px-1 py-0.5"
          >
            <option value={7}>7 mm</option>
            <option value={12}>12 mm</option>
            <option value={18}>18 mm</option>
          </select>
        </div>
        <button
          onClick={() => setShowPrintOptions(!showPrintOptions)}
          className="text-sm text-purple-600 hover:underline flex items-center gap-1 whitespace-nowrap"
        >
          <FaPrint />
          DYMO 24x{dymoHeightMm} mm
        </button>
        
        {/* Opciones avanzadas de impresión */}
        {showPrintOptions && (
          <div className="absolute top-full right-0 mt-2 bg-white border rounded-lg shadow-lg p-3 z-10 min-w-64">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Formato de código de barras:
                </label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value)}
                  className="w-full text-xs border rounded px-2 py-1"
                >
                  <option value="CODE128">CODE128 (Recomendado)</option>
                  <option value="CODE39">CODE39</option>
                  <option value="EAN13">EAN13</option>
                  <option value="EAN8">EAN8</option>
                  <option value="DATAMATRIX">Data Matrix (12mm)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Altura de etiqueta:
                </label>
                <select
                  value={dymoHeightMm}
                  onChange={(e) => setDymoHeightMm(Number(e.target.value))}
                  className="w-full text-xs border rounded px-2 py-1"
                >
                  <option value={7}>7 mm (Muy pequeña)</option>
                  <option value={12}>12 mm (Estándar)</option>
                  <option value={18}>18 mm (Grande)</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handlePrintDymo}
                  className="flex-1 bg-purple-600 text-white text-xs px-3 py-2 rounded hover:bg-purple-700"
                >
                  Imprimir
                </button>
                <button
                  onClick={() => setShowPrintOptions(false)}
                  className="flex-1 bg-gray-300 text-gray-700 text-xs px-3 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
              
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <strong>Consejos:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• CODE128 es el más legible para escáneres</li>
                  <li>• Etiquetas de 12mm+ tienen mejor escaneo</li>
                  <li>• Mantén la impresora limpia</li>
                  <li>• Para 12mm, prueba Data Matrix</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Etiqueta QR para impresión */}
      {showQR && (
        <div
          id={`label-${asset.id}`}
          style={{
            width: 300,
            height: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ccc",
            background: "#fff",
            padding: 16,
            boxSizing: "border-box",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <QRCode value={`${window.location.origin}/activos/${asset.id}`} size={150} />
          <p style={{ margin: "8px 0 0 0", fontSize: 16, fontWeight: "bold", letterSpacing: 1 }}>
            {asset.codigo}
          </p>
          <p style={{ margin: 0, fontSize: 12 }}>Propiedad de CGER, La Palma</p>
        </div>
      )}
    </div>
  );
};

export default AssetCard;
