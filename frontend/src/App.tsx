import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import SolicitudPage from './pages/SolicitudPage';
import GestionPage from './pages/GestionPage';
import SecretariaPage from './pages/SecretariaPage';
import JefaturaPage from './pages/JefaturaPage';
import TesoreriaPage from './pages/TesoreriaPage';
import InscripcionMagicaPage from './pages/InscripcionMagicaPage';
import { AuthProvider, LoginPage, PrivateRoute } from './auth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <div className="app-shell">
        <NavBar />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/solicitud" element={<SolicitudPage />} />
            <Route path="/contact" element={<SolicitudPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/gestion" element={<PrivateRoute><GestionPage /></PrivateRoute>} />
            <Route path="/gestion/secretaria" element={<PrivateRoute><SecretariaPage /></PrivateRoute>} />
            <Route path="/gestion/jefatura" element={<PrivateRoute><JefaturaPage /></PrivateRoute>} />
            <Route path="/gestion/tesoreria" element={<PrivateRoute><TesoreriaPage /></PrivateRoute>} />
            <Route path="/inscripcion/:token" element={<InscripcionMagicaPage />} />
            <Route
              path="/about"
              element={<div className="p-8 text-center text-gray-600">Página Conócenos (En construcción)</div>}
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;