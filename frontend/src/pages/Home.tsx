import { Link } from 'react-router-dom';
import { Compass, FileEdit } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center">
      <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <Compass size={36} />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
        Grupo IV Scout Montequinto
      </h1>
      <p className="mt-3 text-lg text-gray-600 max-w-xl">
        Grupo Scout San José de Calasanz · Educando en el tiempo libre desde 1980 en Montequinto (Dos Hermanas).
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          to="/solicitud"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-md transition"
        >
          <FileEdit size={18} />
          Solicitar Plaza (Lista de Espera)
        </Link>
      </div>
    </div>
  );
}