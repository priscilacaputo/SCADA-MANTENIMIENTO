import { useState, useEffect } from 'react';
import { Search, ChevronRight, Wrench, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import { api } from '../api.js';

export default function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.equipos()
      .then(setEquipos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = equipos.filter((e) =>
    !search ||
    (e.EquipmentName || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.Equipment || '').includes(search) ||
    (e.TechObjIsLocatedAtFuncLoc || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-gray-800">Equipos</h1>
        <span className="text-sm text-gray-400">{filtered.length} equipos</span>
        <div className="ml-auto relative">
          <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, número o ubicación..."
            className="border rounded pl-8 pr-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">N° Equipo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Descripción</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ubicación técnica</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Fabricante</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Año</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Planta</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No se encontraron equipos
                  </td>
                </tr>
              )}
              {filtered.map((eq) => (
                <tr
                  key={eq.Equipment}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/equipos/${eq.Equipment}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{eq.Equipment}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-1.5">
                      <Wrench size={13} className="text-blue-400 shrink-0" />
                      {eq.EquipmentName || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-gray-300 shrink-0" />
                      {eq.TechObjIsLocatedAtFuncLoc || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{eq.ManufacturerName || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{eq.ConstructionYear || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{eq.MaintPlant || '—'}</td>
                  <td className="px-4 py-3">
                    <ChevronRight size={15} className="text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
