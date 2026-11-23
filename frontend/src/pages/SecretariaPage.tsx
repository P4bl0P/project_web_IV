import { useState, useEffect, useCallback, useMemo } from 'react';
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
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { getModuleCapabilities, useAuth } from '../auth';
import {
  applicationsApi,
  type ApplicantRecord,
  type ClosureReason,
  type PaginatedApplicationsResponse,
  type RecordStage,
  type SortField,
  type SortOrder,
} from '../services/api';
import { generateOfficialScoutPdf } from '../utils/pdfGenerator';
import {
  INITIAL_SECRETARIA_FILTERS,
  SECRETARIA_SECTIONS,
  getActiveFilterChips,
  type SecretariaFiltersState,
  type SecretariaTab,
} from '../utils/secretariaSearchFilter';
import ApplicantCard from '../components/secretaria/ApplicantCard';
import ApplicantDetailModal from '../components/secretaria/ApplicantDetailModal';
import SecretariaCensoForm from '../components/secretaria/SecretariaCensoForm';
import SecretariaConfirmModal, {
  type SecretariaConfirmAction,
} from '../components/secretaria/SecretariaConfirmModal';
import SecretariaPagination from '../components/secretaria/SecretariaPagination';
import SecretariaToolbar from '../components/secretaria/SecretariaToolbar';
import { SecButton } from '../components/secretaria/secretariaTheme';
import { secButtonClass, secTokens } from '../components/secretaria/secretariaTokens';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const TAB_TO_STAGE: Record<SecretariaTab, RecordStage> = {
  INITIAL: 'INITIAL',
  WAITLIST: 'WAITLIST',
  OFFERED: 'PENDING_ENROLLMENT',
  CENSUS: 'CENSUS',
  ARCHIVED: 'ARCHIVED',
};

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
  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete } = getModuleCapabilities(user, 'Secretaría');

  const [pageData, setPageData] = useState<PaginatedApplicationsResponse>({
    items: [],
    totalMatching: 0,
    page: 1,
    pageSize: 25,
    totalPages: 1,
    sectionCounts: { INITIAL: 0, WAITLIST: 0, OFFERED: 0, CENSUS: 0, ARCHIVED: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SecretariaTab>('WAITLIST');
  const [filters, setFilters] = useState<SecretariaFiltersState>(INITIAL_SECRETARIA_FILTERS);
  const [sortBy, setSortBy] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [safeModeWhatsApp, setSafeModeWhatsApp] = useState(true);
  const [censusFormRecord, setCensusFormRecord] = useState<ApplicantRecord | null | undefined>(
    undefined,
  );
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<SecretariaConfirmAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [reloadTick, setReloadTick] = useState(0);

  const notify = useCallback((tone: 'success' | 'error', text: string) => {
    setFeedback({ tone, text });
  }, []);

  useEffect(() => {
    if (!feedback || feedback.tone !== 'success') return;
    const timer = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    let cancelled = false;
    applicationsApi
      .getPaginated({
        stage: TAB_TO_STAGE[activeTab],
        enrollmentSubStatus:
          activeTab === 'OFFERED' ? filters.enrollmentSubStatus : undefined,
        search: filters.search || undefined,
        branch: filters.branch !== 'Todas' ? filters.branch : undefined,
        gender: filters.gender || undefined,
        minAge: filters.minAge !== '' ? Number(filters.minAge) : undefined,
        maxAge: filters.maxAge !== '' ? Number(filters.maxAge) : undefined,
        birthDateFrom: filters.birthDateFrom || undefined,
        birthDateTo: filters.birthDateTo || undefined,
        tutorName: filters.tutorName || undefined,
        email: filters.email || undefined,
        phone: filters.phone || undefined,
        admittedFrom:
          SECRETARIA_SECTIONS[activeTab].capabilities.admittedAt && filters.admittedFrom
            ? filters.admittedFrom
            : undefined,
        admittedTo:
          SECRETARIA_SECTIONS[activeTab].capabilities.admittedAt && filters.admittedTo
            ? filters.admittedTo
            : undefined,
        incompleteOnly: filters.incompleteOnly ? true : undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      })
      .then((response) => {
        if (!cancelled) setPageData(response);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          notify(
            'error',
            reason instanceof Error ? reason.message : 'No se pudieron cargar los registros.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, filters, sortBy, sortOrder, currentPage, pageSize, reloadTick, notify]);

  const triggerReload = () => {
    setLoading(true);
    setReloadTick((t) => t + 1);
  };

  const handleSelectTab = (nextTab: SecretariaTab) => {
    setLoading(true);
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
    setLoading(true);
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilter = (key: keyof SecretariaFiltersState) => {
    setLoading(true);
    setFilters((prev) => ({ ...prev, [key]: INITIAL_SECRETARIA_FILTERS[key] }));
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setLoading(true);
    setFilters(INITIAL_SECRETARIA_FILTERS);
    setCurrentPage(1);
  };

  const handleChangeSort = (nextSortBy: SortField, nextSortOrder: SortOrder) => {
    setLoading(true);
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setCurrentPage(1);
  };

  const activeChips = useMemo(
    () => getActiveFilterChips(filters, activeTab),
    [filters, activeTab],
  );

  const handleToggleInclusion = async (record: ApplicantRecord) => {
    try {
      const updated = await applicationsApi.update(record.id, {
        socialInclusionPriority: !record.socialInclusionPriority,
      });
      setPageData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === record.id ? updated : item)),
      }));
      notify(
        'success',
        updated.socialInclusionPriority
          ? `Prioridad de inclusión activada para ${record.childFirstName}.`
          : `Prioridad de inclusión retirada de ${record.childFirstName}.`,
      );
      triggerReload();
    } catch (reason) {
      notify(
        'error',
        reason instanceof Error ? reason.message : 'No se pudo actualizar la prioridad.',
      );
    }
  };

  const handleExecuteConfirmedAction = async (payload?: {
    closureReason?: ClosureReason;
    closureNotes?: string;
    reason?: string;
    notes?: string;
  }) => {
    if (!confirmAction || confirmAction.type === 'WHATSAPP_PREVIEW') return;
    setActionBusy(true);
    const { record } = confirmAction;

    try {
      if (confirmAction.type === 'VALIDATE') {
        await applicationsApi.validate(record.id);
        notify('success', `${record.childFirstName} ha pasado a Lista de Espera.`);
      } else if (confirmAction.type === 'OFFER_SPOT') {
        await applicationsApi.offerSpot(record.id);
        notify(
          'success',
          `Plaza ofertada a ${record.childFirstName} con enlace mágico válido por 7 días.`,
        );
        setActiveTab('OFFERED');
        setCurrentPage(1);
      } else if (confirmAction.type === 'RENEW_TOKEN') {
        await applicationsApi.renewToken(record.id);
        notify('success', `Enlace mágico renovado para ${record.childFirstName}.`);
      } else if (confirmAction.type === 'RETURN_WAITLIST') {
        await applicationsApi.returnToWaitlist(record.id, payload?.reason);
        notify('success', `${record.childFirstName} ha vuelto a Lista de Espera.`);
      } else if (confirmAction.type === 'MARK_REVIEWED') {
        await applicationsApi.markReviewed(record.id);
        notify('success', `Inscripción de ${record.childFirstName} marcada como revisada.`);
      } else if (confirmAction.type === 'ADMIT_CENSUS') {
        await applicationsApi.admitCensus(record.id);
        notify(
          'success',
          `${record.childFirstName} ha sido dado de alta en el Censo Oficial.`,
        );
        setActiveTab('CENSUS');
        setCurrentPage(1);
      } else if (confirmAction.type === 'DEACTIVATE') {
        await applicationsApi.deactivate(record.id, {
          closureReason: payload?.closureReason ?? 'OTRO',
          closureNotes: payload?.closureNotes,
        });
        notify('success', `Expediente de ${record.childFirstName} dado de baja.`);
      } else if (confirmAction.type === 'REACTIVATE') {
        await applicationsApi.reactivate(record.id, payload?.notes);
        notify('success', `Expediente de ${record.childFirstName} reactivado.`);
      } else if (confirmAction.type === 'DELETE') {
        await applicationsApi.remove(record.id);
        notify('success', `Expediente de ${record.childFirstName} eliminado permanentemente.`);
      }

      setConfirmAction(null);
      if (detailRecordId === record.id && confirmAction.type === 'DELETE') {
        setDetailRecordId(null);
      }
      triggerReload();
    } catch (reason) {
      notify(
        'error',
        reason instanceof Error ? reason.message : 'No se pudo completar la operación.',
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleCensusSaved = () => {
    setCensusFormRecord(undefined);
    setActiveTab('CENSUS');
    setCurrentPage(1);
    notify('success', 'Ficha del censo guardada correctamente.');
    triggerReload();
  };

  const handleCopyLink = (record: ApplicantRecord) => {
    if (!record.enrollmentToken) return;
    void navigator.clipboard.writeText(
      `${window.location.origin}/inscripcion/${record.enrollmentToken}`,
    );
    setCopiedId(record.id);
    notify('success', `Enlace mágico de ${record.childFirstName} copiado al portapapeles.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenWhatsApp = (record: ApplicantRecord) => {
    const link = `${window.location.origin}/inscripcion/${record.enrollmentToken}`;
    const msg = `¡Hola ${record.parent1FirstName}! Tenemos plaza para *${record.childFirstName}* en *${record.calculatedBranch}*. Completa su inscripción aquí:\n${link}`;
    if (safeModeWhatsApp) {
      setConfirmAction({
        type: 'WHATSAPP_PREVIEW',
        record,
        message: msg,
        phone: record.parent1Phone,
      });
      return;
    }
    const phone = record.parent1Phone.replace(/\D/g, '').replace(/^(?!34)/, '34');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDownloadPdf = async (record: ApplicantRecord) => {
    try {
      const detailed = await applicationsApi.getById(record.id);
      await generateOfficialScoutPdf(detailed);
    } catch (reason) {
      notify(
        'error',
        reason instanceof Error ? reason.message : 'No se pudo generar el PDF oficial.',
      );
    }
  };

  const pageOffset = (pageData.page - 1) * pageData.pageSize;
  const activeSectionMeta = SECRETARIA_SECTIONS[activeTab];

  return (
    <div className="w-full min-h-[calc(100vh-4.75rem)] bg-gradient-to-b from-[#f8fafd] to-[#f2f5fa] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-[1220px] mx-auto space-y-4">
        <header
          className={`${secTokens.surface} px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4`}
        >
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
                <span className="text-slate-300 text-xs" aria-hidden="true">
                  ·
                </span>
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

            {activeTab === 'CENSUS' && canCreate && (
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
              onClick={triggerReload}
              aria-label="Actualizar listado"
              title="Actualizar listado"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-[#01317b]' : ''} />
            </SecButton>
          </div>
        </header>

        {feedback && (
          <div
            role="status"
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium shadow-2xs ${
              feedback.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {feedback.tone === 'success' ? (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
              aria-label="Cerrar notificación"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {censusFormRecord !== undefined && (
          <SecretariaCensoForm
            record={censusFormRecord}
            onClose={() => setCensusFormRecord(undefined)}
            onSaved={handleCensusSaved}
          />
        )}

        {detailRecordId && (
          <ApplicantDetailModal
            key={detailRecordId}
            recordId={detailRecordId}
            canUpdate={canUpdate}
            onClose={() => setDetailRecordId(null)}
            onSelectRecord={(nextId) => setDetailRecordId(nextId)}
            onUpdated={() => triggerReload()}
            onRequestEditCensus={(rec) => {
              setDetailRecordId(null);
              setCensusFormRecord(rec);
            }}
            onTriggerLifecycleAction={(type, rec) => {
              setConfirmAction({ type, record: rec } as SecretariaConfirmAction);
            }}
            onNotify={notify}
          />
        )}

        {confirmAction && (
          <SecretariaConfirmModal
            action={confirmAction}
            busy={actionBusy}
            onCancel={() => setConfirmAction(null)}
            onConfirm={handleExecuteConfirmedAction}
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
              const count = pageData.sectionCounts[t.id];
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
                      isActive ? 'bg-[#01317b] text-white' : 'bg-slate-200/80 text-slate-600'
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
          totalMatchingCount={pageData.totalMatching}
          totalSectionCount={pageData.sectionCounts[activeTab]}
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
          ) : pageData.items.length === 0 ? (
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
                  <SecButton variant="secondary" size="md" onClick={handleClearAllFilters}>
                    <RotateCcw size={13} />
                    <span>Limpiar búsqueda y filtros</span>
                  </SecButton>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {pageData.items.map((record, index) => (
                  <ApplicantCard
                    key={record.id}
                    record={record}
                    index={pageOffset + index}
                    activeTab={activeTab}
                    safeModeWhatsApp={safeModeWhatsApp}
                    copiedId={copiedId}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onToggleInclusion={handleToggleInclusion}
                    onValidate={(rec) => setConfirmAction({ type: 'VALIDATE', record: rec })}
                    onOfferSpot={(rec) => setConfirmAction({ type: 'OFFER_SPOT', record: rec })}
                    onRenewToken={(rec) => setConfirmAction({ type: 'RENEW_TOKEN', record: rec })}
                    onReturnWaitlist={(rec) =>
                      setConfirmAction({ type: 'RETURN_WAITLIST', record: rec })
                    }
                    onMarkReviewed={(rec) =>
                      setConfirmAction({ type: 'MARK_REVIEWED', record: rec })
                    }
                    onAdmitCensus={(rec) => setConfirmAction({ type: 'ADMIT_CENSUS', record: rec })}
                    onDeactivate={(rec) => setConfirmAction({ type: 'DEACTIVATE', record: rec })}
                    onReactivate={(rec) => setConfirmAction({ type: 'REACTIVATE', record: rec })}
                    onOpenWhatsApp={handleOpenWhatsApp}
                    onCopyLink={handleCopyLink}
                    onDownloadPdf={handleDownloadPdf}
                    onDelete={(rec) => setConfirmAction({ type: 'DELETE', record: rec })}
                    onEditCensus={(rec) => setCensusFormRecord(rec)}
                    onEdit={(rec) => setDetailRecordId(rec.id)}
                  />
                ))}
              </div>

              {(pageData.totalMatching > PAGE_SIZE_OPTIONS[0] || pageData.totalPages > 1) && (
                <SecretariaPagination
                  pageOffset={pageOffset}
                  pageSize={pageData.pageSize}
                  totalCount={pageData.totalMatching}
                  currentPage={pageData.page}
                  totalPages={pageData.totalPages}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageSizeChange={(nextSize) => {
                    setLoading(true);
                    setPageSize(nextSize);
                    setCurrentPage(1);
                  }}
                  onPageChange={(nextPage) => {
                    setLoading(true);
                    setCurrentPage(nextPage);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
