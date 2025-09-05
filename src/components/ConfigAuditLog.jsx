import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Clock, 
  User, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const ConfigAuditLog = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    dateRange: '',
    search: ''
  });

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('system_logs')
        .select(`
          *,
          user:auth.users(email, user_metadata)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.user) {
        query = query.eq('user_id', filters.user);
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange.split(' to ');
        if (start) query = query.gte('created_at', start);
        if (end) query = query.lte('created_at', end);
      }
      if (filters.search) {
        query = query.or(`action.ilike.%${filters.search}%,details.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error cargando logs de auditoría:', error);
      toast.error('Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('creado') || action.includes('agregado')) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (action.includes('actualizado') || action.includes('modificado')) return <Settings className="w-4 h-4 text-blue-600" />;
    if (action.includes('eliminado') || action.includes('borrado')) return <AlertTriangle className="w-4 h-4 text-red-600" />;
    return <Settings className="w-4 h-4 text-gray-600" />;
  };

  const getActionColor = (action) => {
    if (action.includes('creado') || action.includes('agregado')) return 'text-green-600';
    if (action.includes('actualizado') || action.includes('modificado')) return 'text-blue-600';
    if (action.includes('eliminado') || action.includes('borrado')) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    if (diffInHours < 48) return 'Hace 1 día';
    return `Hace ${Math.floor(diffInHours / 24)} días`;
  };

  const exportLogs = () => {
    const csvContent = [
      ['Fecha', 'Usuario', 'Acción', 'Detalles', 'IP', 'User Agent'],
      ...auditLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.user?.email || 'Usuario desconocido',
        log.action,
        log.details || '',
        log.ip_address || '',
        log.user_agent || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log de Auditoría de Configuración</h1>
          <p className="text-gray-600">Registro de todos los cambios realizados en la configuración del sistema</p>
        </div>
        <button
          onClick={exportLogs}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar Logs
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las acciones</option>
              <option value="creado">Creado</option>
              <option value="actualizado">Actualizado</option>
              <option value="eliminado">Eliminado</option>
              <option value="configurado">Configurado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Fechas</label>
            <input
              type="date"
              value={filters.dateRange.split(' to ')[0] || ''}
              onChange={(e) => {
                const end = filters.dateRange.split(' to ')[1] || '';
                setFilters({ ...filters, dateRange: `${e.target.value}${end ? ` to ${end}` : ''}` });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ action: '', user: '', dateRange: '', search: '' })}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando logs...</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay logs de auditoría</h3>
            <p className="text-gray-600">Los cambios en la configuración aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Información Técnica
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(log.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {log.user?.email || 'Usuario desconocido'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {log.details || 'Sin detalles'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        <div>IP: {log.ip_address || 'N/A'}</div>
                        <div className="text-xs">
                          {log.user_agent ? log.user_agent.substring(0, 50) + '...' : 'N/A'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.action.includes('creado')).length}
              </div>
              <div className="text-sm text-gray-600">Creaciones</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.action.includes('actualizado')).length}
              </div>
              <div className="text-sm text-gray-600">Actualizaciones</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.action.includes('eliminado')).length}
              </div>
              <div className="text-sm text-gray-600">Eliminaciones</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(auditLogs.map(log => log.user_id)).size}
              </div>
              <div className="text-sm text-gray-600">Usuarios Únicos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigAuditLog;
