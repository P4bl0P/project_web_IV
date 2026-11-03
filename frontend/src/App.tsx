import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import SolicitudPage from './pages/SolicitudPage';
import GestionPage from './pages/GestionPage';
import SecretariaPage from './pages/SecretariaPage';
import JefaturaPage from './pages/JefaturaPage';
import TesoreriaPage from './pages/TesoreriaPage';
import InscripcionMagicaPage from './pages/InscripcionMagicaPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavBar />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/solicitud" element={<SolicitudPage />} />
            <Route path="/contact" element={<SolicitudPage />} />
            <Route path="/gestion" element={<GestionPage />} />
            <Route path="/gestion/secretaria" element={<SecretariaPage />} />
            <Route path="/gestion/jefatura" element={<JefaturaPage />} />
            <Route path="/gestion/tesoreria" element={<TesoreriaPage />} />
            <Route path="/inscripcion/:token" element={<InscripcionMagicaPage />} />
            <Route
              path="/about"
              element={<div className="p-8 text-center text-gray-600">Página Conócenos (En construcción)</div>}
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;