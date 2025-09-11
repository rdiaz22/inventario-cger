import React, { useEffect, useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, RefreshCw, Plus, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Mantenimiento = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'Preventivo',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const openModal = (asset) => {
    setSelectedAsset(asset || null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      type: 'Preventivo',
      notes: ''
    });
    setFormError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedAsset(null);
    setFormError(null);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('epi_assets')
        .select('id, name, category, last_maintenance_date, maintenance_frequency')
        .not('maintenance_frequency', 'is', null);

      if (error) throw error;

      const now = new Date();
      const rows = (data || []).map(a => {
        const last = a.last_maintenance_date ? new Date(a.last_maintenance_date) : null;
        const freq = a.maintenance_frequency || 90;
        const next = last ? new Date(last.getTime() + freq * 24 * 60 * 60 * 1000) : null;
        const due = !last || (next && next <= now);
        return {
          id: a.id,
          name: a.name || `Activo #${a.id}`,
          category: a.category || 'Sin categoría',
          lastDate: last ? last.toISOString().slice(0, 10) : '—',
          frequency: `${freq} días`,
          nextDate: next ? next.toISOString().slice(0, 10) : '—',
          due
        };
      }).sort((a, b) => (a.due === b.due ? 0 : a.due ? -1 : 1));

      setItems(rows);
    } catch (e) {
      setError(e.message || 'Error al cargar mantenimientos');
    } finally {
      setLoading(false);
    }
  };

  const submitMaintenance = async (e) => {
    e?.preventDefault?.();
    if (!selectedAsset) {
      setFormError('Selecciona un activo.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const { error: updErr } = await supabase
        .from('epi_assets')
        .update({ last_maintenance_date: form.date })
        .eq('id', selectedAsset.id);

      if (updErr) throw updErr;

      try {
        await supabase.from('system_logs').insert([{
          action: 'mantenimiento_registrado',
          details: `Activo ${selectedAsset.id} - ${form.type}: ${form.notes?.slice(0, 200) || 'sin notas'}`,
          status: 'success'
        }]);
      } catch (_) {}

      closeModal();
      await load();
    } catch (err) {
      setFormError(err.message || 'No se pudo registrar el mantenimiento');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mantenimiento</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal(null)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Registrar mantenimiento
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Recargar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Pendientes</span>
            </div>
            <p className="text-xl font-bold text-orange-800">
              {items.filter(i => i.due).length}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-green-50 border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Al día</span>
            </div>
            <p className="text-xl font-bold text-green-800">
              {items.filter(i => !i.due).length}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-gray-50 border-gray-200">
            <div className="text-gray-700 text-sm font-medium">Total activos con frecuencia</div>
            <p className="text-xl font-bold text-gray-900">{items.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Activos</h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600 text-sm">No hay activos con mantenimiento configurado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Activo</th>
                  <th className="py-2 pr-4">Categoría</th>
                  <th className="py-2 pr-4">Último</th>
                  <th className="py-2 pr-4">Frecuencia</th>
                  <th className="py-2 pr-4">Próximo</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 pr-4">{r.category}</td>
                    <td className="py-2 pr-4">{r.lastDate}</td>
                    <td className="py-2 pr-4">{r.frequency}</td>
                    <td className="py-2 pr-4">{r.nextDate}</td>
                    <td className="py-2 pr-4">
                      {r.due ? (
                        <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">Pendiente</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Al día</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <button
                        onClick={() => openModal(r)}
                        className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Registrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Registrar mantenimiento</h3>
              <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={submitMaintenance} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Activo</label>
                <input
                  type="text"
                  value={selectedAsset ? `${selectedAsset.name} (ID ${selectedAsset.id})` : 'Selecciona un activo desde la tabla'}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option>Preventivo</option>
                    <option>Correctivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Observaciones del mantenimiento"
                />
              </div>

              {formError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedAsset}
                  className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mantenimiento;



