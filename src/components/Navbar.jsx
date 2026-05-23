import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, AlertTriangle, ClipboardList } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/equipos', label: 'Equipos', icon: Wrench },
  { to: '/fallas', label: 'Fallas', icon: AlertTriangle },
  { to: '/ordenes', label: 'Órdenes', icon: ClipboardList },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="bg-[#003087] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 h-14">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-lg tracking-tight">SAP PM</span>
          <span className="text-blue-300 text-sm font-normal">| AA2000</span>
        </div>
        <div className="flex gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === to
                  ? 'bg-white/20 text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
