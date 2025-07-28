import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Package, Layers, Settings, ClipboardList, Wrench, CalendarCheck, Box, User, Home } from "lucide-react";

const Sidebar = ({ onCategoriasClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    { name: "Activos", icon: <Box size={18} />, path: "/activos" },
    { name: "Préstamos", icon: <CalendarCheck size={18} />, path: "/prestamos" },
    { name: "Mantenimiento", icon: <Wrench size={18} />, path: "/mantenimiento" },
    { name: "Auditorías", icon: <ClipboardList size={18} />, path: "/auditorias" },
    { name: "Configuración", icon: <Settings size={18} />, path: "/configuracion" },
    { name: "Categorías", icon: <Layers size={18} />, path: "/categorias" },
  ];

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[60px] items-center border-b px-6">
          <span className="font-semibold">Inventory App</span>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                  isActive ? "bg-muted text-primary" : "text-muted-foreground"
                }`
              }
            >
              <Home className="h-4 w-4" />
              Inicio
            </NavLink>
            <NavLink
              to="/activos"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                  isActive ? "bg-muted text-primary" : "text-muted-foreground"
                }`
              }
            >
              <Package className="h-4 w-4" />
              Activos
            </NavLink>

            <p className="text-xs font-semibold text-muted-foreground px-3 pt-4 pb-2">
              Configuración
            </p>

            <NavLink
              to="/configuracion"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary ${
                  isActive ? "bg-muted text-primary" : "text-muted-foreground"
                }`
              }
            >
              <Settings className="h-4 w-4" />
              General
            </NavLink>

            <button
              onClick={onCategoriasClick}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary text-muted-foreground hover:bg-muted"
            >
              <Layers className="h-4 w-4" />
              Categorías
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
