import React from "react";
import QRCode from "react-qr-code";

import {
  Laptop,
  Monitor,
  Printer,
  Phone,
  PcCase,
  Mic,
  Camera,
  Speaker,
  Keyboard,
  Mouse,
  Battery,
  CardSim,
  PlugZap,
  Projector,
  HardDrive,
  Router,
  Box,
  HelpCircle,
  Archive
} from "lucide-react";

const getIcon = (category) => {
  const normalized = (category || "").toLowerCase();

  if (normalized.includes("portátil")) return <Laptop className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("sobremesa")) return <PcCase  className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("monitor")) return <Monitor className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("impresora")) return <Printer className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("micrófono")) return <Mic className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("cámara")) return <Camera className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("altavoz")) return <Speaker className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("teclado")) return <Keyboard className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("ratón")) return <Mouse className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("batería")) return <Battery className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("cargador")) return <PlugZap className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("tarjeta sim")) return <CardSim className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("disco")) return <HardDrive className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("escáner")) return <Archive className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("proyector")) return <Projector className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("router") || normalized.includes("switch")) return <Router className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("móvil")) return <Phone className="w-6 h-6 text-gray-600" />;
  if (normalized.includes("accesorios")) return <Box className="w-6 h-6 text-gray-600" />;

  return <HelpCircle className="w-6 h-6 text-gray-600" />;
};

const AssetCard = ({ asset, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white p-4 border rounded shadow hover:bg-gray-100 cursor-pointer space-y-2"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{asset.name}</h3>
        {getIcon(asset.category)}
      </div>
      <p className="text-sm text-gray-600">
        {asset.brand} – {asset.model}
      </p>
      <p className="text-sm text-gray-500">Serie: {asset.serial_number}</p>
      <p className="text-sm text-blue-600">{asset.category}</p>
      <div className="bg-white p-2 mt-2 flex justify-center">
        <QRCode
          value={`https://inventario-cger.vercel.app/activos/${asset.id}`}
          size={100}
        />
      </div>
    </div>
  );
};

export default AssetCard;
