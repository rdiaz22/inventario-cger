import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Calendar, User, FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CrearAuditoria = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    auditor_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Establecer fecha de inicio por defecto (hoy)
      setFormData(prev => ({
        ...prev,
        start_date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Obtener usuarios del sistema
        const { data: systemUsers, error } = await supabase
          .from('system_users')
          .select(`
            id,
            first_name,
            last_name,
            user:auth.users(email, user_metadata)
          `)
          .eq('is_active', true);

        if (error) throw error;

        // Formatear usuarios para el select
        const formattedUsers = systemUsers.map(su => ({
          id: su.id,
          name: `${su.first_name || ''} ${su.last_name || ''}`.trim() || su.user?.email || 'Usuario sin nombre',
          email: su.user?.email
        }));

        setUsers(formattedUsers);
        
        // Si solo hay un usuario, seleccionarlo por defecto
        if (formattedUsers.length === 1) {
          setFormData(prev => ({ ...prev, auditor_id: formattedUsers[0].id }));
        }
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error al cargar la lista de usuarios');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre de la auditoría es obligatorio');
      return;
    }

    if (!formData.start_date) {
      toast.error('La fecha de inicio es obligatoria');
      return;
    }

    if (formData.end_date && formData.end_date < formData.start_date) {
      toast.error('La fecha de fin no puede ser anterior a la fecha de inicio');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('audits')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          auditor_id: formData.auditor_id || null,
          status: 'Pendiente'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Auditoría creada correctamente');
      onCreated();
      
      // Limpiar formulario
      setFormData({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        auditor_id: ''
      });
    } catch (error) {
      console.error('Error creando auditoría:', error);
      toast.error('Error al crear la auditoría');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Nueva Auditoría</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Auditoría *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Auditoría de Seguridad Q1 2024"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción detallada de la auditoría..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Fecha de Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Inicio *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Fecha de Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Fin (Opcional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Si no se especifica, la auditoría será continua
            </p>
          </div>

          {/* Auditor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auditor Responsable
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                name="auditor_id"
                value={formData.auditor_id}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar auditor...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona quién realizará la auditoría
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Crear Auditoría
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearAuditoria;
