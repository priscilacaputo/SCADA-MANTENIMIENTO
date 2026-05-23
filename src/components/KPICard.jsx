export default function KPICard({ label, value, unit, sub, color = 'blue', icon: Icon }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
        {Icon && <Icon size={18} className="opacity-50" />}
      </div>
      <p className="mt-2 text-3xl font-bold">
        {value}
        {unit && <span className="text-base font-normal ml-1 opacity-70">{unit}</span>}
      </p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  );
}
