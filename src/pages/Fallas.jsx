import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Spinner from '../components/Spinner.jsx';
import { api } from '../api.js';

function hoy() { return new Date().toISOString().split('T')[0]; }
function hace90() { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0]; }

function formatDate(str) {
  if (!str) return '—';
  const m = str.match(/(\d+)/);
  if (!m) return str;
  return new Date(parseInt(m[1])).toLocaleDateString('es-AR');
}

const COLORS = ['#dc2626','#ea580c','#d97706','#ca8a04','#65a30d','#16a34a','#0284c7','#7c3aed','#db2777','#0f766e'];

export default function Fallas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desde, setDesde] = useState(hace90());
  const [hasta, setHasta] = useState(hoy());
  const [equipo, setEquipo] = useState('');

  useEffect(() => {
    setLoading(true);
    api.fallas({ desde, hasta, equipo: equipo || undefined })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [desde, hasta, equipo]);

  const top10 = data?.ranking?.slice(0, 10) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Filtros */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-gray-800">Análisis de fallas</h1>
        <div className="flex items-center gap-2 ml-auto text-sm flex-wrap">
          <label className="text-gray-500">Equipo</label>
          <input value={equipo} onChange={(e) => setEquipo(e.target.value)}
            placeholder="Ej: 10001234"
            className="border rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="text-gray-500">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="text-gray-500">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? <Spinner /> : (
        <>
          {/* Gráfico ranking */}
          <div className="bg-white rounded-lg border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              Equipos con más averías — Top 10
            </h2>
            {top10.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Sin datos de fallas en el período seleccionado</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top10} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="equipo" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    formatter={(val, _, props) => [
                      `${val} averías · ${props.payload.duracionTotal?.toFixed(1)} hs parado`,
                    ]}
                  />
                  <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                    {top10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tabla de avisos */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-600">Detalle de avisos de avería</h2>
              <span className="text-xs text-gray-400">({data?.avisos?.length ?? 0} registros)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Aviso</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Equipo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Ubicación</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Descripción</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Inicio</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Duración (hs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data?.avisos ?? []).length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Sin averías registradas</td></tr>
                  )}
                  {(data?.avisos ?? []).map((a) => (
                    <tr key={a.MaintenanceNotification} className="hover:bg-red-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{a.MaintenanceNotification}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{a.Equipment || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{a.FunctionalLocation || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{a.NotificationText || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(a.MalfunctionStartDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${parseFloat(a.BreakdownDuration) > 8 ? 'text-red-600' : 'text-orange-500'}`}>
                          {parseFloat(a.BreakdownDuration || 0).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
