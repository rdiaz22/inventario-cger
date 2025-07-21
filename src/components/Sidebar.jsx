import React from "react";
import { Home, Box, CalendarCheck, Wrench, ClipboardList, Settings, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    { name: "Activos", icon: <Box size={18} />, path: "/activos" },
    { name: "Préstamos", icon: <CalendarCheck size={18} />, path: "/prestamos" },
    { name: "Mantenimiento", icon: <Wrench size={18} />, path: "/mantenimiento" },
    { name: "Auditorías", icon: <ClipboardList size={18} />, path: "/auditorias" },
    { name: "Configuración", icon: <Settings size={18} />, path: "/configuracion" },
  ];

  return (
    <div className="bg-gray-900 text-white w-56 min-h-screen flex flex-col p-4">
      <div className="text-2xl font-bold mb-8">Inventario</div>
      <ul className="space-y-2">
        {menu.map((item, i) => (
          <li
            key={i}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
              location.pathname.startsWith(item.path) ? "bg-gray-700" : "hover:bg-gray-800"
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6 border-t border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <User size={16} />
          <span>Administrador</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
