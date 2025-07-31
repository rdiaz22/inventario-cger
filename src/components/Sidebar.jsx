import React, { useState } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import {
  Package,
  Layers,
  Settings,
  ClipboardList,
  Wrench,
  CalendarCheck,
  Box,
  Home,
  ScanBarcode,
  Menu,
  X,
} from "lucide-react";

const Sidebar = ({ onCategoriasClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Inicio", icon: <Home className="h-4 w-4" />, path: "/" },
    { name: "Activos", icon: <Package className="h-4 w-4" />, path: "/activos" },
    { name: "Préstamos", icon: <CalendarCheck size={18} />, path: "/prestamos" },
    { name: "Mantenimiento", icon: <Wrench size={18} />, path: "/mantenimiento" },
    { name: "Auditorías", icon: <ClipboardList size={18} />, path: "/auditorias" },
    { name: "Configuración", icon: <Settings className="h-4 w-4" />, path: "/configuracion" },
    { name: "Categorías", icon: <Layers className="h-4 w-4" />, action: onCategoriasClick },
    { name: "Escanear", icon: <ScanBarcode className="h-4 w-4" />, path: "/escanear" },
  ];

  const renderMenuItems = () =>
    menuItems.map((item, index) =>
      item.path ? (
        <NavLink
          key={index}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
              isActive ? "bg-muted text-primary" : "text-muted-foreground"
            }`
          }
          onClick={() => setIsOpen(false)}
        >
          {item.icon}
          {item.name}
        </NavLink>
      ) : (
        <button
          key={index}
          onClick={() => {
            item.action?.();
            setIsOpen(false);
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary text-muted-foreground hover:bg-muted"
        >
          {item.icon}
          {item.name}
        </button>
      )
    );

  return (
    <>
      {/* Menú hamburguesa en móviles */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-white">
        <span className="font-semibold text-lg">Inventory App</span>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Menú deslizable en móvil */}
      {isOpen && (
        <div className="md:hidden fixed top-[60px] left-0 z-50 w-64 h-full bg-white border-r shadow-lg p-4">
          <nav className="flex flex-col gap-2 text-sm font-medium">{renderMenuItems()}</nav>
        </div>
      )}

      {/* Sidebar normal en escritorio */}
      <div className="hidden md:block w-64 border-r bg-muted/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <span className="font-semibold">Inventory App</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 lg:px-4 py-2 text-sm font-medium">
            {renderMenuItems()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
