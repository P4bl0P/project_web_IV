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
  ChevronLeft,
  ChevronRight,
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
import SecretariaToolbar from '../components/secretaria/SecretariaToolbar';
import {
  INITIAL_SECRETARIA_FILTERS,
  SECRETARIA_SECTIONS,
  filterAndSortSecretariaRecords,
  getActiveFilterChips,
  type SecretariaFiltersState,
  type SecretariaTab,
} from '../utils/secretariaSearchFilter';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const TABS: { id: SecretariaTab; label: string }[] = [
  { id: 'INITIAL', label: 'Solicitudes Iniciales' },
  { id: 'WAITLIST', label: 'Lista de Espera' },
  { id: 'OFFERED', label: 'Inscripciones Pendientes' },
  { id: 'CENSUS', label: 'Censo Oficial' },
  { id: 'ARCHIVED', label: 'Bajas' },
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

  // Contadores por apartado para las pestañas
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

  // Al cambiar de apartado: si el orden actual o filtros de fecha de alta no aplican al nuevo apartado, ajustarlos
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

  // Filtrado y ordenación completos sobre todos los registros del apartado antes de paginar
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

  return (
    <div className="secretaria-page w-full min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 sm:px-8 py-6 space-y-4">
      {/* Cabecera de Secretaría */}
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
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-600">
              Gestión interna
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Secretaría</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSafeModeWhatsApp((p) => !p)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl border transition-all duration-200 active:scale-[.97] ${
              safeModeWhatsApp
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            {safeModeWhatsApp ? <Lock size={13} /> : <Unlock size={13} />}
            {safeModeWhatsApp ? 'WhatsApp Bloqueado' : 'WhatsApp Activo'}
          </button>
          {activeTab === 'CENSUS' && (
            <button
              onClick={() => setCensusFormRecord(null)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition"
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

      {/* Pestañas de apartados de Secretaría */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-[0_8px_28px_rgba(15,23,42,.04)]">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Apartados de Secretaría">
          {TABS.map((t) => {
            const isActive = activeTab === t.id;
            const count = sectionCounts[t.id];
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectTab(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[.97] ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-[0_6px_16px_rgba(79,70,229,.22)]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Buscador inteligente, filtros avanzados adaptativos y ordenación */}
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

      {/* Listado de resultados */}
      <div className="space-y-2">
        {loading ? (
          <div className="grid gap-2" aria-label="Cargando registros" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-24 rounded-2xl border border-slate-200 bg-white animate-pulse"
              >
                <div className="h-full w-full rounded-2xl bg-gradient-to-r from-transparent via-slate-100/70 to-transparent" />
              </div>
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <SearchX size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {activeChips.length > 0
                  ? 'No se han encontrado registros con los criterios actuales'
                  : `No hay registros en ${SECRETARIA_SECTIONS[activeTab].label}`}
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                {activeChips.length > 0
                  ? 'Prueba a modificar el texto de búsqueda o eliminar alguno de los filtros activos.'
                  : 'Cambia de apartado en las pestañas superiores para consultar otros registros.'}
              </p>
            </div>
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition"
              >
                <RotateCcw size={13} /> Limpiar búsqueda y filtros
              </button>
            )}
          </div>
        ) : (
          <>
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

            {/* Controles de paginación (aplicada sobre el conjunto ya filtrado y ordenado) */}
            {filteredRecords.length > PAGE_SIZE_OPTIONS[0] && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/90 px-4 py-3 shadow-[0_5px_18px_rgba(15,23,42,.03)]">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>
                    Mostrando{' '}
                    <strong className="text-slate-900">{pageOffset + 1}</strong> -{' '}
                    <strong className="text-slate-900">
                      {Math.min(pageOffset + pageSize, filteredRecords.length)}
                    </strong>{' '}
                    de <strong className="text-slate-900">{filteredRecords.length}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <label className="inline-flex items-center gap-1.5">
                    <span>Por página:</span>
                    <select
                      aria-label="Registros por página"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeCurrentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-slate-700"
                    >
                      <ChevronLeft size={14} /> Anterior
                    </button>
                    <span className="text-xs font-semibold text-slate-600 px-2">
                      Página <strong className="text-slate-900">{safeCurrentPage}</strong> de{' '}
                      <strong className="text-slate-900">{totalPages}</strong>
                    </span>
                    <button
                      type="button"
                      disabled={safeCurrentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-slate-700"
                    >
                      Siguiente <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
