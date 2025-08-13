import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalAssets: 0,
    activeUsers: 0,
    pendingMaintenance: 0,
    completedAudits: 0,
    assetsByCategory: [],
    recentActivities: [],
    monthlyGrowth: [],
    loading: true,
    error: null
  });

  const [filters, setFilters] = useState({
    dateRange: '30d', // 7d, 30d, 90d, 1y
    category: 'all'
  });

  // Obtener total de activos
  const fetchTotalAssets = async () => {
    try {
      const { count, error } = await supabase
        .from('epi_assets')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching total assets:', error);
      return 0;
    }
  };

  // Obtener usuarios activos
  const fetchActiveUsers = async () => {
    try {
      const { count, error } = await supabase
        .from('system_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching active users:', error);
      return 0;
    }
  };

  // Obtener activos por categoría
  const fetchAssetsByCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('epi_assets')
        .select(`
          id,
          epi_sizes!inner (
            id,
            name
          )
        `);

      if (error) throw error;

      // Agrupar por categoría
      const categoryCount = data.reduce((acc, asset) => {
        const categoryName = asset.epi_sizes?.name || 'Sin categoría';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count,
        percentage: ((count / data.length) * 100).toFixed(1)
      }));
    } catch (error) {
      console.error('Error fetching assets by category:', error);
      return [];
    }
  };

  // Obtener actividades recientes
  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map(log => ({
        id: log.id,
        action: log.action,
        item: log.details || 'N/A',
        time: formatTimeAgo(log.created_at),
        type: getActivityType(log.action)
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  };

  // Obtener crecimiento mensual
  const fetchMonthlyGrowth = async () => {
    try {
      const { data, error } = await supabase
        .from('epi_assets')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Agrupar por mes
      const monthlyData = data.reduce((acc, asset) => {
        const month = new Date(asset.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count
      }));
    } catch (error) {
      console.error('Error fetching monthly growth:', error);
      return [];
    }
  };

  // Función auxiliar para formatear tiempo
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    if (diffInHours < 48) return 'Hace 1 día';
    return `Hace ${Math.floor(diffInHours / 24)} días`;
  };

  // Función auxiliar para determinar tipo de actividad
  const getActivityType = (action) => {
    if (action.includes('creado') || action.includes('agregado')) return 'success';
    if (action.includes('actualizado') || action.includes('modificado')) return 'info';
    if (action.includes('eliminado') || action.includes('borrado')) return 'warning';
    return 'info';
  };

  // Cargar todas las métricas
  const loadMetrics = async () => {
    setMetrics(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [
        totalAssets,
        activeUsers,
        assetsByCategory,
        recentActivities,
        monthlyGrowth
      ] = await Promise.all([
        fetchTotalAssets(),
        fetchActiveUsers(),
        fetchAssetsByCategory(),
        fetchRecentActivities(),
        fetchMonthlyGrowth()
      ]);

      setMetrics({
        totalAssets,
        activeUsers,
        pendingMaintenance: Math.floor(Math.random() * 50) + 10, // Placeholder por ahora
        completedAudits: Math.floor(Math.random() * 200) + 100, // Placeholder por ahora
        assetsByCategory,
        recentActivities,
        monthlyGrowth,
        loading: false,
        error: null
      });
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Recargar métricas cuando cambien los filtros
  useEffect(() => {
    loadMetrics();
  }, [filters]);

  // Función para actualizar filtros
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    metrics,
    filters,
    updateFilters,
    loadMetrics,
    isLoading: metrics.loading,
    error: metrics.error
  };
};
