import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import CrearAuditoria from './CrearAuditoria';
import EditarAuditoria from './EditarAuditoria';
import DetalleAuditoria from './DetalleAuditoria';

const Auditorias = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    auditor: '',
    dateRange: '',
    search: ''
  });

  useEffect(() => {
    loadAudits();
  }, [filters]);

  const loadAudits = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audits')
        .select(`
          *,
          auditor:auditor_id(email, user_metadata),
          audit_results(count),
          audit_findings(count)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.auditor) {
        query = query.eq('auditor_id', filters.auditor);
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange.split(' to ');
        if (start) query = query.gte('start_date', start);
        if (end) query = query.lte('end_date', end);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setAudits(data || []);
    } catch (error) {
      console.error('Error cargando auditorías:', error);
      toast.error('Error al cargar las auditorías');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (auditId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta auditoría?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('audits')
        .delete()
        .eq('id', auditId);

      if (error) throw error;

      toast.success('Auditoría eliminada correctamente');
      loadAudits();
    } catch (error) {
      console.error('Error eliminando auditoría:', error);
      toast.error('Error al eliminar la auditoría');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'En Progreso': return 'bg-blue-100 text-blue-800';
      case 'Completada': return 'bg-green-100 text-green-800';
      case 'Cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pendiente': return <Clock className="w-4 h-4" />;
      case 'En Progreso': return <AlertCircle className="w-4 h-4" />;
      case 'Completada': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelada': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const exportAudits = () => {
    const csvContent = [
      ['Nombre', 'Descripción', 'Estado', 'Auditor', 'Fecha Inicio', 'Fecha Fin', 'Resultados', 'Hallazgos'],
      ...audits.map(audit => [
        audit.name,
        audit.description || '',
        audit.status,
        audit.auditor?.user_metadata?.full_name || audit.auditor?.email || '',
        audit.start_date,
        audit.end_date || '',
        audit.audit_results?.[0]?.count || 0,
        audit.audit_findings?.[0]?.count || 0
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditorias_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditorías</h1>
          <p className="text-gray-600">Gestiona y realiza auditorías de activos</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Auditoría
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
                placeholder="Buscar auditorías..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completada">Completada</option>
              <option value="Cancelada">Cancelada</option>
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
              onClick={exportAudits}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Auditorías */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando auditorías...</p>
          </div>
        ) : audits.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay auditorías</h3>
            <p className="text-gray-600">Crea tu primera auditoría para comenzar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auditoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auditor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{audit.name}</div>
                        <div className="text-sm text-gray-500">{audit.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                        {getStatusIcon(audit.status)}
                        <span className="ml-1">{audit.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {audit.auditor?.user_metadata?.full_name || audit.auditor?.email || 'No asignado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(audit.start_date).toLocaleDateString()}
                        </div>
                        {audit.end_date && (
                          <div className="text-xs text-gray-500">
                            hasta {new Date(audit.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>Resultados: {audit.audit_results?.[0]?.count || 0}</span>
                          <span>Hallazgos: {audit.audit_findings?.[0]?.count || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAudit(audit);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAudit(audit);
                            setShowEditModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(audit.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      {showCreateModal && (
        <CrearAuditoria
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadAudits();
          }}
        />
      )}

      {showEditModal && selectedAudit && (
        <EditarAuditoria
          audit={selectedAudit}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAudit(null);
          }}
          onUpdated={() => {
            setShowEditModal(false);
            setSelectedAudit(null);
            loadAudits();
          }}
        />
      )}

      {showDetailModal && selectedAudit && (
        <DetalleAuditoria
          audit={selectedAudit}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAudit(null);
          }}
        />
      )}
    </div>
  );
};

export default Auditorias;
