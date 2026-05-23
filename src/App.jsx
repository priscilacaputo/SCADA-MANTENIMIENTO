import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Equipos from './pages/Equipos.jsx';
import EquipoDetalle from './pages/EquipoDetalle.jsx';
import Fallas from './pages/Fallas.jsx';
import Ordenes from './pages/Ordenes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipos" element={<Equipos />} />
            <Route path="/equipos/:id" element={<EquipoDetalle />} />
            <Route path="/fallas" element={<Fallas />} />
            <Route path="/ordenes" element={<Ordenes />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
