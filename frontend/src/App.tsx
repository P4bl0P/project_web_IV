import { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminRoute, AuthProvider, ModuleRoute, PrivateRoute, WebContentRoute } from './auth';
import FloatingJoinButton from './components/shared/FloatingJoinButton';
import Footer from './components/shared/Footer';
import NavBar from './components/shared/NavBar';
import { sharedImages } from './config/images/sharedImages';
import AdministracionPage from './pages/AdministracionPage';
import ConocenosPage from './pages/ConocenosPage';
import ContactoPage from './pages/ContactoPage';
import ContenidoWebPage from './pages/ContenidoWebPage';
import GestionPage from './pages/GestionPage';
import HomePage from './pages/HomePage';
import InscripcionMagicaPage from './pages/InscripcionMagicaPage';
import JefaturaPage from './pages/JefaturaPage';
import LoginPage from './pages/LoginPage';
import PerfilPage from './pages/PerfilPage';
import SecretariaPage from './pages/SecretariaPage';
import SolicitudPage from './pages/SolicitudPage';
import TesoreriaPage from './pages/TesoreriaPage';

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
    <div className="flex min-h-[calc(100vh-68px)] flex-col min-[801px]:min-h-[calc(100vh-76px)]">
      <div className="flex-[1_0_auto]">
        <Outlet />
      </div>
      <FloatingJoinButton />
      <Footer images={sharedImages} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <div className="min-h-screen bg-white">
          <NavBar images={sharedImages} />

          <main className="min-h-screen pt-[68px] min-[801px]:pt-[76px]">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route element={<PublicLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/contact" element={<ContactoPage />} />
                <Route path="/contacto" element={<ContactoPage />} />
                <Route path="/about" element={<ConocenosPage />} />
                <Route path="/conocenos" element={<ConocenosPage />} />
              </Route>
              <Route path="/solicitud" element={<SolicitudPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />
              <Route path="/gestion" element={<PrivateRoute><GestionPage /></PrivateRoute>} />
              <Route path="/gestion/contenido-web" element={<WebContentRoute><ContenidoWebPage /></WebContentRoute>} />
              <Route path="/gestion/administracion" element={<AdminRoute><AdministracionPage /></AdminRoute>} />
              <Route path="/gestion/secretaria" element={<ModuleRoute moduleName="Secretaría"><SecretariaPage /></ModuleRoute>} />
              <Route path="/gestion/jefatura" element={<ModuleRoute moduleName="Jefatura"><JefaturaPage /></ModuleRoute>} />
              <Route path="/gestion/tesoreria" element={<ModuleRoute moduleName="Tesorería"><TesoreriaPage /></ModuleRoute>} />
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
