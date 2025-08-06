import React, { useState } from "react";
import Modal from "react-modal";
import ModalEditar from "./ModalEditar";

Modal.setAppElement("#root");

const DrawerDetalle = ({ asset, onClose, onUpdated }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Debug: ver qué datos recibe el componente
  console.log("DrawerDetalle recibió asset:", asset);
  console.log("Campos específicos en DrawerDetalle:", {
    name: asset?.name,
    brand: asset?.brand,
    model: asset?.model,
    details: asset?.details,
    status: asset?.status,
    assigned_to: asset?.assigned_to,
    supplier: asset?.supplier,
    fabricante: asset?.fabricante,
    certificacion: asset?.certificacion
  });

  if (!asset) return null;

  const DetailItem = ({ label, value }) => (
    <div className="flex flex-col border rounded p-3 bg-gray-50">
      <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
      <span className="text-sm text-gray-800">{value || "No disponible"}</span>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-end z-50">
        <div className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">🔎 Detalle del Activo</h2>
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
          {asset.image_url && (
            <div className="relative mb-4">
              <img
                src={asset.image_url}
                alt="Foto del activo"
                className="w-full h-auto rounded shadow-md"
              />
              <button
                onClick={() => setIsImageModalOpen(true)}
                className="absolute bottom-2 right-2 bg-white bg-opacity-80 text-gray-800 p-1 rounded-full shadow hover:bg-opacity-100"
                title="Ampliar imagen"
              >
                🔍
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 text-sm">
            <DetailItem label="Nombre" value={asset.name} />
            <DetailItem label="Categoría" value={asset.category || "No definida"} />
            <DetailItem label="Marca" value={asset.brand} />
            <DetailItem label="Modelo" value={asset.model} />
            <DetailItem label="Descripción" value={asset.details} />
            <DetailItem label="Número de Serie" value={asset.serial_number} />
            <DetailItem label="Asignado a" value={asset.assigned_to} />
            <DetailItem label="Estado" value={asset.status} />
            <DetailItem label="Código" value={asset.codigo || "No definido"} />
            <DetailItem
              label="Fecha de Compra"
              value={
                asset.fecha_compra
                  ? new Date(asset.fecha_compra).toLocaleDateString("es-ES")
                  : "No registrada"
              }
            />
            <DetailItem
              label="Fecha de Garantía"
              value={
                asset.fecha_garantia
                  ? new Date(asset.fecha_garantia).toLocaleDateString("es-ES")
                  : "No registrada"
              }
            />
            <DetailItem
              label="Precio de Compra"
              value={
                asset.precio_compra
                  ? `${parseFloat(asset.precio_compra).toFixed(2)} €`
                  : "No registrado"
              }
            />
            
            {/* Información específica de EPIs */}
            {asset.category === "EPI" && (
              <>
                <DetailItem label="Proveedor" value={asset.supplier} />
                
                {/* Mostrar tallas y unidades */}
                {asset.tallas && asset.tallas.length > 0 && (
                  <div className="border rounded p-3 bg-gray-50">
                    <span className="text-xs font-medium text-gray-500 uppercase block mb-2">
                      Tallas y Unidades
                    </span>
                    <div className="space-y-1">
                      {asset.tallas.map((talla, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="font-medium">Talla {talla.size}:</span>
                          <span className="text-blue-600 font-bold">{talla.units} unidades</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-6 text-right">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
              onClick={() => setIsEditOpen(true)}
            >
              ✏️ Editar activo
            </button>
          </div>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      <Modal
        isOpen={isImageModalOpen}
        onRequestClose={() => setIsImageModalOpen(false)}
        contentLabel="Imagen Ampliada"
        overlayClassName="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center"
        className="relative bg-white rounded shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto p-4 outline-none"
      >
        <button
          onClick={() => setIsImageModalOpen(false)}
          className="absolute top-2 right-2 text-gray-700 hover:text-black text-2xl z-10"
          aria-label="Cerrar"
        >
          ✕
        </button>
        <img
          src={asset.image_url}
          alt="Imagen ampliada"
          className="w-full h-auto"
        />
      </Modal>


      {isEditOpen && (
        <ModalEditar
          asset={asset}
          onClose={() => setIsEditOpen(false)}
          onUpdated={() => {
            setIsEditOpen(false);
            onUpdated();
            onClose();
          }}
        />
      )}
    </>
  );
};

export default DrawerDetalle;
