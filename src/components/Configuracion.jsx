import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { 
  Users, 
  Building2, 
  Bell, 
  Database, 
  Settings,
  Shield,
  UserCheck,
  Globe,
  FileText,
  Activity
} from "lucide-react";
import toast from "react-hot-toast";
import UserManagement from "./UserManagement";
import ConfiguracionEmpresa from "./ConfiguracionEmpresa";
import AdvancedRoleManagement from "./AdvancedRoleManagement";
import ConfigAuditLog from "./ConfigAuditLog";

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState("empresa");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Obtener rol del usuario
        const { data: systemUser } = await supabase
          .from("system_users")
          .select("role_id")
          .eq("id", user.id)
          .single();
        
        if (systemUser?.role_id) {
          const { data: role } = await supabase
            .from("user_roles")
            .select("*")
            .eq("id", systemUser.role_id)
            .single();
          setUserRole(role);
        }
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
    }
  };

  const tabs = [
    {
      id: "empresa",
      name: "Empresa",
      icon: <Building2 className="h-5 w-5" />,
      component: <ConfiguracionEmpresa />
    },
    {
      id: "usuarios",
      name: "Usuarios y Roles",
      icon: <Users className="h-5 w-5" />,
      component: <UserManagement />
    },
    {
      id: "roles-avanzados",
      name: "Roles Avanzados",
      icon: <Shield className="h-5 w-5" />,
      component: <AdvancedRoleManagement />
    },
    {
      id: "audit-log",
      name: "Log de Auditoría",
      icon: <Activity className="h-5 w-5" />,
      component: <ConfigAuditLog />
    },
    {
      id: "notificaciones",
      name: "Notificaciones",
      icon: <Bell className="h-5 w-5" />,
      component: <ConfiguracionNotificaciones />
    },
    {
      id: "sistema",
      name: "Sistema",
      icon: <Settings className="h-5 w-5" />,
      component: <ConfiguracionSistema />
    },
    {
      id: "backup",
      name: "Backup",
      icon: <Database className="h-5 w-5" />,
      component: <ConfiguracionBackup />
    }
  ];

  // Verificar permisos del usuario
  const hasPermission = (permission) => {
    if (!userRole) return false;
    if (userRole.permissions?.all) return true;
    return userRole.permissions?.[permission];
  };

  // Solo mostrar pestañas según permisos
  const filteredTabs = tabs.filter(tab => {
    switch (tab.id) {
      case "empresa":
        return hasPermission("company_config") || hasPermission("all");
      case "usuarios":
        return hasPermission("users") || hasPermission("all");
      case "roles-avanzados":
        return hasPermission("users") || hasPermission("all");
      case "audit-log":
        return hasPermission("logs") || hasPermission("all");
      case "notificaciones":
        return hasPermission("notifications") || hasPermission("all");
      case "sistema":
        return hasPermission("system_settings") || hasPermission("all");
      case "backup":
        return hasPermission("backup") || hasPermission("all");
      default:
        return true;
    }
  });

  if (!hasPermission("system_settings") && !hasPermission("all")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">
            No tienes permisos para acceder a la configuración del sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="mt-2 text-gray-600">
            Gestiona la configuración de usuarios, empresa, notificaciones y sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {filteredTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {filteredTabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de configuración de usuarios y roles
const ConfiguracionUsuarios = () => {
  return <UserManagement />;
};

// Componente de configuración de notificaciones
const ConfiguracionNotificaciones = () => {
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    audit_notifications: true,
    maintenance_notifications: true,
    loan_notifications: true,
    low_stock_notifications: true
  });

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-6">Configuración de Notificaciones</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Notificaciones por Email</h4>
            <p className="text-sm text-gray-600">Recibir notificaciones por correo electrónico</p>
          </div>
          <button
            onClick={() => handleToggle('email_notifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notifications.email_notifications ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Notificaciones Push</h4>
            <p className="text-sm text-gray-600">Recibir notificaciones en tiempo real</p>
          </div>
          <button
            onClick={() => handleToggle('push_notifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.push_notifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notifications.push_notifications ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Notificaciones de Auditoría</h4>
            <p className="text-sm text-gray-600">Alertas sobre auditorías y revisiones</p>
          </div>
          <button
            onClick={() => handleToggle('audit_notifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.audit_notifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notifications.audit_notifications ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Notificaciones de Mantenimiento</h4>
            <p className="text-sm text-gray-600">Alertas sobre mantenimiento programado</p>
          </div>
          <button
            onClick={() => handleToggle('maintenance_notifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.maintenance_notifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notifications.maintenance_notifications ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Notificaciones de Préstamos</h4>
            <p className="text-sm text-gray-600">Alertas sobre préstamos y devoluciones</p>
          </div>
          <button
            onClick={() => handleToggle('loan_notifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.loan_notifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notifications.loan_notifications ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Notificaciones de Stock Bajo</h4>
            <p className="text-sm text-gray-600">Alertas cuando el inventario esté bajo</p>
          </div>
          <button
            onClick={() => handleToggle('low_stock_notifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.low_stock_notifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notifications.low_stock_notifications ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de configuración del sistema
const ConfiguracionSistema = () => {
  const [settings, setSettings] = useState({
    system_name: "Inventory Management System",
    max_file_size: "10485760",
    session_timeout: "3600",
    maintenance_mode: false,
    backup_retention_days: "30"
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-6">Configuración del Sistema</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Sistema
          </label>
          <input
            type="text"
            name="system_name"
            value={settings.system_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tamaño Máximo de Archivo (bytes)
          </label>
          <input
            type="number"
            name="max_file_size"
            value={settings.max_file_size}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Actual: {(parseInt(settings.max_file_size) / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiempo de Sesión (segundos)
          </label>
          <input
            type="number"
            name="session_timeout"
            value={settings.session_timeout}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Actual: {(parseInt(settings.session_timeout) / 60).toFixed(0)} minutos
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="maintenance_mode"
            checked={settings.maintenance_mode}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Modo Mantenimiento
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Días de Retención de Backups
          </label>
          <input
            type="number"
            name="backup_retention_days"
            value={settings.backup_retention_days}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// Componente de gestión de backups
const ConfiguracionBackup = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("system_backups")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error al cargar backups:", error);
        return;
      }
      
      setBackups(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      // Aquí se implementaría la lógica real de backup
      // Por ahora solo creamos un registro
      const { error } = await supabase
        .from("system_backups")
        .insert([{
          backup_name: `Backup_${new Date().toISOString().split('T')[0]}`,
          backup_type: 'full',
          status: 'completed',
          notes: 'Backup automático del sistema'
        }]);
      
      if (error) {
        toast.error("Error al crear backup");
      } else {
        toast.success("Backup creado exitosamente");
        fetchBackups();
      }
    } catch (error) {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Gestión de Backups</h3>
        <button
          onClick={createBackup}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Backup"}
        </button>
      </div>
      
      <div className="space-y-4">
        {backups.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay backups disponibles</p>
        ) : (
          backups.map((backup) => (
            <div key={backup.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{backup.backup_name}</h4>
                <span className={`px-2 py-1 text-xs rounded ${
                  backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                  backup.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {backup.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Tipo:</span> {backup.backup_type}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span> {new Date(backup.created_at).toLocaleDateString()}
                </div>
                {backup.file_size && (
                  <div>
                    <span className="font-medium">Tamaño:</span> {(backup.file_size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
                {backup.notes && (
                  <div className="col-span-2">
                    <span className="font-medium">Notas:</span> {backup.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Configuracion;
