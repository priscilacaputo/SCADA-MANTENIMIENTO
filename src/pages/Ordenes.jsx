import { useState, useEffect } from 'react';
import Spinner from '../components/Spinner.jsx';
import { api } from '../api.js';

function hoy() { return new Date().toISOString().split('T')[0]; }
function hace30() { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; }

function formatDate(str) {
  if (!str) return '—';
  const m = str.match(/(\d+)/);
  if (!m) return str;
  return new Date(parseInt(m[1])).toLocaleDateString('es-AR');
}

const prioColor = {
  '1': 'bg-red-100 text-red-700',
  '2': 'bg-orange-100 text-orange-700',
  '3': 'bg-blue-100 text-blue-700',
  '4': 'bg-gray-100 text-gray-600',
};
const prioLabel = { '1': 'Muy alta', '2': 'Alta', '3': 'Media', '4': 'Baja' };

const tiposOrden = [
  { value: '', label: 'Todos los tipos' },
  { value: 'PM01', label: 'PM01 — Correctivo' },
  { value: 'PM02', label: 'PM02 — Preventivo' },
  { value: 'PM03', label: 'PM03 — Predictivo' },
  { value: 'PM04', label: 'PM04 — Inspección' },
];

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desde, setDesde] = useState(hace30());
  const [hasta, setHasta] = useState(hoy());
  const [tipo, setTipo] = useState('');
  const [equipo, setEquipo] = useState('');

  useEffect(() => {
    setLoading(true);
    api.ordenes({ desde, hasta, tipo: tipo || undefined, equipo: equipo || undefined })
      .then(setOrdenes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [desde, hasta, tipo, equipo]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-800">Órdenes de mantenimiento</h1>
        <span className="text-sm text-gray-400">{ordenes.length} órdenes</span>
        <div className="ml-auto flex gap-2 flex-wrap text-sm items-center">
          <input value={equipo} onChange={(e) => setEquipo(e.target.value)}
            placeholder="Equipo"
            className="border rounded px-2 py-1 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}
            className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {tiposOrden.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className="text-gray-500">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="text-gray-500">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Orden</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Descripción</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Equipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ubicación</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Prioridad</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Inicio</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Fin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordenes.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Sin órdenes en el período seleccionado</td></tr>
                )}
                {ordenes.map((o) => (
                  <tr key={o.MaintenanceOrder} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.MaintenanceOrder}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {o.MaintenanceOrderType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{o.OrderDescription || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.Equipment || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{o.FunctionalLocation || '—'}</td>
                    <td className="px-4 py-3">
                      {o.Priority ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${prioColor[o.Priority] || 'bg-gray-100 text-gray-600'}`}>
                          {prioLabel[o.Priority] || o.Priority}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(o.MaintOrdBasicStartDate)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(o.MaintOrdBasicEndDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
