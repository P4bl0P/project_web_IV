import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Lock, Unlock, UserPlus } from 'lucide-react';
import { applicationsApi, type ApplicantRecord, type ApplicationStatus } from '../services/api';
import ApplicantCard from '../components/secretaria/ApplicantCard';
import SecretariaCensoForm from '../components/secretaria/SecretariaCensoForm';

type TabType = 'WAITLIST' | 'OFFERED' | 'CENSUS' | 'ARCHIVED';
const BRANCHES = ['Todas', 'Castores', 'Lobatos', 'Rangers', 'Pioneros', 'Rutas'];

export default function SecretariaPage() {
  const [records, setRecords] = useState<ApplicantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('WAITLIST');
  const [selectedBranch, setSelectedBranch] = useState('Todas');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [safeModeWhatsApp, setSafeModeWhatsApp] = useState(true);
  const [censusFormRecord, setCensusFormRecord] = useState<ApplicantRecord | null | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      setRecords(await applicationsApi.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load the remote collection once when the module opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (selectedBranch !== 'Todas' && r.calculatedBranch !== selectedBranch) return false;
        if (activeTab === 'WAITLIST') return r.status === 'PENDIENTE_REVISION' || r.status === 'LISTA_ESPERA';
        if (activeTab === 'OFFERED') return r.status === 'PLAZA_OFERTADA' || r.status === 'INSCRIPCION_COMPLETADA';
        if (activeTab === 'CENSUS') return r.status === 'CENSADO';
        return r.status === 'BAJA';
      })
      .sort((a, b) =>
        b.priorityScore !== a.priorityScore
          ? b.priorityScore - a.priorityScore
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }, [records, activeTab, selectedBranch]);

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    const updated = await applicationsApi.update(id, { status });
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const handleToggleInclusion = async (record: ApplicantRecord) => {
    const updated = await applicationsApi.update(record.id, {
      socialInclusionPriority: !record.socialInclusionPriority,
    });
    setRecords((prev) => prev.map((r) => (r.id === record.id ? updated : r)));
  };

  const handleOfferSpot = async (record: ApplicantRecord) => {
    const updated = await applicationsApi.offerSpot(record.id);
    setRecords((prev) => prev.map((r) => (r.id === record.id ? updated : r)));
    setActiveTab('OFFERED');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar a ${name}?`)) return;
    await applicationsApi.remove(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCensusSaved = (saved: ApplicantRecord) => {
    setRecords((prev) => {
      const exists = prev.some((record) => record.id === saved.id);
      return exists ? prev.map((record) => (record.id === saved.id ? saved : record)) : [...prev, saved];
    });
    setActiveTab('CENSUS');
    setCensusFormRecord(undefined);
  };

  const handleCopyLink = (record: ApplicantRecord) => {
    if (!record.enrollmentToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/inscripcion/${record.enrollmentToken}`);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenWhatsApp = (record: ApplicantRecord) => {
    const link = `${window.location.origin}/inscripcion/${record.enrollmentToken}`;
    const msg = `¡Hola ${record.parent1FirstName}! Tenemos plaza para *${record.childFirstName}* en *${record.calculatedBranch}*. Completa su inscripción aquí:\n${link}`;
    if (safeModeWhatsApp) {
      alert(`[MODO SEGURO]\nPara: ${record.parent1Phone}\n\n${msg}`);
      return;
    }
    const phone = record.parent1Phone.replace(/\D/g, '').replace(/^(?!34)/, '34');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'WAITLIST', label: 'Lista de Espera' },
    { id: 'OFFERED', label: 'Plazas Ofertadas' },
    { id: 'CENSUS', label: 'Censo Oficial' },
    { id: 'ARCHIVED', label: 'Bajas' },
  ];

  return (
    <div className="secretaria-page w-full min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 sm:px-8 py-6 space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_8px_28px_rgba(15,23,42,.055)]">
        <div className="flex items-center gap-3">
          <Link
            to="/gestion"
            aria-label="Volver a gestión"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all duration-200"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-600">Gestión interna</p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Secretaría</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSafeModeWhatsApp((p) => !p)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl border transition-all duration-200 active:scale-[.97] ${
              safeModeWhatsApp ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            {safeModeWhatsApp ? <Lock size={13} /> : <Unlock size={13} />}
            {safeModeWhatsApp ? 'WhatsApp Bloqueado' : 'WhatsApp Activo'}
          </button>
          {activeTab === 'CENSUS' && (
            <button
              onClick={() => setCensusFormRecord(null)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              <UserPlus size={13} /> Nuevo educando
            </button>
          )}
          <button
            onClick={loadData}
            aria-label="Actualizar listado"
            className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 active:scale-95 text-slate-600 transition-all duration-200"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {censusFormRecord !== undefined && (
        <SecretariaCensoForm
          record={censusFormRecord}
          onClose={() => setCensusFormRecord(undefined)}
          onSaved={handleCensusSaved}
        />
      )}

      {/* Pestañas y Filtro de Ramas */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-[0_8px_28px_rgba(15,23,42,.04)]">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              aria-pressed={activeTab === t.id}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[.97] ${
                activeTab === t.id ? 'bg-indigo-600 text-white shadow-[0_6px_16px_rgba(79,70,229,.22)]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {BRANCHES.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              aria-pressed={selectedBranch === b}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-[.97] ${
                selectedBranch === b ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          <div className="grid gap-2" aria-label="Cargando registros" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 rounded-2xl border border-slate-200 bg-white animate-pulse">
                <div className="h-full w-full rounded-2xl bg-gradient-to-r from-transparent via-slate-100/70 to-transparent" />
              </div>
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-bold text-slate-700">No hay registros en esta vista</p>
            <p className="mt-1 text-xs text-slate-500">Prueba otra sección o cambia el filtro de sección scout.</p>
          </div>
        ) : (
          filteredRecords.map((record, index) => (
            <ApplicantCard
              key={record.id}
              record={record}
              index={index}
              activeTab={activeTab}
              safeModeWhatsApp={safeModeWhatsApp}
              copiedId={copiedId}
              onToggleInclusion={handleToggleInclusion}
              onStatusChange={handleStatusChange}
              onOfferSpot={handleOfferSpot}
              onOpenWhatsApp={handleOpenWhatsApp}
              onCopyLink={handleCopyLink}
              onDelete={handleDelete}
              onEditCensus={(record) => setCensusFormRecord(record)}
            />
          ))
        )}
      </div>
    </div>
  );
}