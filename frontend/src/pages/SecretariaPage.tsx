import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, RefreshCw, Lock, Unlock, UserPlus } from 'lucide-react';
import { applicationsApi, type ApplicantRecord, type ApplicationStatus, type MemberType } from '../services/api';
import ApplicantCard from '../components/secretaria/ApplicantCard';
import ExcelImportModal from '../components/secretaria/ExcelImportModal';
import CensusMemberModal from '../components/secretaria/CensusMemberModal';
import { useAuth } from '../auth';

type TabType = 'WAITLIST' | 'OFFERED' | 'CENSUS' | 'ARCHIVED';
const BRANCHES = ['Todas', 'Castores', 'Lobatos', 'Rangers', 'Pioneros', 'Rutas'];

export default function SecretariaPage() {
  const { user } = useAuth();
  const censusPermissions = user?.role?.permissions?.find((permission) => permission.module.name === 'Secretaría');
  const canCreate = Boolean(user?.isSuperAdmin || censusPermissions?.canCreate);
  const canUpdate = Boolean(user?.isSuperAdmin || censusPermissions?.canUpdate);
  const canDelete = Boolean(user?.isSuperAdmin || censusPermissions?.canDelete);
  const [records, setRecords] = useState<ApplicantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('WAITLIST');
  const [selectedBranch, setSelectedBranch] = useState('Todas');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [safeModeWhatsApp, setSafeModeWhatsApp] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [memberFilter, setMemberFilter] = useState<'TODOS' | MemberType>('TODOS');
  const [search, setSearch] = useState('');
  const [censusModal, setCensusModal] = useState<{ record?: ApplicantRecord; readOnly?: boolean } | null>(null);

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
        if (search && `${r.childFirstName} ${r.childLastName} ${r.parent1Email}`.toLowerCase().includes(search.toLowerCase()) === false) return false;
        if (activeTab === 'CENSUS' && memberFilter !== 'TODOS' && r.memberType !== memberFilter) return false;
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
  }, [records, activeTab, selectedBranch, memberFilter, search]);

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
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/gestion" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Secretaría</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'CENSUS' && canCreate && <button
            onClick={() => setCensusModal({})}
            className="inline-flex items-center gap-1.5 bg-[#01317b] text-white text-xs font-bold px-3 py-2 rounded-lg"
          >
            <UserPlus size={13} /> Añadir al censo
          </button>}
          <button
            onClick={() => setSafeModeWhatsApp((p) => !p)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border ${
              safeModeWhatsApp ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {safeModeWhatsApp ? <Lock size={13} /> : <Unlock size={13} />}
            {safeModeWhatsApp ? 'WhatsApp Bloqueado' : 'WhatsApp Activo'}
          </button>
          {canCreate && <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 text-xs font-bold px-3 py-2 rounded-lg"
          >
            <Upload size={13} /> Importar Excel
          </button>}
          <button
            onClick={loadData}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {showImportModal && (
        <ExcelImportModal onClose={() => setShowImportModal(false)} onSuccess={loadData} />
      )}
      {censusModal && (
        <CensusMemberModal
          record={censusModal.record}
          readOnly={censusModal.readOnly}
          onClose={() => setCensusModal(null)}
          onSaved={(saved) => setRecords((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])}
        />
      )}

      {/* Pestañas y Filtro de Ramas */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                selectedBranch === b ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar persona o correo…" className="min-w-[220px] flex-1 rounded-lg border px-3 py-2 text-sm" />
        {(['TODOS', 'EDUCANDO', 'RESPONSABLE'] as const).map((type) => <button key={type} onClick={() => setMemberFilter(type)} className={`rounded-lg px-3 py-2 text-xs font-bold ${memberFilter === type ? 'bg-[#e22328] text-white' : 'bg-slate-100 text-slate-600'}`}>{type === 'TODOS' ? 'Todos' : type === 'EDUCANDO' ? 'Educandos' : 'Responsables'}</button>)}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filteredRecords.map((record, index) => (
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
            onView={() => setCensusModal({ record, readOnly: true })}
            onEdit={() => setCensusModal({ record })}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        ))}
      </div>
    </div>
  );
}