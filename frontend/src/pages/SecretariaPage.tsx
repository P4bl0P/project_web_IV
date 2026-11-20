import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Lock,
  Unlock,
  UserPlus,
  SearchX,
  RotateCcw,
  Inbox,
  Clock,
  FileText,
  Users,
  Archive,
} from 'lucide-react';
import {
  applicationsApi,
  type ApplicantRecord,
  type ApplicationStatus,
  type SortField,
  type SortOrder,
} from '../services/api';
import ApplicantCard from '../components/secretaria/ApplicantCard';
import SecretariaCensoForm from '../components/secretaria/SecretariaCensoForm';
import SecretariaPagination from '../components/secretaria/SecretariaPagination';
import SecretariaToolbar from '../components/secretaria/SecretariaToolbar';
import { SecButton } from '../components/secretaria/secretariaTheme';
import {
  secButtonClass,
  secTokens,
} from '../components/secretaria/secretariaTokens';
import {
  INITIAL_SECRETARIA_FILTERS,
  SECRETARIA_SECTIONS,
  filterAndSortSecretariaRecords,
  getActiveFilterChips,
  type SecretariaFiltersState,
  type SecretariaTab,
} from '../utils/secretariaSearchFilter';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const TABS: {
  id: SecretariaTab;
  label: string;
  icon: typeof Inbox;
}[] = [
  { id: 'INITIAL', label: 'Solicitudes Iniciales', icon: Inbox },
  { id: 'WAITLIST', label: 'Lista de Espera', icon: Clock },
  { id: 'OFFERED', label: 'Inscripciones Pendientes', icon: FileText },
  { id: 'CENSUS', label: 'Censo Oficial', icon: Users },
  { id: 'ARCHIVED', label: 'Bajas', icon: Archive },
];

export default function SecretariaPage() {
  const [records, setRecords] = useState<ApplicantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SecretariaTab>('WAITLIST');
  const [filters, setFilters] = useState<SecretariaFiltersState>(INITIAL_SECRETARIA_FILTERS);
  const [sortBy, setSortBy] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [safeModeWhatsApp, setSafeModeWhatsApp] = useState(true);
  const [censusFormRecord, setCensusFormRecord] = useState<
    ApplicantRecord | null | undefined
  >(undefined);

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

  const sectionCounts = useMemo(() => {
    const counts: Record<SecretariaTab, number> = {
      INITIAL: 0,
      WAITLIST: 0,
      OFFERED: 0,
      CENSUS: 0,
      ARCHIVED: 0,
    };
    for (const r of records) {
      if (r.status === 'PENDIENTE_REVISION') counts.INITIAL++;
      else if (r.status === 'LISTA_ESPERA') counts.WAITLIST++;
      else if (r.status === 'PLAZA_OFERTADA' || r.status === 'INSCRIPCION_COMPLETADA')
        counts.OFFERED++;
      else if (r.status === 'CENSADO') counts.CENSUS++;
      else if (r.status === 'BAJA') counts.ARCHIVED++;
    }
    return counts;
  }, [records]);

  const handleSelectTab = (nextTab: SecretariaTab) => {
    setActiveTab(nextTab);
    setCurrentPage(1);
    const nextSchema = SECRETARIA_SECTIONS[nextTab];
    if (!nextSchema.capabilities.admittedAt && sortBy === 'admittedAt') {
      setSortBy(nextSchema.defaultSort.sortBy);
      setSortOrder(nextSchema.defaultSort.sortOrder);
    }
  };

  const handleChangeFilter = <K extends keyof SecretariaFiltersState>(
    key: K,
    value: SecretariaFiltersState[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilter = (key: keyof SecretariaFiltersState) => {
    setFilters((prev) => ({
      ...prev,
      [key]: INITIAL_SECRETARIA_FILTERS[key],
    }));
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters(INITIAL_SECRETARIA_FILTERS);
    setCurrentPage(1);
  };

  const handleChangeSort = (nextSortBy: SortField, nextSortOrder: SortOrder) => {
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setCurrentPage(1);
  };

  const filteredRecords = useMemo(() => {
    return filterAndSortSecretariaRecords(records, activeTab, filters, sortBy, sortOrder);
  }, [records, activeTab, filters, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, safeCurrentPage, pageSize]);

  const activeChips = useMemo(
    () => getActiveFilterChips(filters, activeTab),
    [filters, activeTab],
  );

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
    handleSelectTab('OFFERED');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar a ${name}?`)) return;
    await applicationsApi.remove(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCensusSaved = (saved: ApplicantRecord) => {
    setRecords((prev) => {
      const exists = prev.some((record) => record.id === saved.id);
      return exists
        ? prev.map((record) => (record.id === saved.id ? saved : record))
        : [...prev, saved];
    });
    handleSelectTab('CENSUS');
    setCensusFormRecord(undefined);
  };

  const handleCopyLink = (record: ApplicantRecord) => {
    if (!record.enrollmentToken) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/inscripcion/${record.enrollmentToken}`,
    );
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

  const pageOffset = (safeCurrentPage - 1) * pageSize;
  const activeSectionMeta = SECRETARIA_SECTIONS[activeTab];

  return (
    <div className="w-full min-h-[calc(100vh-4.75rem)] bg-gradient-to-b from-[#f8fafd] to-[#f2f5fa] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-[1220px] mx-auto space-y-4">
        <header className={`${secTokens.surface} px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to="/gestion"
              aria-label="Volver a gestión"
              className={secButtonClass({ variant: 'secondary', size: 'icon' })}
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#e22328]">
                  Gestión interna
                </span>
                <span className="text-slate-300 text-xs" aria-hidden="true">·</span>
                <span className="text-[11px] font-medium text-slate-500 truncate">
                  {activeSectionMeta.label}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#000254]">
                Secretaría
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSafeModeWhatsApp((p) => !p)}
              className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-xs font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                safeModeWhatsApp
                  ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/80'
                  : 'bg-rose-50/90 text-rose-800 border-rose-200/90 hover:bg-rose-100/80'
              }`}
            >
              {safeModeWhatsApp ? <Lock size={13} /> : <Unlock size={13} />}
              <span>{safeModeWhatsApp ? 'WhatsApp Bloqueado' : 'WhatsApp Activo'}</span>
            </button>

            {activeTab === 'CENSUS' && (
              <SecButton
                variant="primary"
                size="md"
                onClick={() => setCensusFormRecord(null)}
              >
                <UserPlus size={14} />
                <span>Nuevo educando</span>
              </SecButton>
            )}

            <SecButton
              variant="secondary"
              size="icon"
              onClick={loadData}
              aria-label="Actualizar listado"
              title="Actualizar listado"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-[#01317b]' : ''} />
            </SecButton>
          </div>
        </header>

        {censusFormRecord !== undefined && (
          <SecretariaCensoForm
            record={censusFormRecord}
            onClose={() => setCensusFormRecord(undefined)}
            onSaved={handleCensusSaved}
          />
        )}

        <div className={`${secTokens.surface} p-2`}>
          <div
            className="flex flex-wrap sm:flex-nowrap items-center gap-1 bg-[#f2f4f8] p-1 rounded-xl overflow-x-auto"
            role="tablist"
            aria-label="Apartados de Secretaría"
          >
            {TABS.map((t) => {
              const isActive = activeTab === t.id;
              const count = sectionCounts[t.id];
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectTab(t.id)}
                  className={`flex-1 min-w-fit inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-[10px] text-xs font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#000254] shadow-[0_2px_8px_rgba(0,2,84,0.08),0_1px_2px_rgba(12,25,51,0.04)]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon
                    size={13}
                    className={isActive ? 'text-[#01317b] shrink-0' : 'text-slate-400 shrink-0'}
                  />
                  <span>{t.label}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold transition-colors ${
                      isActive
                        ? 'bg-[#01317b] text-white'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <SecretariaToolbar
          activeTab={activeTab}
          filters={filters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          totalMatchingCount={filteredRecords.length}
          totalSectionCount={sectionCounts[activeTab]}
          onChangeFilter={handleChangeFilter}
          onClearFilter={handleClearFilter}
          onClearAllFilters={handleClearAllFilters}
          onChangeSort={handleChangeSort}
        />

        <div className="space-y-2.5">
          {loading ? (
            <div className="grid gap-2.5" aria-label="Cargando registros" aria-busy="true">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 rounded-2xl border border-slate-200/80 bg-white p-5 flex items-center justify-between gap-4 animate-pulse"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-44 rounded-lg bg-slate-200/70" />
                      <div className="h-5 w-20 rounded-full bg-slate-100" />
                    </div>
                    <div className="h-3.5 w-3/4 max-w-md rounded-md bg-slate-100" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="h-8 w-24 rounded-xl bg-slate-100" />
                    <div className="h-8 w-24 rounded-xl bg-slate-200/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className={`${secTokens.surface} px-6 py-14 text-center space-y-3.5`}>
              <div className="w-12 h-12 rounded-2xl bg-[#01317b]/[0.07] text-[#01317b] flex items-center justify-center mx-auto">
                <SearchX size={22} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#0c1933]">
                  {activeChips.length > 0
                    ? 'No se han encontrado registros con los criterios actuales'
                    : `No hay registros en ${SECRETARIA_SECTIONS[activeTab].label}`}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {activeChips.length > 0
                    ? 'Prueba a modificar el texto de búsqueda o eliminar alguno de los filtros activos.'
                    : 'Cambia de apartado en las pestañas superiores para consultar otros registros.'}
                </p>
              </div>
              {activeChips.length > 0 && (
                <div className="pt-1">
                  <SecButton
                    variant="secondary"
                    size="md"
                    onClick={handleClearAllFilters}
                  >
                    <RotateCcw size={13} />
                    <span>Limpiar búsqueda y filtros</span>
                  </SecButton>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {paginatedRecords.map((record, index) => (
                  <ApplicantCard
                    key={record.id}
                    record={record}
                    index={pageOffset + index}
                    activeTab={activeTab}
                    safeModeWhatsApp={safeModeWhatsApp}
                    copiedId={copiedId}
                    onToggleInclusion={handleToggleInclusion}
                    onStatusChange={handleStatusChange}
                    onOfferSpot={handleOfferSpot}
                    onOpenWhatsApp={handleOpenWhatsApp}
                    onCopyLink={handleCopyLink}
                    onDelete={handleDelete}
                    onEditCensus={(rec) => setCensusFormRecord(rec)}
                  />
                ))}
              </div>

              {filteredRecords.length > PAGE_SIZE_OPTIONS[0] && (
                <SecretariaPagination
                  pageOffset={pageOffset}
                  pageSize={pageSize}
                  totalCount={filteredRecords.length}
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageSizeChange={(nextSize) => {
                    setPageSize(nextSize);
                    setCurrentPage(1);
                  }}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
