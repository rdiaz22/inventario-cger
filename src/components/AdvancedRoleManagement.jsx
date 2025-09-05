import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Shield, 
  Users, 
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdvancedRoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      assets: false,
      users: false,
      audits: false,
      reports: false,
      company_config: false,
      notifications: false,
      system_settings: false,
      backup: false,
      logs: false,
      all: false
    }
  });

  const permissionLabels = {
    assets: 'Gestión de Activos',
    users: 'Gestión de Usuarios',
    audits: 'Gestión de Auditorías',
    reports: 'Generación de Reportes',
    company_config: 'Configuración de Empresa',
    notifications: 'Configuración de Notificaciones',
    system_settings: 'Configuración del Sistema',
    backup: 'Gestión de Backups',
    logs: 'Visualización de Logs',
    all: 'Acceso Completo (Super Admin)'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;

      // Cargar usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('system_users')
        .select(`
          id,
          first_name,
          last_name,
          is_active,
          role_id,
          user:auth.users(email, user_metadata)
        `)
        .order('first_name');

      if (usersError) throw usersError;

      setRoles(rolesData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          permissions: formData.permissions
        }]);

      if (error) throw error;

      toast.success('Rol creado correctamente');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creando rol:', error);
      toast.error('Error al crear el rol');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          permissions: formData.permissions
        })
        .eq('id', selectedRole.id);

      if (error) throw error;

      toast.success('Rol actualizado correctamente');
      setShowEditModal(false);
      setSelectedRole(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error actualizando rol:', error);
      toast.error('Error al actualizar el rol');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este rol? Los usuarios con este rol perderán sus permisos.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Rol eliminado correctamente');
      loadData();
    } catch (error) {
      console.error('Error eliminando rol:', error);
      toast.error('Error al eliminar el rol');
    }
  };

  const handlePermissionChange = (permission, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value,
        // Si se desactiva "all", desactivar todos los permisos
        // Si se activa "all", activar todos los permisos
        ...(permission === 'all' && value ? 
          Object.keys(prev.permissions).reduce((acc, key) => ({ ...acc, [key]: true }), {}) :
          permission === 'all' && !value ?
          Object.keys(prev.permissions).reduce((acc, key) => ({ ...acc, [key]: false }), {}) :
          {}
        )
      }
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: {
        assets: false,
        users: false,
        audits: false,
        reports: false,
        company_config: false,
        notifications: false,
        system_settings: false,
        backup: false,
        logs: false,
        all: false
      }
    });
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || {}
    });
    setShowEditModal(true);
  };

  const getUsersWithRole = (roleId) => {
    return users.filter(user => user.role_id === roleId);
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'assets': return <Shield className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'audits': return <CheckCircle className="w-4 h-4" />;
      case 'reports': return <Settings className="w-4 h-4" />;
      case 'all': return <Shield className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-center text-gray-600">Cargando roles...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión Avanzada de Roles</h1>
          <p className="text-gray-600">Administra roles y permisos granulares del sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </button>
      </div>

      {/* Lista de Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(role)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Editar rol"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Eliminar rol"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Permisos */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Permisos:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    {role.permissions?.[key] ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-xs ${role.permissions?.[key] ? 'text-green-700' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usuarios con este rol */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Usuarios ({getUsersWithRole(role.id).length}):
              </h4>
              <div className="space-y-1">
                {getUsersWithRole(role.id).map((user) => (
                  <div key={user.id} className="flex items-center gap-2 text-sm">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {user.first_name} {user.last_name} ({user.user?.email})
                    </span>
                    {!user.is_active && (
                      <span className="text-xs text-red-600">(Inactivo)</span>
                    )}
                  </div>
                ))}
                {getUsersWithRole(role.id).length === 0 && (
                  <p className="text-sm text-gray-500">No hay usuarios asignados</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Rol */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Rol</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Rol *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Auditor Senior"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del rol..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Permisos */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Permisos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id={key}
                        checked={formData.permissions[key] || false}
                        onChange={(e) => handlePermissionChange(key, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={key} className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                        {getPermissionIcon(key)}
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Crear Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Rol */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Editar Rol</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRole(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Rol *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Auditor Senior"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del rol..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Permisos */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Permisos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id={`edit-${key}`}
                        checked={formData.permissions[key] || false}
                        onChange={(e) => handlePermissionChange(key, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`edit-${key}`} className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                        {getPermissionIcon(key)}
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRole(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Actualizar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedRoleManagement;
