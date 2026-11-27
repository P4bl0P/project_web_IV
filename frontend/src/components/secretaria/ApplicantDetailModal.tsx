import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  History,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  applicationsApi,
  CLOSURE_REASON_LABELS,
  type ApplicantRecord,
  type AuditHistoryEvent,
  type UpdateApplicationPayload,
  type UpdateCensusPayload,
} from '../../services/api';
import { formatIsoToHumanShort } from '../../utils/dateUtils';
import { REGEX } from '../../utils/scoutValidators';
import { useLockBodyScroll } from '../../utils/useLockBodyScroll';
import { SecBadge, SecButton } from './secretariaTheme';
import { getBranchVisualConfig, getStatusVisualConfig, secTokens } from './secretariaTokens';
import ApplicantEnrollmentSection from './detail/ApplicantEnrollmentSection';
import ApplicantExpedienteSection from './detail/ApplicantExpedienteSection';
import ApplicantHistorySection from './detail/ApplicantHistorySection';
import {
  buildInitialForm,
  EDITABLE_PHASE1_STATUSES,
  optionalOrNull,
  WORKFLOW_STEPS,
  type DetailTab,
  type LifecycleActionType,
  type UnifiedFormState,
} from './detail/applicantDetailForm';

interface Props {
  recordId: string;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onSelectRecord: (id: string) => void;
  onUpdated: (updated: ApplicantRecord) => void;
  onTriggerLifecycleAction: (type: LifecycleActionType, record: ApplicantRecord) => void;
  onNotify: (tone: 'success' | 'error', text: string) => void;
}

export default function ApplicantDetailModal({
  recordId,
  canUpdate,
  canDelete,
  onClose,
  onSelectRecord,
  onUpdated,
  onTriggerLifecycleAction,
  onNotify,
}: Props) {
  useLockBodyScroll();

  const [detail, setDetail] = useState<ApplicantRecord | null>(null);
  const [history, setHistory] = useState<AuditHistoryEvent[]>([]);
  const [auroraPreview, setAuroraPreview] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('expediente');
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<UnifiedFormState | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([applicationsApi.getById(recordId), applicationsApi.getHistory(recordId)])
      .then(([loadedDetail, loadedHistory]) => {
        if (cancelled) return;
        setDetail(loadedDetail);
        setHistory(loadedHistory);
        setFormState(buildInitialForm(loadedDetail));
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

  const isPhase1Editable = detail ? EDITABLE_PHASE1_STATUSES.has(detail.status) : false;
  const isCensusEditable = detail?.status === 'CENSADO';
  const isClosed = detail?.status === 'BAJA';
  const canEditIdentity = Boolean(canUpdate && (isPhase1Editable || isCensusEditable));
  const canEditFullEnrollment = Boolean(
    canUpdate &&
      isCensusEditable &&
      detail?.enrollment &&
      !detail.enrollment.medicalAccessRestricted &&
      !detail.enrollment.bankAccessRestricted,
  );
  const canEditCriteria = Boolean(canUpdate && !isClosed);

  const updateField = <K extends keyof UnifiedFormState>(key: K, value: UnifiedFormState[K]) => {
    setFormState((prev) => (prev ? { ...prev, [key]: value } : prev));
    setError(null);
  };

  const handleSave = async () => {
    if (!detail || !formState || !canUpdate || isClosed) return;
    setError(null);

    if (canEditIdentity) {
      if (formState.childFirstName.trim().length < 2) {
        return setError('El nombre del educando debe tener al menos 2 letras.');
      }
      if (formState.childLastName1.trim().length < 2) {
        return setError('El primer apellido es obligatorio.');
      }
      if (formState.hasNoSecondLastName) {
        if (formState.noSecondLastNameJustification.trim().length < 5) {
          return setError('Debes justificar la ausencia de segundo apellido (mín. 5 caracteres).');
        }
      } else if (!formState.childLastName2.trim()) {
        return setError('El segundo apellido es obligatorio salvo excepción marcada.');
      }
      if (!REGEX.PHONE.test(formState.parent1Phone.replace(/\s+/g, ''))) {
        return setError('El teléfono del tutor 1 debe tener 9 dígitos válidos.');
      }
      if (!REGEX.EMAIL.test(formState.parent1Email.trim())) {
        return setError('El correo electrónico del tutor 1 no es válido.');
      }
      if (
        formState.parent2Phone.trim() &&
        !REGEX.PHONE.test(formState.parent2Phone.replace(/\s+/g, ''))
      ) {
        return setError('El teléfono del tutor 2 debe tener 9 dígitos válidos.');
      }
      if (formState.parent2Email.trim() && !REGEX.EMAIL.test(formState.parent2Email.trim())) {
        return setError('El correo electrónico del tutor 2 no es válido.');
      }
    }

    if (isCensusEditable) {
      if (formState.gender !== 'MASCULINO' && formState.gender !== 'FEMENINO') {
        return setError('En el censo oficial el género debe ser Masculino o Femenino.');
      }
      if (formState.streetAddress.trim().length < 3) {
        return setError('La dirección principal es obligatoria.');
      }
      if (!REGEX.POSTAL_CODE.test(formState.postalCode.trim())) {
        return setError('El código postal debe tener 5 dígitos válidos.');
      }
      if (!formState.municipality.trim() || !formState.province.trim()) {
        return setError('La localidad y la provincia son obligatorias.');
      }

      if (canEditFullEnrollment) {
        if (!REGEX.DNI.test(formState.parent1Dni.trim())) {
          return setError('El DNI/NIE del tutor 1 es obligatorio y debe tener formato válido.');
        }
        if (
          formState.custodyType === 'CUSTODIA_CONJUNTA' &&
          !REGEX.DNI.test(formState.parent2Dni.trim())
        ) {
          return setError('En custodia conjunta el DNI del tutor 2 es obligatorio.');
        }
        if (formState.childDni.trim() && !REGEX.DNI.test(formState.childDni.trim())) {
          return setError('El formato del DNI del educando no es válido.');
        }
        if (!formState.accountHolderName.trim()) {
          return setError('El titular de la cuenta bancaria es obligatorio.');
        }
        if (!REGEX.DNI.test(formState.accountHolderDni.trim())) {
          return setError('El DNI del titular bancario no es válido.');
        }
        if (!REGEX.IBAN.test(formState.iban.replace(/\s+/g, ''))) {
          return setError('El IBAN debe comenzar por ES seguido de 22 dígitos.');
        }
      }
    }

    setSaving(true);
    try {
      let updated: ApplicantRecord;

      if (isCensusEditable) {
        const censusPayload: Record<string, unknown> = {
          childFirstName: formState.childFirstName.trim(),
          childLastName1: formState.childLastName1.trim(),
          childLastName2: formState.hasNoSecondLastName
            ? null
            : formState.childLastName2.trim(),
          hasNoSecondLastName: formState.hasNoSecondLastName,
          noSecondLastNameJustification: formState.hasNoSecondLastName
            ? formState.noSecondLastNameJustification.trim()
            : null,
          childBirthDate: formState.childBirthDate,
          gender: formState.gender as 'MASCULINO' | 'FEMENINO',
          streetAddress: formState.streetAddress.trim(),
          streetNumber: formState.streetNumber.trim() || null,
          apartmentDoor: formState.apartmentDoor.trim() || null,
          postalCode: formState.postalCode.trim(),
          municipality: formState.municipality.trim(),
          province: formState.province.trim(),
          parent1FirstName: formState.parent1FirstName.trim(),
          parent1LastName: formState.parent1LastName.trim(),
          parent1Phone: formState.parent1Phone.replace(/\s+/g, ''),
          parent1Email: formState.parent1Email.trim(),
          parent1Relationship: formState.parent1Relationship.trim() || null,
          parent2FirstName: formState.parent2FirstName.trim() || null,
          parent2LastName: formState.parent2LastName.trim() || null,
          parent2Phone: formState.parent2Phone.trim()
            ? formState.parent2Phone.replace(/\s+/g, '')
            : null,
          parent2Email: formState.parent2Email.trim() || null,
          parent2Relationship: formState.parent2Relationship.trim() || null,
          motivation: formState.motivation.trim() || null,
          hasFamilyInGroup: formState.hasFamilyInGroup,
          familyMemberDetails: formState.hasFamilyInGroup
            ? formState.familyMemberDetails.trim() || null
            : null,
          comesFromOtherGroup: formState.comesFromOtherGroup,
          originGroupDetails: formState.comesFromOtherGroup
            ? formState.originGroupDetails.trim() || null
            : null,
          socialInclusionPriority: formState.socialInclusionPriority,
          kraalInternalNotes: formState.kraalInternalNotes.trim() || null,
        };

        if (canEditFullEnrollment) {
          Object.assign(censusPayload, {
            childDni: formState.childDni.trim().toUpperCase() || null,
            childPhone: formState.childPhone.trim()
              ? formState.childPhone.replace(/\s+/g, '')
              : null,
            childEmail: formState.childEmail.trim() || null,
            legalStatus: formState.legalStatus,
            circularPreference: formState.circularPreference,
            parent1Dni: formState.parent1Dni.trim().toUpperCase(),
            parent2Dni: formState.parent2Dni.trim().toUpperCase() || null,
            parentsMaritalStatus: formState.parentsMaritalStatus.trim() || null,
            custodyType: formState.custodyType,
            bloodType: formState.bloodType.trim() || null,
            chronicDiseases: formState.chronicDiseases.trim() || null,
            allergies: formState.allergies.trim() || null,
            medHeadache: formState.medHeadache.trim() || null,
            medFever: formState.medFever.trim() || null,
            medStomach: formState.medStomach.trim() || null,
            medThroat: formState.medThroat.trim() || null,
            medicalObservations: formState.medicalObservations.trim() || null,
            emergencyContactName: formState.emergencyContactName.trim() || null,
            emergencyContactPhone: formState.emergencyContactPhone.trim()
              ? formState.emergencyContactPhone.replace(/\s+/g, '')
              : null,
            emergencyContactRelationship:
              formState.emergencyContactRelationship.trim() || null,
            authorizesEmergency: formState.authorizesEmergency,
            accountHolderName: formState.accountHolderName.trim(),
            accountHolderDni: formState.accountHolderDni.trim().toUpperCase(),
            accountHolderAddress: formState.accountHolderAddress.trim() || null,
            accountHolderMunicipality: formState.accountHolderMunicipality.trim() || null,
            accountHolderPostalCode: formState.accountHolderPostalCode.trim() || null,
            iban: formState.iban.replace(/\s+/g, '').toUpperCase(),
            authorizesSepa: formState.authorizesSepa,
          });
        }

        updated = await applicationsApi.updateCensus(
          detail.id,
          censusPayload as UpdateCensusPayload,
        );
      } else {
        const payload: UpdateApplicationPayload = isPhase1Editable
          ? {
              childFirstName: formState.childFirstName.trim(),
              childLastName1: formState.childLastName1.trim(),
              childLastName2: formState.hasNoSecondLastName
                ? ''
                : formState.childLastName2.trim(),
              hasNoSecondLastName: formState.hasNoSecondLastName,
              noSecondLastNameJustification: formState.hasNoSecondLastName
                ? formState.noSecondLastNameJustification.trim()
                : '',
              childBirthDate: formState.childBirthDate,
              parent1FirstName: formState.parent1FirstName.trim(),
              parent1LastName: formState.parent1LastName.trim(),
              parent1Phone: formState.parent1Phone.replace(/\s+/g, ''),
              parent1Email: formState.parent1Email.trim(),
              parent2FirstName: formState.parent2FirstName.trim(),
              parent2LastName: formState.parent2LastName.trim(),
              parent2Phone: formState.parent2Phone.replace(/\s+/g, ''),
              parent2Email: optionalOrNull(formState.parent2Email),
              motivation: formState.motivation.trim(),
              hasFamilyInGroup: formState.hasFamilyInGroup,
              familyMemberDetails: formState.hasFamilyInGroup
                ? formState.familyMemberDetails.trim()
                : '',
              comesFromOtherGroup: formState.comesFromOtherGroup,
              originGroupDetails: formState.comesFromOtherGroup
                ? formState.originGroupDetails.trim()
                : '',
              socialInclusionPriority: formState.socialInclusionPriority,
              kraalInternalNotes: formState.kraalInternalNotes.trim(),
            }
          : {
              motivation: formState.motivation.trim(),
              hasFamilyInGroup: formState.hasFamilyInGroup,
              familyMemberDetails: formState.hasFamilyInGroup
                ? formState.familyMemberDetails.trim()
                : '',
              comesFromOtherGroup: formState.comesFromOtherGroup,
              originGroupDetails: formState.comesFromOtherGroup
                ? formState.originGroupDetails.trim()
                : '',
              socialInclusionPriority: formState.socialInclusionPriority,
              kraalInternalNotes: formState.kraalInternalNotes.trim(),
            };

        updated = await applicationsApi.update(detail.id, payload);
      }

      setDetail(updated);
      setFormState(buildInitialForm(updated));
      setHistory(await applicationsApi.getHistory(detail.id));
      onUpdated(updated);
      onNotify('success', 'Cambios del expediente guardados correctamente.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron guardar los cambios.');
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
      const { generateOfficialScoutPdf } = await import('../../utils/pdfGenerator');
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
  const currentStepIdx = detail
    ? WORKFLOW_STEPS.findIndex((s) => s.status === detail.status)
    : -1;
  const hasEnrollment = Boolean(detail?.enrollment);

  return createPortal(
    <div
      className={secTokens.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="applicant-detail-title"
    >
      <div className={secTokens.modalPanel}>
        <header className="shrink-0 flex items-start justify-between gap-4 bg-gradient-to-r from-[#000254] to-[#01317b] px-5 sm:px-7 py-5 text-white">
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
            disabled={saving}
            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 cursor-pointer"
            aria-label="Cerrar ficha"
          >
            <X size={18} />
          </button>
        </header>

        {detail && detail.status !== 'BAJA' && (
          <div className="shrink-0 border-b border-slate-200/80 bg-[#f8fafd] px-5 py-2.5 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              {WORKFLOW_STEPS.map((stepItem, idx) => {
                const isDone = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={stepItem.status} className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        isCurrent
                          ? 'bg-[#01317b] text-white'
                          : isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200/70 text-slate-500'
                      }`}
                    >
                      {stepItem.label}
                    </span>
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <span className="text-slate-300 text-xs" aria-hidden="true">
                        →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <nav className="shrink-0 flex items-center gap-1.5 border-b border-slate-200/85 bg-white px-5 py-2.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('expediente')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'expediente'
                ? 'bg-[#01317b] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Datos personales, Tutores y Kraal
          </button>
          {hasEnrollment && (
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
          )}
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

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Cargando expediente y auditoría…
            </div>
          ) : error && !detail ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              {error}
            </div>
          ) : detail && formState ? (
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

              {activeTab === 'expediente' && (
                <ApplicantExpedienteSection
                  detail={detail}
                  formState={formState}
                  canUpdate={canUpdate}
                  canEditIdentity={canEditIdentity}
                  canEditCriteria={canEditCriteria}
                  isCensusEditable={isCensusEditable}
                  updateField={updateField}
                  onSelectRecord={onSelectRecord}
                />
              )}

              {activeTab === 'inscripcion' && detail.enrollment && (
                <ApplicantEnrollmentSection
                  detail={detail}
                  formState={formState}
                  canUpdate={canUpdate}
                  canEditFullEnrollment={canEditFullEnrollment}
                  auroraPreview={auroraPreview}
                  updateField={updateField}
                  onDownloadPdf={handleDownloadPdf}
                  onLoadAuroraPreview={handleLoadAuroraPreview}
                />
              )}

              {activeTab === 'historial' && <ApplicantHistorySection history={history} />}
            </>
          ) : null}
        </main>

        {detail && (
          <footer className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/85 bg-white px-5 py-3.5">
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
              {canDelete && (
                <SecButton
                  variant="tertiary"
                  size="sm"
                  onClick={() => onTriggerLifecycleAction('DELETE', detail)}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 size={13} /> Eliminar
                </SecButton>
              )}
            </div>

            {canUpdate && !isClosed && activeTab !== 'historial' && (
              <div className="flex items-center gap-2 ml-auto">
                <SecButton variant="primary" size="sm" disabled={saving} onClick={handleSave}>
                  <Save size={13} /> {saving ? 'Guardando…' : 'Guardar cambios'}
                </SecButton>
              </div>
            )}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
