import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import SolicitudPage from './pages/SolicitudPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pt-14">
        <NavBar />

        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/solicitud" element={<SolicitudPage />} />
            <Route path="/contact" element={<SolicitudPage />} />
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