import React, { useState } from "react";
import { FaEye, FaPrint } from "react-icons/fa";
// import { useNavigate } from "react-router-dom"; // Eliminar esta línea
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toDataURL } from 'qrcode'; // Agregar esta importación

const AssetCard = ({ asset, onClick }) => { // Agregar onClick como prop
  // const navigate = useNavigate(); // Eliminar esta línea
  const [showQR, setShowQR] = useState(false);

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

  return (
    <div
      onClick={onClick} // Usar la prop onClick
      className="cursor-pointer rounded-xl border shadow-sm hover:shadow-md transition-shadow p-4 bg-white flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full"
    >
      {/* Imagen */}
      <img
        src={asset.image_url}
        alt={asset.nombre}
        className="w-full sm:w-32 h-32 object-cover rounded-md"
      />

      {/* Info */}
      <div className="flex flex-col flex-1 gap-1 text-center sm:text-left w-full">
        <h2 className="text-lg font-semibold truncate">{asset.nombre}</h2>
        <p className="text-sm text-gray-600 truncate">{asset.descripcion}</p>
        <span className="text-xs bg-gray-200 px-2 py-1 rounded inline-block w-fit">
          {asset.codigo}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowQR(!showQR);
          }}
          className="text-sm text-blue-500 hover:underline flex items-center gap-1"
        >
          <FaEye />
          Ver QR
        </button>
        <button
          onClick={handlePrint}
          className="text-sm text-green-600 hover:underline flex items-center gap-1"
        >
          <FaPrint />
          Imprimir
        </button>
      </div>

      {/* Etiqueta QR para impresión */}
      {showQR && (
        <div
          id={`label-${asset.id}`}
          style={{
            width: 180,
            height: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ccc",
            background: "#fff",
            padding: 8,
            boxSizing: "border-box"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <QRCode value={`${window.location.origin}/activos/${asset.id}`} size={64} />
          <p style={{ margin: "4px 0 0 0", fontSize: 14, fontWeight: "bold", letterSpacing: 1 }}>
            {asset.codigo}
          </p>
          <p style={{ margin: 0, fontSize: 10 }}>Propiedad de CGER, La Palma</p>
        </div>
      )}
    </div>
  );
};

export default AssetCard;
