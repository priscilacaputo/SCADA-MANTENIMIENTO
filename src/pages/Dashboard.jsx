import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, ClipboardCheck, Clock, TrendingUp, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import KPICard from '../components/KPICard.jsx';
import Spinner from '../components/Spinner.jsx';
import { api } from '../api.js';

function hoy() {
  return new Date().toISOString().split('T')[0];
}
function hace30() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [fallas, setFallas] = useState(null);
  const [ordenes, setOrdenes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desde, setDesde] = useState(hace30());
  const [hasta, setHasta] = useState(hoy());

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.kpis({ desde, hasta }),
      api.fallas({ desde, hasta }),
      api.ordenes({ desde, hasta }),
    ])
      .then(([k, f, o]) => {
        setKpis(k);
        setFallas(f);
        setOrdenes(o);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [desde, hasta]);

  // Ordenes por día (últimos 30d)
  const ordenesPorDia = (() => {
    if (!ordenes) return [];
    const map = {};
    for (const o of ordenes) {
      const d = (o.MaintOrdBasicStartDate || '').slice(0, 10);
      if (d) map[d] = (map[d] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, cantidad]) => ({ fecha: fecha.slice(5), cantidad }));
  })();

  const top10 = fallas?.ranking?.slice(0, 10) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Filtro de período */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-gray-800">Resumen de mantenimiento</h1>
        <div className="flex items-center gap-2 ml-auto text-sm">
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
          <strong>Error al conectar con SAP:</strong> {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard label="Fallas" value={kpis?.totalFallas ?? '-'} color="red" icon={AlertTriangle} sub="averías registradas" />
            <KPICard label="Órdenes" value={kpis?.totalOrdenes ?? '-'} color="blue" icon={ClipboardCheck} sub="órdenes abiertas" />
            <KPICard label="MTBF" value={kpis?.mtbf ?? '-'} unit="hs" color="green" icon={TrendingUp} sub="tiempo medio entre fallas" />
            <KPICard label="MTTR" value={kpis?.mttr ?? '-'} unit="hs" color="amber" icon={Clock} sub="tiempo medio de reparación" />
            <KPICard label="Disponibilidad" value={kpis?.disponibilidad ?? '-'} unit="%" color="green" icon={Activity} sub="en el período" />
            <KPICard label="Hrs paradas" value={kpis?.duracionTotalHoras ?? '-'} unit="hs" color="red" icon={Zap} sub="tiempo total de avería" />
          </div>

          {/* Gráficos */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Órdenes por día */}
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-600 mb-4">Órdenes de mantenimiento por día</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ordenesPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cantidad" stroke="#0066CC" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top fallas por equipo */}
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-600 mb-4">Top 10 equipos con más fallas</h2>
              {top10.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-16">Sin datos de fallas en el período</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={top10} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="equipo" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#0066CC" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
