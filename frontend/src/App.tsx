import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      {/* pt-14 añade un margen superior igual al alto de la NavBar fija */}
      <div className="min-h-screen bg-gray-50 pt-14">
        
        <NavBar />
        
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<div className="p-8">Página Conócenos (En construcción)</div>} />
            <Route path="/contact" element={<div className="p-8">Página de Contacto (En construcción)</div>} />
            {/* Si alguna ruta no existe, redirige a inicio */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;