import { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SolicitudPage from './pages/SolicitudPage';
import ContactPage from './pages/ContactPage';
import GestionPage from './pages/GestionPage';
import SecretariaPage from './pages/SecretariaPage';
import JefaturaPage from './pages/JefaturaPage';
import TesoreriaPage from './pages/TesoreriaPage';
import InscripcionMagicaPage from './pages/InscripcionMagicaPage';
import { AdminRoute, AuthProvider, LoginPage, PrivateRoute } from './auth';
import PerfilPage from './pages/PerfilPage';
import AdminPage from './pages/AdminPage';

function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const targetId = hash.slice(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, hash, key]);

  return null;
}

function PublicLayout() {
  return (
    <div className="public-layout">
      <div className="public-layout-body">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
      <div className="app-shell">
        <NavBar />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route element={<PublicLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route
                path="/about"
                element={<div className="p-8 text-center text-gray-600">Página Conócenos (En construcción)</div>}
              />
            </Route>
            <Route path="/solicitud" element={<SolicitudPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />
            <Route path="/gestion" element={<PrivateRoute><GestionPage /></PrivateRoute>} />
            <Route path="/gestion/administracion" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="/gestion/secretaria" element={<PrivateRoute><SecretariaPage /></PrivateRoute>} />
            <Route path="/gestion/jefatura" element={<PrivateRoute><JefaturaPage /></PrivateRoute>} />
            <Route path="/gestion/tesoreria" element={<PrivateRoute><TesoreriaPage /></PrivateRoute>} />
            <Route path="/inscripcion/:token" element={<InscripcionMagicaPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;