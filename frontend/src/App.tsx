import { lazy, Suspense, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminRoute, AuthProvider, ModuleRoute, PrivateRoute, WebContentRoute } from './auth';
import FloatingJoinButton from './components/shared/FloatingJoinButton';
import Footer from './components/shared/Footer';
import NavBar from './components/shared/NavBar';
import { sharedImages } from './config/images/sharedImages';
import HomePage from './pages/HomePage';

const AdministracionPage = lazy(() => import('./pages/AdministracionPage'));
const ConocenosPage = lazy(() => import('./pages/ConocenosPage'));
const ContactoPage = lazy(() => import('./pages/ContactoPage'));
const ContenidoWebPage = lazy(() => import('./pages/ContenidoWebPage'));
const DynamicModulePage = lazy(() => import('./pages/DynamicModulePage'));
const GestionPage = lazy(() => import('./pages/GestionPage'));
const InscripcionMagicaPage = lazy(() => import('./pages/InscripcionMagicaPage'));
const JefaturaPage = lazy(() => import('./pages/JefaturaPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PerfilPage = lazy(() => import('./pages/PerfilPage'));
const SecretariaPage = lazy(() => import('./pages/SecretariaPage'));
const SolicitudPage = lazy(() => import('./pages/SolicitudPage'));
const TesoreriaPage = lazy(() => import('./pages/TesoreriaPage'));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-3 border-[#01317b]/20 border-t-[#01317b]"
        role="status"
        aria-label="Cargando página"
      />
    </div>
  );
}

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
            <Suspense fallback={<RouteLoadingFallback />}>
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
                <Route path="/gestion/secretaria" element={<ModuleRoute moduleKey="secretaria" moduleLabel="Secretaría"><SecretariaPage /></ModuleRoute>} />
                <Route path="/gestion/jefatura" element={<ModuleRoute moduleKey="jefatura" moduleLabel="Jefatura"><JefaturaPage /></ModuleRoute>} />
                <Route path="/gestion/tesoreria" element={<ModuleRoute moduleKey="tesoreria" moduleLabel="Tesorería"><TesoreriaPage /></ModuleRoute>} />
                <Route path="/gestion/modulo/:moduleKey" element={<PrivateRoute><DynamicModulePage /></PrivateRoute>} />
                <Route path="/inscripcion/:token" element={<InscripcionMagicaPage />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
