import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FileDown,
  History,
  HeartPulse,
  Lock,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  applicationsApi,
  CLOSURE_REASON_LABELS,
  type ApplicantRecord,
  type AuditHistoryEvent,
  type UpdateApplicationPayload,
} from '../../services/api';
import { formatIsoToHumanShort } from '../../utils/dateUtils';
import { generateOfficialScoutPdf } from '../../utils/pdfGenerator';
import DatePicker from '../shared/forms/DatePicker';
import FormField from '../shared/forms/FormField';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';
import { SecBadge, SecButton } from './secretariaTheme';
import { getBranchVisualConfig, getStatusVisualConfig, secTokens } from './secretariaTokens';

type DetailTab = 'solicitud' | 'inscripcion' | 'historial';

interface Props {
  recordId: string;
  canUpdate: boolean;
  onClose: () => void;
  onSelectRecord: (id: string) => void;
  onUpdated: (updated: ApplicantRecord) => void;
  onRequestEditCensus: (record: ApplicantRecord) => void;
  onTriggerLifecycleAction: (
    type:
      | 'VALIDATE'
      | 'OFFER_SPOT'
      | 'RENEW_TOKEN'
      | 'RETURN_WAITLIST'
      | 'MARK_REVIEWED'
      | 'ADMIT_CENSUS'
      | 'DEACTIVATE'
      | 'REACTIVATE',
    record: ApplicantRecord,
  ) => void;
  onNotify: (tone: 'success' | 'error', text: string) => void;
}

const EDITABLE_PHASE1_STATUSES = new Set([
  'PENDIENTE_REVISION',
  'LISTA_ESPERA',
  'PLAZA_OFERTADA',
]);

export default function ApplicantDetailModal({
  recordId,
  canUpdate,
  onClose,
  onSelectRecord,
  onUpdated,
  onRequestEditCensus,
  onTriggerLifecycleAction,
  onNotify,
}: Props) {
  const [detail, setDetail] = useState<ApplicantRecord | null>(null);
  const [history, setHistory] = useState<AuditHistoryEvent[]>([]);
  const [auroraPreview, setAuroraPreview] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('solicitud');
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState<UpdateApplicationPayload>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([applicationsApi.getById(recordId), applicationsApi.getHistory(recordId)])
      .then(([loadedDetail, loadedHistory]) => {
        if (cancelled) return;
        setDetail(loadedDetail);
        setHistory(loadedHistory);
        setFormState({
          childFirstName: loadedDetail.childFirstName,
          childLastName1: loadedDetail.childLastName1,
          childLastName2: loadedDetail.childLastName2 || '',
          hasNoSecondLastName: loadedDetail.hasNoSecondLastName,
          noSecondLastNameJustification: loadedDetail.noSecondLastNameJustification || '',
          childBirthDate: loadedDetail.childBirthDate.slice(0, 10),
          parent1FirstName: loadedDetail.parent1FirstName,
          parent1LastName: loadedDetail.parent1LastName,
          parent1Phone: loadedDetail.parent1Phone,
          parent1Email: loadedDetail.parent1Email,
          parent2FirstName: loadedDetail.parent2FirstName || '',
          parent2LastName: loadedDetail.parent2LastName || '',
          parent2Phone: loadedDetail.parent2Phone || '',
          parent2Email: loadedDetail.parent2Email || '',
          motivation: loadedDetail.motivation || '',
          hasFamilyInGroup: loadedDetail.hasFamilyInGroup,
          familyMemberDetails: loadedDetail.familyMemberDetails || '',
          comesFromOtherGroup: loadedDetail.comesFromOtherGroup,
          originGroupDetails: loadedDetail.originGroupDetails || '',
          socialInclusionPriority: loadedDetail.socialInclusionPriority,
          kraalInternalNotes: loadedDetail.kraalInternalNotes || '',
        });
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'No se pudo cargar el expediente.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recordId]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, saving]);

  const isPhase1Editable = detail ? EDITABLE_PHASE1_STATUSES.has(detail.status) : false;
  const isClosed = detail?.status === 'BAJA';

  const handleSave = async () => {
    if (!detail || !canUpdate || isClosed) return;
    setSaving(true);
    setError(null);
    try {
      const payload: UpdateApplicationPayload = isPhase1Editable
        ? {
            ...formState,
            childLastName2: formState.hasNoSecondLastName
              ? ''
              : formState.childLastName2?.trim() || '',
            noSecondLastNameJustification: formState.hasNoSecondLastName
              ? formState.noSecondLastNameJustification?.trim() || ''
              : '',
            familyMemberDetails: formState.hasFamilyInGroup
              ? formState.familyMemberDetails?.trim() || ''
              : '',
            originGroupDetails: formState.comesFromOtherGroup
              ? formState.originGroupDetails?.trim() || ''
              : '',
          }
        : {
            motivation: formState.motivation,
            hasFamilyInGroup: formState.hasFamilyInGroup,
            familyMemberDetails: formState.hasFamilyInGroup
              ? formState.familyMemberDetails?.trim() || ''
              : '',
            comesFromOtherGroup: formState.comesFromOtherGroup,
            originGroupDetails: formState.comesFromOtherGroup
              ? formState.originGroupDetails?.trim() || ''
              : '',
            socialInclusionPriority: formState.socialInclusionPriority,
            kraalInternalNotes: formState.kraalInternalNotes,
          };

      const updated = await applicationsApi.update(detail.id, payload);
      setDetail(updated);
      setHistory(await applicationsApi.getHistory(detail.id));
      onUpdated(updated);
      onNotify('success', 'Cambios del expediente guardados correctamente.');
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : 'No se pudieron guardar los cambios.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadAuroraPreview = async () => {
    if (!detail) return;
    try {
      const preview = await applicationsApi.getAuroraPreview(detail.id);
      setAuroraPreview(preview);
    } catch (reason) {
      onNotify(
        'error',
        reason instanceof Error ? reason.message : 'No se pudo generar la vista previa de Aurora.',
      );
    }
  };

  const handleDownloadPdf = async () => {
    if (!detail) return;
    try {
      await generateOfficialScoutPdf(detail);
    } catch (reason) {
      onNotify(
        'error',
        reason instanceof Error ? reason.message : 'No se pudo generar el PDF oficial.',
      );
    }
  };

  const branchConfig = detail ? getBranchVisualConfig(detail.calculatedBranch) : null;
  const statusConfig = detail ? getStatusVisualConfig(detail.status) : null;

  return (
    <div
      className={secTokens.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="applicant-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className={secTokens.modalPanel}>
        <header className="flex items-start justify-between gap-4 bg-gradient-to-r from-[#000254] to-[#01317b] px-5 sm:px-7 py-5 text-white">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">
              Secretaría · Ficha del expediente
            </p>
            <h2 id="applicant-detail-title" className="mt-1 text-lg sm:text-xl font-bold truncate">
              {detail ? `${detail.childFirstName} ${detail.childLastName}` : 'Cargando expediente…'}
            </h2>
            {detail && branchConfig && statusConfig && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SecBadge tone={branchConfig.tone} dotColor={branchConfig.dotColor}>
                  {branchConfig.name} · {detail.currentAge} años ({detail.solarRound})
                </SecBadge>
                <SecBadge tone={statusConfig.tone}>{statusConfig.label}</SecBadge>
                <span className="text-[11px] text-blue-100/85">
                  Prioridad: <strong>{detail.priorityScore} pts</strong>
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            aria-label="Cerrar ficha"
          >
            <X size={18} />
          </button>
        </header>

        <nav className="flex items-center gap-1.5 border-b border-slate-200/85 bg-white px-5 py-2.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('solicitud')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'solicitud'
                ? 'bg-[#01317b] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Solicitud, Tutores y Kraal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inscripcion')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'inscripcion'
                ? 'bg-[#01317b] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Inscripción, Salud y SEPA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-[#01317b] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History size={13} /> Historial ({history.length})
          </button>
        </nav>

        <main className="p-5 sm:p-6 max-h-[calc(85vh-11rem)] overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Cargando expediente y auditoría…
            </div>
          ) : error && !detail ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              {error}
            </div>
          ) : detail ? (
            <>
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  {error}
                </div>
              )}

              {detail.isIncomplete && detail.missingFields && detail.missingFields.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950 space-y-1">
                  <p className="font-bold inline-flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" />
                    Datos obligatorios pendientes en esta fase
                  </p>
                  <p className="text-amber-900">{detail.missingFields.join(' · ')}</p>
                </div>
              )}

              {detail.potentialDuplicateIds && detail.potentialDuplicateIds.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 space-y-1.5">
                  <p className="font-bold inline-flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-600" />
                    Posible duplicado detectado ({detail.potentialDuplicateIds.length})
                  </p>
                  <p>
                    Existe otro expediente activo con el mismo nombre, primer apellido y fecha de nacimiento. Revísalo antes de ofertar plaza o censar.
                  </p>
                </div>
              )}

              {detail.status === 'BAJA' && (
                <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 text-xs text-slate-800 space-y-1">
                  <p className="font-bold text-[#000254]">
                    Expediente dado de baja ·{' '}
                    {detail.closureReason ? CLOSURE_REASON_LABELS[detail.closureReason] : 'Sin motivo especificado'}
                  </p>
                  {detail.closedAt && (
                    <p className="text-slate-600">
                      Fecha de baja: {formatIsoToHumanShort(detail.closedAt)}
                    </p>
                  )}
                  {detail.closureNotes && <p className="text-slate-700">{detail.closureNotes}</p>}
                </div>
              )}

              {activeTab === 'solicitud' && (
                <div className="space-y-4">
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
                        Datos del educando
                      </h3>
                      {!isPhase1Editable && !isClosed && (
                        <span className="text-[11px] text-slate-500">
                          {detail.status === 'CENSADO'
                            ? 'Identidad editable desde el formulario de censo'
                            : 'Inscripción finalizada · Solo notas/criterios editables aquí'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <FormField label="Nombre">
                        <input
                          type="text"
                          disabled={!canUpdate || !isPhase1Editable}
                          value={formState.childFirstName || ''}
                          onChange={(e) =>
                            setFormState((p) => ({ ...p, childFirstName: e.target.value }))
                          }
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="Primer apellido">
                        <input
                          type="text"
                          disabled={!canUpdate || !isPhase1Editable}
                          value={formState.childLastName1 || ''}
                          onChange={(e) =>
                            setFormState((p) => ({ ...p, childLastName1: e.target.value }))
                          }
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="Segundo apellido">
                        <input
                          type="text"
                          disabled={
                            !canUpdate ||
                            !isPhase1Editable ||
                            Boolean(formState.hasNoSecondLastName)
                          }
                          value={
                            formState.hasNoSecondLastName ? '' : formState.childLastName2 || ''
                          }
                          onChange={(e) =>
                            setFormState((p) => ({ ...p, childLastName2: e.target.value }))
                          }
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="Fecha de nacimiento">
                        <DatePicker
                          name="childBirthDate"
                          disabled={!canUpdate || !isPhase1Editable}
                          value={formState.childBirthDate || ''}
                          onValueChange={(iso) =>
                            setFormState((p) => ({ ...p, childBirthDate: iso }))
                          }
                        />
                      </FormField>
                    </div>
                    {isPhase1Editable && (
                      <div className="space-y-2 pt-1">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!canUpdate}
                            checked={Boolean(formState.hasNoSecondLastName)}
                            onChange={(e) =>
                              setFormState((p) => ({
                                ...p,
                                hasNoSecondLastName: e.target.checked,
                                childLastName2: e.target.checked ? '' : p.childLastName2,
                              }))
                            }
                            className={formCheckboxClass}
                          />
                          <span>Sin segundo apellido (excepción justificada)</span>
                        </label>
                        {formState.hasNoSecondLastName && (
                          <FormField label="Justificación">
                            <input
                              type="text"
                              disabled={!canUpdate}
                              value={formState.noSecondLastNameJustification || ''}
                              onChange={(e) =>
                                setFormState((p) => ({
                                  ...p,
                                  noSecondLastNameJustification: e.target.value,
                                }))
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                        )}
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
                      Tutores de contacto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2.5 rounded-xl bg-[#f8f9fc] p-3 border border-slate-200/70">
                        <p className="text-[11px] font-bold text-slate-700">Tutor principal</p>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Nombre">
                            <input
                              type="text"
                              disabled={!canUpdate || !isPhase1Editable}
                              value={formState.parent1FirstName || ''}
                              onChange={(e) =>
                                setFormState((p) => ({ ...p, parent1FirstName: e.target.value }))
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Apellidos">
                            <input
                              type="text"
                              disabled={!canUpdate || !isPhase1Editable}
                              value={formState.parent1LastName || ''}
                              onChange={(e) =>
                                setFormState((p) => ({ ...p, parent1LastName: e.target.value }))
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Teléfono">
                            <input
                              type="tel"
                              disabled={!canUpdate || !isPhase1Editable}
                              value={formState.parent1Phone || ''}
                              onChange={(e) =>
                                setFormState((p) => ({ ...p, parent1Phone: e.target.value }))
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Email">
                            <input
                              type="email"
                              disabled={!canUpdate || !isPhase1Editable}
                              value={formState.parent1Email || ''}
                              onChange={(e) =>
                                setFormState((p) => ({ ...p, parent1Email: e.target.value }))
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                        </div>
                      </div>

                      <div className="space-y-2.5 rounded-xl bg-[#f8f9fc] p-3 border border-slate-200/70">
                        <p className="text-[11px] font-bold text-slate-700">
                          Segundo tutor (opcional)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Nombre">
                            <input
                              type="text"
                              disabled={!canUpdate || !isPhase1Editable}
                              value={formState.parent2FirstName || ''}
                              onChange={(e) =>
                                setFormState((p) => ({ ...p, parent2FirstName: e.target.value }))
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Apellidos">
                            <input
                              type="text"
                              disabled={!canUpdate || !isPhase1Editable}
                              value={formState.parent2LastName || ''}
                              onChange={(e) =>
                                setFormState((p) => ({ ...p, parent2LastName: e.target.value }))
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Teléfono">
                            <input
                              type="tel"
                              disabled={!canUpdate || !isPhase1Editable}
                              value={formState.parent2Phone || ''}
                              onChange={(e) =>
                                setFormState((p) => ({ ...p, parent2Phone: e.target.value }))
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Email">
                            <input
                              type="email"
                              disabled={!canUpdate || !isPhase1Editable}
                              value={formState.parent2Email || ''}
                              onChange={(e) =>
                                setFormState((p) => ({ ...p, parent2Email: e.target.value }))
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
                      Criterios de prioridad, motivación y notas internas del Kraal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!canUpdate || isClosed}
                          checked={Boolean(formState.hasFamilyInGroup)}
                          onChange={(e) =>
                            setFormState((p) => ({ ...p, hasFamilyInGroup: e.target.checked }))
                          }
                          className={formCheckboxClass}
                        />
                        <span>
                          <strong>Familiar en el grupo (+100)</strong>
                        </span>
                      </label>
                      <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!canUpdate || isClosed}
                          checked={Boolean(formState.socialInclusionPriority)}
                          onChange={(e) =>
                            setFormState((p) => ({
                              ...p,
                              socialInclusionPriority: e.target.checked,
                            }))
                          }
                          className={formCheckboxClass}
                        />
                        <span>
                          <strong>Prioridad inclusión (+50)</strong>
                        </span>
                      </label>
                      <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!canUpdate || isClosed}
                          checked={Boolean(formState.comesFromOtherGroup)}
                          onChange={(e) =>
                            setFormState((p) => ({ ...p, comesFromOtherGroup: e.target.checked }))
                          }
                          className={formCheckboxClass}
                        />
                        <span>
                          <strong>Otro grupo scout (+25)</strong>
                        </span>
                      </label>
                    </div>

                    {formState.hasFamilyInGroup && (
                      <FormField label="Detalles del familiar en el Grupo IV">
                        <input
                          type="text"
                          disabled={!canUpdate || isClosed}
                          value={formState.familyMemberDetails || ''}
                          onChange={(e) =>
                            setFormState((p) => ({ ...p, familyMemberDetails: e.target.value }))
                          }
                          className={formInputClass()}
                        />
                      </FormField>
                    )}

                    {formState.comesFromOtherGroup && (
                      <FormField label="Grupo scout de procedencia">
                        <input
                          type="text"
                          disabled={!canUpdate || isClosed}
                          value={formState.originGroupDetails || ''}
                          onChange={(e) =>
                            setFormState((p) => ({ ...p, originGroupDetails: e.target.value }))
                          }
                          className={formInputClass()}
                        />
                      </FormField>
                    )}

                    <FormField label="Motivación de la familia">
                      <textarea
                        rows={2}
                        disabled={!canUpdate || isClosed}
                        value={formState.motivation || ''}
                        onChange={(e) =>
                          setFormState((p) => ({ ...p, motivation: e.target.value }))
                        }
                        className={formInputClass(false, 'resize-y')}
                      />
                    </FormField>

                    <FormField label="Notas internas del Kraal (privadas)">
                      <textarea
                        rows={3}
                        disabled={!canUpdate || isClosed}
                        value={formState.kraalInternalNotes || ''}
                        onChange={(e) =>
                          setFormState((p) => ({ ...p, kraalInternalNotes: e.target.value }))
                        }
                        placeholder="Observaciones internas de valoración del Kraal..."
                        className={formInputClass(false, 'resize-y')}
                      />
                    </FormField>
                  </section>

                  {detail.familySiblings && detail.familySiblings.length > 0 && (
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254] inline-flex items-center gap-1.5">
                        <Users size={13} /> Hermanos / expedientes vinculados a la misma familia
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {detail.familySiblings.map((sib) => (
                          <button
                            key={sib.id}
                            type="button"
                            onClick={() => onSelectRecord(sib.id)}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#f8f9fc] px-3 py-2 text-left text-xs hover:border-[#01317b] transition cursor-pointer"
                          >
                            <span className="font-semibold text-[#0c1933]">
                              {sib.childFirstName} {sib.childLastName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {sib.calculatedBranch} · {getStatusVisualConfig(sib.status).label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'inscripcion' && (
                <div className="space-y-4">
                  {!detail.enrollment ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                      Este expediente todavía no tiene ficha de inscripción oficial completada.
                    </div>
                  ) : (
                    <>
                      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold uppercase tracking-wider text-[#000254]">
                            Datos oficiales, domicilio y consentimientos
                          </h3>
                          <div className="flex items-center gap-2">
                            {detail.status === 'CENSADO' && canUpdate && (
                              <SecButton
                                variant="secondary"
                                size="xs"
                                onClick={() => onRequestEditCensus(detail)}
                              >
                                Editar ficha censada
                              </SecButton>
                            )}
                            <SecButton variant="secondary" size="xs" onClick={handleDownloadPdf}>
                              <FileDown size={13} /> Descargar PDF
                            </SecButton>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                          <div>
                            <span className="text-slate-400 block">Género</span>
                            <strong>{detail.gender || 'Sin especificar'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">DNI del educando</span>
                            <strong>{detail.enrollment.childDni || 'Sin DNI'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Custodia y estado legal</span>
                            <strong>
                              {detail.enrollment.custodyType} · {detail.enrollment.legalStatus}
                            </strong>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 block">Dirección completa</span>
                            <strong>
                              {[
                                detail.streetAddress,
                                detail.streetNumber,
                                detail.apartmentDoor,
                                detail.postalCode,
                                detail.municipality,
                                detail.province,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Versión autorizaciones</span>
                            <strong>v{detail.enrollment.consentTextVersion || '2026.1'}</strong>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <SecBadge tone={detail.enrollment.acceptsDataStorage ? 'emerald' : 'rose'}>
                            Protección datos: {detail.enrollment.acceptsDataStorage ? 'Sí' : 'No'}
                          </SecBadge>
                          <SecBadge tone={detail.enrollment.acceptsDataTransfer ? 'emerald' : 'rose'}>
                            Cesión MSC: {detail.enrollment.acceptsDataTransfer ? 'Sí' : 'No'}
                          </SecBadge>
                          <SecBadge tone={detail.enrollment.authorizesImages ? 'emerald' : 'amber'}>
                            Imágenes: {detail.enrollment.authorizesImages ? 'Autoriza' : 'NO autoriza'}
                          </SecBadge>
                        </div>

                        {detail.admittedAt && (
                          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                            <span>
                              <strong>Alta oficial en censo:</strong>{' '}
                              {formatIsoToHumanShort(detail.admittedAt)} · Ronda{' '}
                              {detail.censusSolarRound || detail.solarRound} · Rama{' '}
                              {detail.censusBranch || detail.calculatedBranch}
                            </span>
                            {canUpdate && (
                              <SecButton
                                variant="secondary"
                                size="xs"
                                onClick={handleLoadAuroraPreview}
                              >
                                <Sparkles size={12} /> Ver mapeo Aurora
                              </SecButton>
                            )}
                          </div>
                        )}

                        {auroraPreview && (
                          <pre className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-3 text-[11px] overflow-x-auto">
                            {JSON.stringify(auroraPreview, null, 2)}
                          </pre>
                        )}
                      </section>

                      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5 text-xs">
                        <h3 className="font-bold uppercase tracking-wider text-[#000254] inline-flex items-center gap-1.5">
                          <HeartPulse size={14} className="text-rose-600" /> Información médica
                        </h3>
                        {detail.enrollment.medicalAccessRestricted ? (
                          <p className="inline-flex items-center gap-1.5 text-slate-500">
                            <Lock size={13} /> Acceso restringido: tu perfil solo tiene permiso de lectura general.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                            <div>
                              <span className="text-slate-400 block">Grupo sanguíneo</span>
                              <strong>{detail.enrollment.bloodType || 'No indicado'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Urgencias médicas</span>
                              <strong>
                                {detail.enrollment.authorizesEmergency ? 'Autorizada' : 'No autorizada'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Enfermedades crónicas</span>
                              <strong>{detail.enrollment.chronicDiseases || 'Ninguna indicada'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Alergias</span>
                              <strong>{detail.enrollment.allergies || 'Ninguna indicada'}</strong>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-slate-400 block">Contacto de emergencia</span>
                              <strong>
                                {[
                                  detail.enrollment.emergencyContactName,
                                  detail.enrollment.emergencyContactPhone,
                                  detail.enrollment.emergencyContactRelationship,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || 'No especificado'}
                              </strong>
                            </div>
                          </div>
                        )}
                      </section>

                      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5 text-xs">
                        <h3 className="font-bold uppercase tracking-wider text-[#000254] inline-flex items-center gap-1.5">
                          <CreditCard size={14} className="text-[#01317b]" /> Datos bancarios (SEPA)
                        </h3>
                        {detail.enrollment.bankAccessRestricted ? (
                          <p className="inline-flex items-center gap-1.5 text-slate-500">
                            <Lock size={13} /> IBAN enmascarado: {detail.enrollment.ibanMasked}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                            <div>
                              <span className="text-slate-400 block">Titular de la cuenta</span>
                              <strong>{detail.enrollment.accountHolderName}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">DNI del titular</span>
                              <strong>{detail.enrollment.accountHolderDni}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">IBAN</span>
                              <strong className="font-mono">{detail.enrollment.iban}</strong>
                            </div>
                          </div>
                        )}
                      </section>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'historial' && (
                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
                    Registro de auditoría del expediente
                  </h3>
                  {history.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No hay eventos de auditoría registrados todavía para este expediente.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {history.map((event) => (
                        <li
                          key={event.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-[#f8f9fc] px-3.5 py-2.5 text-xs"
                        >
                          <div>
                            <strong className="text-[#0c1933]">{event.action}</strong>
                            <span className="text-slate-500 block text-[11px]">
                              Usuario: {event.actor ? `${event.actor.name} (${event.actor.email})` : 'Familia / Público'}
                            </span>
                          </div>
                          <div className="text-right text-[11px] text-slate-500">
                            <span>{new Date(event.createdAt).toLocaleString('es-ES')}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </>
          ) : null}
        </main>

        {detail && (
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/85 bg-white px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              {canUpdate && detail.status === 'PENDIENTE_REVISION' && (
                <SecButton
                  variant="warning"
                  size="sm"
                  onClick={() => onTriggerLifecycleAction('VALIDATE', detail)}
                >
                  <CheckCircle2 size={13} /> Validar
                </SecButton>
              )}
              {canUpdate &&
                (detail.status === 'PENDIENTE_REVISION' || detail.status === 'LISTA_ESPERA') && (
                  <SecButton
                    variant="primary"
                    size="sm"
                    onClick={() => onTriggerLifecycleAction('OFFER_SPOT', detail)}
                  >
                    Ofertar plaza
                  </SecButton>
                )}
              {canUpdate &&
                (detail.status === 'PLAZA_OFERTADA' ||
                  detail.status === 'INSCRIPCION_COMPLETADA') && (
                  <>
                    <SecButton
                      variant="secondary"
                      size="sm"
                      onClick={() => onTriggerLifecycleAction('RENEW_TOKEN', detail)}
                    >
                      Renovar enlace
                    </SecButton>
                    <SecButton
                      variant="secondary"
                      size="sm"
                      onClick={() => onTriggerLifecycleAction('RETURN_WAITLIST', detail)}
                    >
                      Volver a lista de espera
                    </SecButton>
                  </>
                )}
              {canUpdate && detail.status === 'INSCRIPCION_COMPLETADA' && (
                <>
                  {!detail.reviewedAt && (
                    <SecButton
                      variant="secondary"
                      size="sm"
                      onClick={() => onTriggerLifecycleAction('MARK_REVIEWED', detail)}
                    >
                      <ShieldCheck size={13} /> Marcar revisada
                    </SecButton>
                  )}
                  <SecButton
                    variant="success"
                    size="sm"
                    onClick={() => onTriggerLifecycleAction('ADMIT_CENSUS', detail)}
                  >
                    Censar
                  </SecButton>
                </>
              )}
              {canUpdate && detail.status !== 'BAJA' && (
                <SecButton
                  variant="destructive"
                  size="sm"
                  onClick={() => onTriggerLifecycleAction('DEACTIVATE', detail)}
                >
                  Dar de baja
                </SecButton>
              )}
              {canUpdate && detail.status === 'BAJA' && (
                <SecButton
                  variant="primary"
                  size="sm"
                  onClick={() => onTriggerLifecycleAction('REACTIVATE', detail)}
                >
                  Reactivar
                </SecButton>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <SecButton variant="tertiary" size="sm" onClick={onClose}>
                Cerrar
              </SecButton>
              {canUpdate && !isClosed && activeTab === 'solicitud' && (
                <SecButton variant="primary" size="sm" disabled={saving} onClick={handleSave}>
                  <Save size={13} /> {saving ? 'Guardando…' : 'Guardar cambios'}
                </SecButton>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
