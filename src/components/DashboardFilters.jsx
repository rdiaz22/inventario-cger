import React from 'react';
import { Calendar, Filter, RefreshCw } from 'lucide-react';

const DashboardFilters = ({ filters, onFilterChange, onRefresh, loading = false }) => {
  const dateRangeOptions = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 90 días' },
    { value: '1y', label: 'Último año' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'computers', label: 'Computadoras' },
    { value: 'furniture', label: 'Mobiliario' },
    { value: 'electronics', label: 'Electrónicos' },
    { value: 'vehicles', label: 'Vehículos' },
    { value: 'tools', label: 'Herramientas' }
  ];

  const handleDateRangeChange = (e) => {
    onFilterChange({ dateRange: e.target.value });
  };

  const handleCategoryChange = (e) => {
    onFilterChange({ category: e.target.value });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros del Dashboard</h3>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {/* Filtro de rango de fechas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-2" />
            Rango de Fechas
          </label>
          <select
            value={filters.dateRange}
            onChange={handleDateRangeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="inline h-4 w-4 mr-2" />
            Categoría
          </label>
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Información de filtros activos */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Filtros activos:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}
          </span>
          {filters.category !== 'all' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {categoryOptions.find(opt => opt.value === filters.category)?.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
