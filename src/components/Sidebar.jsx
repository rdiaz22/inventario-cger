import React, { useState, useEffect } from "react";
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
  Building2,
  User,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const Sidebar = ({ onCategoriasClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Obtener nombre de la empresa
      if (user) {
        const { data: companyRow } = await supabase
          .from('company_config')
          .select('company_name')
          .limit(1)
          .single();
        
        if (companyRow?.company_name) {
          setCompanyName(companyRow.company_name);
        }
      }
    };
    getUser();
  }, []);

  const menuItems = [
    { name: "Inicio", icon: <Home className="h-4 w-4" />, path: "/admin/dashboard" },
    { name: "Activos", icon: <Package className="h-4 w-4" />, path: "/admin/activos" },
    { name: "Mantenimiento", icon: <Wrench size={18} />, path: "/admin/mantenimiento" },
    { name: "Auditorías", icon: <ClipboardList size={18} />, path: "/admin/auditorias" },
    { name: "Configuración", icon: <Settings className="h-4 w-4" />, path: "/admin/configuracion" },
    { name: "Categorías", icon: <Layers className="h-4 w-4" />, action: onCategoriasClick },
    { name: "Escanear", icon: <ScanBarcode className="h-4 w-4" />, path: "/admin/escanear" },
  ];

  const renderMenuItems = () =>
    menuItems.map((item, index) =>
      item.path ? (
        <NavLink
          key={index}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-blue-50 hover:text-blue-700 ${
              isActive 
                ? "bg-blue-100 text-blue-700 border-r-2 border-blue-600" 
                : "text-gray-700"
            }`
          }
          onClick={() => setIsOpen(false)}
        >
          {item.icon}
          <span className="font-medium">{item.name}</span>
        </NavLink>
      ) : (
        <button
          key={index}
          onClick={() => {
            item.action?.();
            setIsOpen(false);
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-blue-50 hover:text-blue-700 text-gray-700 w-full text-left"
        >
          {item.icon}
          <span className="font-medium">{item.name}</span>
        </button>
      )
    );

  return (
    <>
      {/* Menú hamburguesa en móviles */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b bg-white shadow-md">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg text-gray-800">Inventory Pro</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Menú deslizable en móvil */}
      {isOpen && (
        <div className="md:hidden fixed top-0 left-0 z-40 w-64 h-screen bg-white shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="font-bold text-lg text-gray-800">Inventory Pro</h2>
                <p className="text-sm text-gray-600">{companyName || "Mi Empresa"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {user?.email ? user.email.split('@')[0] : 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-1 p-4">{renderMenuItems()}</nav>
        </div>
      )}

      {/* Sidebar normal en escritorio */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex h-full flex-col">
          {/* Header del Sidebar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <Building2 className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Inventory Pro</h1>
                <p className="text-sm text-gray-600">{companyName || "Mi Empresa"}</p>
              </div>
            </div>
            
            {/* Información del usuario */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {user?.email ? user.email.split('@')[0] : 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">Administrador del Sistema</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Navegación */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-1">{renderMenuItems()}</nav>
          </div>

          {/* Footer del Sidebar */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>© 2024 Inventory Pro</p>
              <p>v2.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
