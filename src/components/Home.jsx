import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, Wrench, ClipboardList, TrendingUp, AlertTriangle, BarChart3, PieChart, Activity } from 'lucide-react';
import DashboardCard from './DashboardCard';
import MetricsChart from './MetricsChart';
import DashboardFilters from './DashboardFilters';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

const Home = () => {
  const navigate = useNavigate();
  const { metrics, filters, updateFilters, loadMetrics, isLoading, error } = useDashboardMetrics();

  const stats = [
    {
      title: "Total de Activos",
      value: metrics.totalAssets.toLocaleString(),
      icon: Package,
      change: "+12%",
      changeType: "positive",
      color: "blue",
      onClick: () => navigate('/admin/activos')
    },
    {
      title: "Usuarios Activos",
      value: metrics.activeUsers.toLocaleString(),
      icon: Users,
      change: "+5%",
      changeType: "positive",
      color: "green",
      onClick: () => navigate('/admin/configuracion')
    },
    {
      title: "Mantenimientos Pendientes",
      value: metrics.pendingMaintenance.toLocaleString(),
      icon: Wrench,
      change: "-8%",
      changeType: "negative",
      color: "orange",
      onClick: () => navigate('/admin/mantenimiento')
    },
    {
      title: "Auditorías Completadas",
      value: metrics.completedAudits.toLocaleString(),
      icon: ClipboardList,
      change: "+18%",
      changeType: "positive",
      color: "purple",
      onClick: () => navigate('/admin/auditorias')
    }
  ];

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const handleRefresh = () => {
    loadMetrics();
  };

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error al cargar el Dashboard</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header del Dashboard */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Bienvenido al Sistema de Inventario</h1>
            <p className="text-sm sm:text-base text-blue-100">Gestiona tus activos de manera eficiente y profesional</p>
          </div>
          <div className="hidden sm:block ml-4">
            <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Filtros del Dashboard */}
      <DashboardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        loading={isLoading}
      />

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <DashboardCard key={index} {...stat} />
        ))}
      </div>

      {/* Gráficos y Visualizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico de Activos por Categoría */}
        <MetricsChart
          data={metrics.assetsByCategory}
          type="pie"
          title="Activos por Categoría"
          height={300}
        />

        {/* Gráfico de Crecimiento Mensual */}
        <MetricsChart
          data={metrics.monthlyGrowth}
          type="line"
          title="Crecimiento Mensual de Activos"
          height={300}
        />
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Actividad Reciente */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Actividad Reciente</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todas
            </button>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {metrics.recentActivities.length > 0 ? (
                metrics.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' :
                      activity.type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{activity.item}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay actividades recientes</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/admin/escanear')}
              className="w-full flex items-center space-x-3 p-2 sm:p-3 text-left hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-300"
            >
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Escanear Activo</p>
                <p className="text-xs sm:text-sm text-gray-600">Registrar nuevo activo</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin/activos')}
              className="w-full flex items-center space-x-3 p-2 sm:p-3 text-left hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-300"
            >
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Ver Inventario</p>
                <p className="text-xs sm:text-sm text-gray-600">Lista completa de activos</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin/configuracion')}
              className="w-full flex items-center space-x-3 p-2 sm:p-3 text-left hover:bg-purple-50 rounded-lg transition-colors border border-gray-200 hover:border-purple-300"
            >
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Configuración</p>
                <p className="text-xs sm:text-sm text-gray-600">Ajustes del sistema</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Alertas y Notificaciones */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">Mantenimientos Pendientes</h3>
            <p className="text-xs sm:text-sm text-yellow-700 mb-2">
              Tienes {metrics.pendingMaintenance} activos que requieren mantenimiento preventivo este mes.
            </p>
            <button onClick={() => navigate('/admin/mantenimiento')} className="text-xs sm:text-sm text-yellow-800 hover:text-yellow-900 font-medium">
              Ir a mantenimiento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
