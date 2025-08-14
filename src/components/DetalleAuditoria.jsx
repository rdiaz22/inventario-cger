import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Calendar, User, FileText, CheckCircle, Clock, AlertCircle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const DetalleAuditoria = ({ audit, isOpen, onClose }) => {
  const [auditDetails, setAuditDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (isOpen && audit) {
      loadAuditDetails();
    }
  }, [isOpen, audit]);

  const loadAuditDetails = async () => {
    try {
      setLoading(true);
      
      // Cargar detalles completos de la auditoría
      const { data, error } = await supabase
        .from('audits')
        .select(`
          *,
          auditor:auditor_id(email, user_metadata),
          audit_checklists(
            id,
            name,
            description,
            order_index,
            audit_checklist_items(
              id,
              description,
              is_required,
              order_index
            )
          ),
          audit_results(
            id,
            asset_id,
            checklist_item_id,
            status,
            notes,
            checked_at,
            asset:assets(name, category, codigo)
          ),
          audit_findings(
            id,
            asset_id,
            severity,
            description,
            recommendation,
            status,
            assigned_to,
            due_date,
            asset:assets(name, category, codigo)
          )
        `)
        .eq('id', audit.id)
        .single();

      if (error) throw error;

      setAuditDetails(data);
    } catch (error) {
      console.error('Error cargando detalles de auditoría:', error);
      toast.error('Error al cargar los detalles de la auditoría');
    } finally {
      setLoading(false);
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Crítica': return 'bg-red-100 text-red-800';
      case 'Alta': return 'bg-orange-100 text-orange-800';
      case 'Media': return 'bg-yellow-100 text-yellow-800';
      case 'Baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultStatusColor = (status) => {
    switch (status) {
      case 'Aprobado': return 'bg-green-100 text-green-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      case 'Observación': return 'bg-yellow-100 text-yellow-800';
      case 'Pendiente': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !audit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{audit.name}</h2>
            <p className="text-sm text-gray-600">{audit.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando detalles...</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {['general', 'checklist', 'results', 'findings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'general' && 'General'}
                    {tab === 'checklist' && 'Lista de Verificación'}
                    {tab === 'results' && 'Resultados'}
                    {tab === 'findings' && 'Hallazgos'}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Información General</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>Nombre:</strong> {auditDetails?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(auditDetails?.status)}`}>
                            {getStatusIcon(auditDetails?.status)}
                            <span className="ml-1">{auditDetails?.status}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>Inicio:</strong> {auditDetails?.start_date ? new Date(auditDetails.start_date).toLocaleDateString() : 'No especificada'}
                          </span>
                        </div>
                        {auditDetails?.end_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              <strong>Fin:</strong> {new Date(auditDetails.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Auditor Responsable</h3>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {auditDetails?.auditor?.user_metadata?.full_name || auditDetails?.auditor?.email || 'No asignado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Estadísticas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {auditDetails?.audit_checklists?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Listas de Verificación</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {auditDetails?.audit_results?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Resultados</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {auditDetails?.audit_findings?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Hallazgos</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {auditDetails?.audit_results?.filter(r => r.status === 'Aprobado').length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Aprobados</div>
                        </div>
                      </div>
                    </div>

                    {auditDetails?.description && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
                        <p className="text-sm text-gray-600">{auditDetails.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Checklist Tab */}
              {activeTab === 'checklist' && (
                <div className="space-y-4">
                  {auditDetails?.audit_checklists?.length > 0 ? (
                    auditDetails.audit_checklists.map((checklist) => (
                      <div key={checklist.id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">{checklist.name}</h3>
                        {checklist.description && (
                          <p className="text-sm text-gray-600 mb-3">{checklist.description}</p>
                        )}
                        <div className="space-y-2">
                          {checklist.audit_checklist_items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  item.is_required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.is_required ? 'Obligatorio' : 'Opcional'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-700">{item.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay listas de verificación</h3>
                      <p className="text-gray-600">Esta auditoría no tiene listas de verificación configuradas</p>
                    </div>
                  )}
                </div>
              )}

              {/* Results Tab */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {auditDetails?.audit_results?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {auditDetails.audit_results.map((result) => (
                            <tr key={result.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {result.asset?.name || 'Activo no encontrado'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {result.asset?.category} - {result.asset?.codigo}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultStatusColor(result.status)}`}>
                                  {result.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {result.notes || 'Sin notas'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {result.checked_at ? new Date(result.checked_at).toLocaleDateString() : 'No verificada'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay resultados</h3>
                      <p className="text-gray-600">Esta auditoría aún no tiene resultados registrados</p>
                    </div>
                  )}
                </div>
              )}

              {/* Findings Tab */}
              {activeTab === 'findings' && (
                <div className="space-y-4">
                  {auditDetails?.audit_findings?.length > 0 ? (
                    auditDetails.audit_findings.map((finding) => (
                      <div key={finding.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(finding.severity)}`}>
                              {finding.severity}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultStatusColor(finding.status)}`}>
                              {finding.status}
                            </span>
                          </div>
                          {finding.due_date && (
                            <div className="text-sm text-gray-500">
                              Vence: {new Date(finding.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">Activo</h4>
                          <div className="text-sm text-gray-600">
                            {finding.asset?.name || 'Activo no encontrado'} - {finding.asset?.category}
                          </div>
                        </div>

                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">Descripción</h4>
                          <p className="text-sm text-gray-700">{finding.description}</p>
                        </div>

                        {finding.recommendation && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 mb-1">Recomendación</h4>
                            <p className="text-sm text-gray-700">{finding.recommendation}</p>
                          </div>
                        )}

                        {finding.assigned_to && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 mb-1">Asignado a</h4>
                            <p className="text-sm text-gray-600">{finding.assigned_to}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay hallazgos</h3>
                      <p className="text-gray-600">Esta auditoría no tiene hallazgos registrados</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleAuditoria;
