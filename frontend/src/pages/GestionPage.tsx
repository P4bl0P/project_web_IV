import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  Send,
  MessageCircle,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  FileCheck2,
  UserCheck,
  Archive,
} from 'lucide-react';
import {
  applicationsApi,
  type ApplicantRecord,
  type ApplicationStatus,
} from '../services/api';

type TabType = 'WAITLIST' | 'OFFERED' | 'CENSUS' | 'ARCHIVED';

const BRANCHES = ['Todas', 'Castores', 'Lobatos', 'Rangers', 'Pioneros', 'Rutas'];

export default function GestionPage() {
  const [records, setRecords] = useState<ApplicantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('WAITLIST');
  const [selectedBranch, setSelectedBranch] = useState<string>('Todas');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.getAll();
      setRecords(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Ratio de sexos en el Censo Oficial para la rama seleccionada (Criterio 2 del Grupo IV)
  const branchRatio = useMemo(() => {
    const censusInBranch = records.filter(
      (r) =>
        r.status === 'CENSADO' &&
        (selectedBranch === 'Todas' || r.calculatedBranch === selectedBranch),
    );
    const boys = censusInBranch.filter((r) => r.gender === 'MASCULINO').length;
    const girls = censusInBranch.filter((r) => r.gender === 'FEMENINO').length;
    return { total: censusInBranch.length, boys, girls };
  }, [records, selectedBranch]);

  // Filtrado y ordenación inteligente por prioridad y fecha de solicitud
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (selectedBranch !== 'Todas' && r.calculatedBranch !== selectedBranch) {
          return false;
        }
        if (activeTab === 'WAITLIST') {
          return r.status === 'PENDIENTE_REVISION' || r.status === 'LISTA_ESPERA';
        }
        if (activeTab === 'OFFERED') {
          return r.status === 'PLAZA_OFERTADA' || r.status === 'INSCRIPCION_COMPLETADA';
        }
        if (activeTab === 'CENSUS') {
          return r.status === 'CENSADO';
        }
        return r.status === 'BAJA';
      })
      .sort((a, b) => {
        // Primero por puntuación de criterios (Familiar, Inclusión, Otro Grupo)
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        // En empate de criterios, estricto orden de fecha de solicitud (más antiguo primero)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [records, activeTab, selectedBranch]);

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    try {
      const updated = await applicationsApi.update(id, { status });
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const handleToggleInclusion = async (record: ApplicantRecord) => {
    try {
      const updated = await applicationsApi.update(record.id, {
        socialInclusionPriority: !record.socialInclusionPriority,
      });
      setRecords((prev) => prev.map((r) => (r.id === record.id ? updated : r)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar prioridad');
    }
  };

  const handleOfferSpot = async (record: ApplicantRecord) => {
    try {
      const updated = await applicationsApi.offerSpot(record.id);
      setRecords((prev) => prev.map((r) => (r.id === record.id ? updated : r)));
      setActiveTab('OFFERED');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al ofertar plaza');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar permanentemente el registro de ${name}?`)) {
      return;
    }
    try {
      await applicationsApi.remove(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const getMagicLink = (token?: string | null) => {
    if (!token) return '';
    return `${window.location.origin}/inscripcion/${token}`;
  };

  const handleCopyLink = (record: ApplicantRecord) => {
    const link = getMagicLink(record.enrollmentToken);
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openWhatsApp = (record: ApplicantRecord) => {
    const cleanPhone = record.parent1Phone.replace(/\D/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`;
    const magicLink = getMagicLink(record.enrollmentToken);

    const message =
      `¡Hola ${record.parent1FirstName}! Soy del Kraal del Grupo IV Scout (San José de Calasanz).\n\n` +
      `Te escribimos porque tenemos plaza disponible para *${record.childFirstName}* en la rama *${record.calculatedBranch}*.\n\n` +
      `Para confirmar la plaza y rellenar la ficha médica y bancaria sin tener que repetir vuestros datos, entra en este enlace personal antes de 7 días:\n${magicLink}\n\n` +
      `¡Un saludo y Siempre Listos!`;

    const url = `https://wa.me/${phoneWithPrefix}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getExpirationBadge = (expiresAt?: string | null, status?: ApplicationStatus) => {
    if (status === 'INSCRIPCION_COMPLETADA') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
          <FileCheck2 size={13} /> Rellenada por los padres (Lista para Censar)
        </span>
      );
    }
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
          🔴 Plazo vencido (hace {Math.abs(diffDays)} días)
        </span>
      );
    }
    if (diffDays <= 2) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
          🟡 Caduca pronto (quedan {diffDays} días)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
        🟢 En plazo (quedan {diffDays} días)
      </span>
    );
  };

  const counts = {
    waitlist: records.filter(
      (r) => r.status === 'PENDIENTE_REVISION' || r.status === 'LISTA_ESPERA',
    ).length,
    offered: records.filter(
      (r) => r.status === 'PLAZA_OFERTADA' || r.status === 'INSCRIPCION_COMPLETADA',
    ).length,
    census: records.filter((r) => r.status === 'CENSADO').length,
    archived: records.filter((r) => r.status === 'BAJA').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Cabecera y Resumen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Panel de Gestión del Kraal · Grupo IV
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Lista de espera priorizada según los Criterios de Admisión, enlaces mágicos y Censo Oficial.
          </p>
        </div>
        <button
          onClick={loadData}
          className="self-start md:self-auto inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar datos
        </button>
      </div>

      {/* Pestañas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setActiveTab('WAITLIST')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'WAITLIST'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Clock size={20} />
            <span className="text-2xl font-extrabold">{counts.waitlist}</span>
          </div>
          <p className="text-sm font-semibold mt-2">1. Lista de Espera</p>
          <p className={`text-xs ${activeTab === 'WAITLIST' ? 'text-indigo-100' : 'text-gray-500'}`}>
            Ordenada por criterios y fecha
          </p>
        </button>

        <button
          onClick={() => setActiveTab('OFFERED')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'OFFERED'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Send size={20} />
            <span className="text-2xl font-extrabold">{counts.offered}</span>
          </div>
          <p className="text-sm font-semibold mt-2">2. Plazas Ofertadas</p>
          <p className={`text-xs ${activeTab === 'OFFERED' ? 'text-indigo-100' : 'text-gray-500'}`}>
            Seguimiento de Enlaces Mágicos
          </p>
        </button>

        <button
          onClick={() => setActiveTab('CENSUS')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'CENSUS'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Users size={20} />
            <span className="text-2xl font-extrabold">{counts.census}</span>
          </div>
          <p className="text-sm font-semibold mt-2">3. Censo Oficial</p>
          <p className={`text-xs ${activeTab === 'CENSUS' ? 'text-indigo-100' : 'text-gray-500'}`}>
            Educandos activos del Grupo IV
          </p>
        </button>

        <button
          onClick={() => setActiveTab('ARCHIVED')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'ARCHIVED'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Archive size={20} />
            <span className="text-2xl font-extrabold">{counts.archived}</span>
          </div>
          <p className="text-sm font-semibold mt-2">4. Bajas / Archivo</p>
          <p className={`text-xs ${activeTab === 'ARCHIVED' ? 'text-indigo-100' : 'text-gray-500'}`}>
            Renuncias y antiguos miembros
          </p>
        </button>
      </div>

      {/* Barra de Filtro por Rama + Indicador de Ratio de Sexos en Censo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-1">
            Filtrar por Rama actual:
          </span>
          {BRANCHES.map((branch) => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedBranch === branch
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {branch}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs">
          <span className="font-semibold text-slate-700">
            Ratio actual en Censo ({selectedBranch}):
          </span>
          <span className="font-bold text-blue-700">👦 {branchRatio.boys} Niños</span>
          <span className="font-bold text-pink-700">👧 {branchRatio.girls} Niñas</span>
          <span className="text-slate-500">(Total: {branchRatio.total})</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Listado de Tarjetas / Filas */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          Cargando solicitudes y censo...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          No hay registros en esta pestaña para la rama <strong>{selectedBranch}</strong>.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record, index) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-indigo-200 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Columna Izquierda: Datos del Educando y Criterios */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeTab === 'WAITLIST' && (
                      <span className="bg-gray-900 text-white text-xs font-bold px-2.5 py-0.5 rounded-lg">
                        #{index + 1}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-gray-900">
                      {record.childFirstName} {record.childLastName}
                    </h3>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {record.calculatedBranch} ({record.currentAge} años)
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                      {record.gender === 'MASCULINO' ? '👦 Niño' : record.gender === 'FEMENINO' ? '👧 Niña' : 'Otro'}
                    </span>

                    {record.status === 'PENDIENTE_REVISION' && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        Nueva Solicitud (Sin revisar)
                      </span>
                    )}
                  </div>

                  {/* Insignias de Criterios de Admisión del Grupo IV */}
                  <div className="flex flex-wrap items-center gap-2">
                    {record.hasFamilyInGroup && (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold px-2.5 py-1 rounded-lg">
                        <Sparkles size={13} /> Prioridad Familiar: {record.familyMemberDetails}
                      </span>
                    )}
                    {record.comesFromOtherGroup && (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold px-2.5 py-1 rounded-lg">
                        <ShieldAlert size={13} /> Traslado Scout: {record.originGroupDetails}
                      </span>
                    )}
                    {record.socialInclusionPriority && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-lg">
                        <HeartHandshake size={13} /> Prioridad Inclusión Social
                      </span>
                    )}
                    {activeTab === 'OFFERED' && getExpirationBadge(record.tokenExpiresAt, record.status)}
                  </div>

                  {/* Datos de contacto rápidos */}
                  <div className="text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                    <span>
                      <strong>Solicitud:</strong>{' '}
                      {new Date(record.createdAt).toLocaleDateString('es-ES')}
                    </span>
                    <span>
                      <strong>Tutor 1:</strong> {record.parent1FirstName} {record.parent1LastName} (
                      {record.parent1Phone} · {record.parent1Email})
                    </span>
                    <span>
                      <strong>Domicilio:</strong> {record.streetAddress} {record.streetNumber || ''},{' '}
                      {record.postalCode} {record.municipality}
                    </span>
                  </div>

                  {record.motivation && (
                    <p className="text-xs text-gray-500 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      "{record.motivation}"
                    </p>
                  )}
                </div>

                {/* Columna Derecha: Botonera de Acciones según la Pestaña */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeTab === 'WAITLIST' && (
                    <>
                      <button
                        onClick={() => handleToggleInclusion(record)}
                        title="Activar/Desactivar prioridad por inclusión social tras estudio del Kraal"
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                          record.socialInclusionPriority
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <HeartHandshake size={15} />
                        Inclusión
                      </button>

                      {record.status === 'PENDIENTE_REVISION' && (
                        <button
                          onClick={() => handleStatusChange(record.id, 'LISTA_ESPERA')}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={15} />
                          Validar a Lista Espera
                        </button>
                      )}

                      <button
                        onClick={() => handleOfferSpot(record)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Send size={15} />
                        Ofertar Plaza (Crear Link)
                      </button>
                    </>
                  )}

                  {activeTab === 'OFFERED' && (
                    <>
                      <button
                        onClick={() => openWhatsApp(record)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <MessageCircle size={15} />
                        Enviar Link por WhatsApp
                      </button>

                      <button
                        onClick={() => handleCopyLink(record)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                      >
                        {copiedId === record.id ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                        {copiedId === record.id ? 'Copiado' : 'Copiar Link'}
                      </button>

                      {record.status === 'INSCRIPCION_COMPLETADA' && (
                        <button
                          onClick={() => handleStatusChange(record.id, 'CENSADO')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
                        >
                          <UserCheck size={15} />
                          Aprobar y Censar
                        </button>
                      )}
                    </>
                  )}

                  {activeTab !== 'ARCHIVED' ? (
                    <button
                      onClick={() => handleStatusChange(record.id, 'BAJA')}
                      title="Archivar / Dar de baja"
                      className="text-gray-500 hover:text-amber-700 hover:bg-amber-50 p-2 rounded-xl transition"
                    >
                      <Archive size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(record.id, 'LISTA_ESPERA')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
                    >
                      Restaurar a Lista de Espera
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleDelete(record.id, `${record.childFirstName} ${record.childLastName}`)
                    }
                    title="Eliminar registro permanentemente"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}