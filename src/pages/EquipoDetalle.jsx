import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ClipboardList, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Spinner from '../components/Spinner.jsx';
import { api } from '../api.js';

function formatDate(str) {
  if (!str) return '—';
  const m = str.match(/(\d+)/);
  if (!m) return str;
  return new Date(parseInt(m[1])).toLocaleDateString('es-AR');
}

const prioridad = { '1': 'Muy alta', '2': 'Alta', '3': 'Media', '4': 'Baja' };
const prioColor = { '1': 'text-red-600 bg-red-50', '2': 'text-orange-600 bg-orange-50', '3': 'text-blue-600 bg-blue-50', '4': 'text-gray-600 bg-gray-50' };

export default function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('ordenes');

  useEffect(() => {
    setLoading(true);
    api.equipo(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Fallas por mes para el gráfico
  const fallasPorMes = (() => {
    if (!data?.avisos) return [];
    const map = {};
    for (const a of data.avisos) {
      const m = (a.MalfunctionStartDate || '').slice(0, 7);
      if (m) map[m] = (map[m] || 0) + 1;
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, fallas]) => ({ mes: mes.slice(2), fallas }));
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <button onClick={() => navigate('/equipos')}
        className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft size={15} /> Volver a equipos
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? <Spinner /> : data && (
        <>
          {/* Cabecera del equipo */}
          <div className="bg-white rounded-lg border shadow-sm p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-mono text-gray-400 mb-1">{data.equipo.Equipment}</p>
                <h1 className="text-2xl font-bold text-gray-900">{data.equipo.EquipmentName}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {data.equipo.TechObjIsLocatedAtFuncLoc && `Ubicación: ${data.equipo.TechObjIsLocatedAtFuncLoc} · `}
                  {data.equipo.ManufacturerName && `Fabricante: ${data.equipo.ManufacturerName} · `}
                  {data.equipo.ConstructionYear && `Año: ${data.equipo.ConstructionYear}`}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{data.avisos.length}</p>
                  <p className="text-xs text-gray-400">averías</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{data.ordenes.length}</p>
                  <p className="text-xs text-gray-400">órdenes</p>
                </div>
              </div>
            </div>

            {/* Mini gráfico de fallas por mes */}
            {fallasPorMes.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Averías por mes</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={fallasPorMes}>
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="fallas" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {[
              { key: 'ordenes', label: 'Órdenes de mantenimiento', icon: ClipboardList },
              { key: 'avisos', label: 'Avisos de avería', icon: AlertTriangle },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Órdenes */}
          {tab === 'ordenes' && (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Orden</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Descripción</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Prioridad</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Inicio</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Fin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.ordenes.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Sin órdenes registradas</td></tr>
                  )}
                  {data.ordenes.map((o) => (
                    <tr key={o.MaintenanceOrder} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.MaintenanceOrder}</td>
                      <td className="px-4 py-3 text-gray-900">{o.OrderDescription || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{o.MaintenanceOrderType}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${prioColor[o.Priority] || 'text-gray-600 bg-gray-50'}`}>
                          {prioridad[o.Priority] || o.Priority || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <div className="flex items-center gap-1"><Calendar size={11} />{formatDate(o.MaintOrdBasicStartDate)}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(o.MaintOrdBasicEndDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Avisos */}
          {tab === 'avisos' && (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Aviso</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Descripción</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Inicio falla</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Fin falla</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Duración (hs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.avisos.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Sin avisos de avería</td></tr>
                  )}
                  {data.avisos.map((a) => (
                    <tr key={a.MaintenanceNotification} className="hover:bg-red-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.MaintenanceNotification}</td>
                      <td className="px-4 py-3 text-gray-900">{a.NotificationText || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(a.MalfunctionStartDate)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(a.MalfunctionEndDate)}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-red-600">{parseFloat(a.BreakdownDuration || 0).toFixed(1)}</span>
                        <span className="text-gray-400 text-xs ml-1">hs</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
