import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  applicationsApi,
  CLOSURE_REASON_LABELS,
  type ApplicantRecord,
  type ApplicationStatus,
  type AuditHistoryEvent,
  type UpdateApplicationPayload,
  type UpdateCensusPayload,
} from '../../services/api';
import { formatIsoToHumanShort } from '../../utils/dateUtils';
import { generateOfficialScoutPdf } from '../../utils/pdfGenerator';
import { REGEX } from '../../utils/scoutValidators';
import { useLockBodyScroll } from '../../utils/useLockBodyScroll';
import DatePicker from '../shared/forms/DatePicker';
import FormField from '../shared/forms/FormField';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';
import { SecBadge, SecButton } from './secretariaTheme';
import { getBranchVisualConfig, getStatusVisualConfig, secTokens } from './secretariaTokens';

type DetailTab = 'expediente' | 'inscripcion' | 'historial';

interface Props {
  recordId: string;
  canUpdate: boolean;
  canDelete: boolean;
  canPreviewAurora?: boolean;
  onClose: () => void;
  onSelectRecord: (id: string) => void;
  onUpdated: (updated: ApplicantRecord) => void;
  onTriggerLifecycleAction: (
    type:
      | 'VALIDATE'
      | 'OFFER_SPOT'
      | 'RENEW_TOKEN'
      | 'RETURN_WAITLIST'
      | 'MARK_REVIEWED'
      | 'ADMIT_CENSUS'
      | 'DEACTIVATE'
      | 'REACTIVATE'
      | 'DELETE',
    record: ApplicantRecord,
  ) => void;
  onNotify: (tone: 'success' | 'error', text: string) => void;
}

const EDITABLE_PHASE1_STATUSES = new Set<ApplicationStatus>([
  'PENDIENTE_REVISION',
  'LISTA_ESPERA',
  'PLAZA_OFERTADA',
]);

const WORKFLOW_STEPS: { status: ApplicationStatus; label: string }[] = [
  { status: 'PENDIENTE_REVISION', label: '1. Solicitud' },
  { status: 'LISTA_ESPERA', label: '2. Lista espera' },
  { status: 'PLAZA_OFERTADA', label: '3. Plaza ofertada' },
  { status: 'INSCRIPCION_COMPLETADA', label: '4. Inscripción' },
  { status: 'CENSADO', label: '5. Censo oficial' },
];

const AUDIT_ACTION_LABELS: Record<string, string> = {
  APPLICATION_CREATED: 'Solicitud registrada',
  APPLICATION_UPDATED: 'Datos del expediente actualizados',
  APPLICATION_VALIDATED: 'Solicitud validada a Lista de espera',
  APPLICATION_SPOT_OFFERED: 'Plaza ofertada (enlace mágico generado)',
  APPLICATION_TOKEN_RENEWED: 'Enlace mágico renovado',
  APPLICATION_RETURNED_TO_WAITLIST: 'Expediente devuelto a Lista de espera',
  APPLICATION_ENROLLMENT_COMPLETED: 'Inscripción oficial completada por la familia',
  APPLICATION_REVIEWED: 'Inscripción marcada como revisada por Secretaría',
  APPLICATION_CENSUS_ADMITTED: 'Alta confirmada en el Censo Oficial',
  APPLICATION_DIRECT_CENSUS_CREATED: 'Alta directa registrada en el Censo Oficial',
  APPLICATION_CENSUS_UPDATED: 'Ficha del censo actualizada',
  APPLICATION_DEACTIVATED: 'Expediente dado de baja / cerrado',
  APPLICATION_REACTIVATED: 'Expediente reactivado desde baja',
  APPLICATION_DELETED: 'Expediente eliminado',
  APPLICATION_SENSITIVE_READ: 'Consulta de ficha confidencial',
  APPLICATION_AURORA_PAYLOAD_PREVIEW: 'Vista previa de mapeo para Aurora',
};

const RELATIONSHIP_OPTIONS = [
  'Madre',
  'Padre',
  'Tutor/a legal',
  'Representante legal',
  'Otro familiar autorizado',
];

interface UnifiedFormState {
  // Identidad educando
  childFirstName: string;
  childLastName1: string;
  childLastName2: string;
  hasNoSecondLastName: boolean;
  noSecondLastNameJustification: string;
  childBirthDate: string;
  gender: 'MASCULINO' | 'FEMENINO' | '';
  // Dirección
  streetAddress: string;
  streetNumber: string;
  apartmentDoor: string;
  postalCode: string;
  municipality: string;
  province: string;
  // Tutores
  parent1FirstName: string;
  parent1LastName: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Relationship: string;
  parent2FirstName: string;
  parent2LastName: string;
  parent2Phone: string;
  parent2Email: string;
  parent2Relationship: string;
  // Criterios y Kraal
  motivation: string;
  hasFamilyInGroup: boolean;
  familyMemberDetails: string;
  comesFromOtherGroup: boolean;
  originGroupDetails: string;
  socialInclusionPriority: boolean;
  kraalInternalNotes: string;
  // Datos legales e inscripción
  childDni: string;
  childPhone: string;
  childEmail: string;
  legalStatus: 'MENOR' | 'MAYOR' | 'EMANCIPADO';
  circularPreference: 'EMAIL' | 'CORREO_POSTAL';
  parent1Dni: string;
  parent2Dni: string;
  parentsMaritalStatus: string;
  custodyType: 'SIN_ESPECIFICAR' | 'TUTELA_LEGAL' | 'CUSTODIA_UNICA' | 'CUSTODIA_CONJUNTA';
  // Ficha médica
  bloodType: string;
  chronicDiseases: string;
  allergies: string;
  medHeadache: string;
  medFever: string;
  medStomach: string;
  medThroat: string;
  medicalObservations: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  authorizesEmergency: boolean;
  // SEPA / Datos bancarios
  accountHolderName: string;
  accountHolderDni: string;
  accountHolderAddress: string;
  accountHolderMunicipality: string;
  accountHolderPostalCode: string;
  iban: string;
  authorizesSepa: boolean;
}

function buildInitialForm(loaded: ApplicantRecord): UnifiedFormState {
  const enr = loaded.enrollment;
  return {
    childFirstName: loaded.childFirstName || '',
    childLastName1: loaded.childLastName1 || '',
    childLastName2: loaded.childLastName2 || '',
    hasNoSecondLastName: Boolean(loaded.hasNoSecondLastName),
    noSecondLastNameJustification: loaded.noSecondLastNameJustification || '',
    childBirthDate: loaded.childBirthDate ? loaded.childBirthDate.slice(0, 10) : '',
    gender:
      loaded.gender === 'MASCULINO' || loaded.gender === 'FEMENINO' ? loaded.gender : '',
    streetAddress: loaded.streetAddress || '',
    streetNumber: loaded.streetNumber || '',
    apartmentDoor: loaded.apartmentDoor ?? loaded.ApartmentDoor ?? '',
    postalCode: loaded.postalCode || '',
    municipality: loaded.municipality || '',
    province: loaded.province || '',
    parent1FirstName: loaded.parent1FirstName || '',
    parent1LastName: loaded.parent1LastName || '',
    parent1Phone: loaded.parent1Phone || '',
    parent1Email: loaded.parent1Email || '',
    parent1Relationship: loaded.parent1Relationship || '',
    parent2FirstName: loaded.parent2FirstName || '',
    parent2LastName: loaded.parent2LastName || '',
    parent2Phone: loaded.parent2Phone || '',
    parent2Email: loaded.parent2Email || '',
    parent2Relationship: loaded.parent2Relationship || '',
    motivation: loaded.motivation || '',
    hasFamilyInGroup: Boolean(loaded.hasFamilyInGroup),
    familyMemberDetails: loaded.familyMemberDetails || '',
    comesFromOtherGroup: Boolean(loaded.comesFromOtherGroup),
    originGroupDetails: loaded.originGroupDetails || '',
    socialInclusionPriority: Boolean(loaded.socialInclusionPriority),
    kraalInternalNotes: loaded.kraalInternalNotes || '',
    childDni: enr?.childDni || '',
    childPhone: enr?.childPhone || '',
    childEmail: enr?.childEmail || '',
    legalStatus: enr?.legalStatus || 'MENOR',
    circularPreference: enr?.circularPreference || 'EMAIL',
    parent1Dni: enr?.parent1Dni || '',
    parent2Dni: enr?.parent2Dni || '',
    parentsMaritalStatus: enr?.parentsMaritalStatus || '',
    custodyType: enr?.custodyType || 'SIN_ESPECIFICAR',
    bloodType: enr?.bloodType || '',
    chronicDiseases: enr?.chronicDiseases || '',
    allergies: enr?.allergies || '',
    medHeadache: enr?.medHeadache || '',
    medFever: enr?.medFever || '',
    medStomach: enr?.medStomach || '',
    medThroat: enr?.medThroat || '',
    medicalObservations: enr?.medicalObservations || '',
    emergencyContactName: enr?.emergencyContactName || '',
    emergencyContactPhone: enr?.emergencyContactPhone || '',
    emergencyContactRelationship: enr?.emergencyContactRelationship || '',
    authorizesEmergency: enr?.authorizesEmergency ?? true,
    accountHolderName: enr?.accountHolderName || '',
    accountHolderDni: enr?.accountHolderDni || '',
    accountHolderAddress: enr?.accountHolderAddress || '',
    accountHolderMunicipality: enr?.accountHolderMunicipality || '',
    accountHolderPostalCode: enr?.accountHolderPostalCode || '',
    iban: enr?.iban || '',
    authorizesSepa: enr?.authorizesSepa ?? true,
  };
}

function optionalOrNull(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function ApplicantDetailModal({
  recordId,
  canUpdate,
  canDelete,
  canPreviewAurora = false,
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
    canUpdate && isCensusEditable && detail?.enrollment && !detail.enrollment.medicalAccessRestricted && !detail.enrollment.bankAccessRestricted,
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

        {/* Indicador visual de fase del ciclo de vida */}
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
                <div className="space-y-4">
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
                        Datos del educando
                      </h3>
                      {detail.status === 'INSCRIPCION_COMPLETADA' && (
                        <span className="text-[11px] text-slate-500">
                          Inscripción firmada por la familia · Si necesita corrección, renueva el enlace.
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <FormField label="Nombre">
                        <input
                          type="text"
                          disabled={!canEditIdentity}
                          value={formState.childFirstName}
                          onChange={(e) => updateField('childFirstName', e.target.value)}
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="Primer apellido">
                        <input
                          type="text"
                          disabled={!canEditIdentity}
                          value={formState.childLastName1}
                          onChange={(e) => updateField('childLastName1', e.target.value)}
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="Segundo apellido">
                        <input
                          type="text"
                          disabled={!canEditIdentity || formState.hasNoSecondLastName}
                          value={formState.hasNoSecondLastName ? '' : formState.childLastName2}
                          onChange={(e) => updateField('childLastName2', e.target.value)}
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="Fecha de nacimiento">
                        <DatePicker
                          name="childBirthDate"
                          disabled={!canEditIdentity}
                          value={formState.childBirthDate}
                          onValueChange={(iso) => updateField('childBirthDate', iso)}
                        />
                      </FormField>

                      {(isCensusEditable || detail.gender) && (
                        <FormField label="Género">
                          <select
                            disabled={!isCensusEditable || !canUpdate}
                            value={formState.gender}
                            onChange={(e) =>
                              updateField(
                                'gender',
                                e.target.value as 'MASCULINO' | 'FEMENINO' | '',
                              )
                            }
                            className={formInputClass(false, 'bg-white')}
                          >
                            <option value="">Selecciona género…</option>
                            <option value="MASCULINO">Masculino</option>
                            <option value="FEMENINO">Femenino</option>
                          </select>
                        </FormField>
                      )}
                    </div>

                    {canEditIdentity && (
                      <div className="space-y-2 pt-1">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formState.hasNoSecondLastName}
                            onChange={(e) => {
                              updateField('hasNoSecondLastName', e.target.checked);
                              if (e.target.checked) updateField('childLastName2', '');
                            }}
                            className={formCheckboxClass}
                          />
                          <span>Sin segundo apellido (excepción justificada)</span>
                        </label>
                        {formState.hasNoSecondLastName && (
                          <FormField label="Justificación">
                            <input
                              type="text"
                              value={formState.noSecondLastNameJustification}
                              onChange={(e) =>
                                updateField('noSecondLastNameJustification', e.target.value)
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                        )}
                      </div>
                    )}
                  </section>

                  {(isCensusEditable || detail.streetAddress) && (
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
                        Domicilio postal
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                        <FormField label="Dirección principal" className="sm:col-span-3">
                          <input
                            type="text"
                            disabled={!isCensusEditable || !canUpdate}
                            value={formState.streetAddress}
                            onChange={(e) => updateField('streetAddress', e.target.value)}
                            className={formInputClass()}
                          />
                        </FormField>
                        <FormField label="Número">
                          <input
                            type="text"
                            disabled={!isCensusEditable || !canUpdate}
                            value={formState.streetNumber}
                            onChange={(e) => updateField('streetNumber', e.target.value)}
                            className={formInputClass()}
                          />
                        </FormField>
                        <FormField label="Piso / Puerta" className="sm:col-span-2">
                          <input
                            type="text"
                            disabled={!isCensusEditable || !canUpdate}
                            value={formState.apartmentDoor}
                            onChange={(e) => updateField('apartmentDoor', e.target.value)}
                            className={formInputClass()}
                          />
                        </FormField>
                        <FormField label="Código postal">
                          <input
                            type="text"
                            maxLength={5}
                            disabled={!isCensusEditable || !canUpdate}
                            value={formState.postalCode}
                            onChange={(e) => updateField('postalCode', e.target.value)}
                            className={formInputClass()}
                          />
                        </FormField>
                        <FormField label="Localidad" className="sm:col-span-3">
                          <input
                            type="text"
                            disabled={!isCensusEditable || !canUpdate}
                            value={formState.municipality}
                            onChange={(e) => updateField('municipality', e.target.value)}
                            className={formInputClass()}
                          />
                        </FormField>
                        <FormField label="Provincia" className="sm:col-span-2">
                          <input
                            type="text"
                            disabled={!isCensusEditable || !canUpdate}
                            value={formState.province}
                            onChange={(e) => updateField('province', e.target.value)}
                            className={formInputClass()}
                          />
                        </FormField>
                      </div>
                    </section>
                  )}

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
                              disabled={!canEditIdentity}
                              value={formState.parent1FirstName}
                              onChange={(e) => updateField('parent1FirstName', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Apellidos">
                            <input
                              type="text"
                              disabled={!canEditIdentity}
                              value={formState.parent1LastName}
                              onChange={(e) => updateField('parent1LastName', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Teléfono">
                            <input
                              type="tel"
                              disabled={!canEditIdentity}
                              value={formState.parent1Phone}
                              onChange={(e) => updateField('parent1Phone', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Email">
                            <input
                              type="email"
                              disabled={!canEditIdentity}
                              value={formState.parent1Email}
                              onChange={(e) => updateField('parent1Email', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          {isCensusEditable && (
                            <FormField label="Relación con el educando" className="col-span-2">
                              <select
                                disabled={!canUpdate}
                                value={formState.parent1Relationship}
                                onChange={(e) => updateField('parent1Relationship', e.target.value)}
                                className={formInputClass(false, 'bg-white')}
                              >
                                <option value="">Selecciona relación…</option>
                                {RELATIONSHIP_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </FormField>
                          )}
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
                              disabled={!canEditIdentity}
                              value={formState.parent2FirstName}
                              onChange={(e) => updateField('parent2FirstName', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Apellidos">
                            <input
                              type="text"
                              disabled={!canEditIdentity}
                              value={formState.parent2LastName}
                              onChange={(e) => updateField('parent2LastName', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Teléfono">
                            <input
                              type="tel"
                              disabled={!canEditIdentity}
                              value={formState.parent2Phone}
                              onChange={(e) => updateField('parent2Phone', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Email">
                            <input
                              type="email"
                              disabled={!canEditIdentity}
                              value={formState.parent2Email}
                              onChange={(e) => updateField('parent2Email', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          {isCensusEditable && (
                            <FormField label="Relación con el educando" className="col-span-2">
                              <select
                                disabled={!canUpdate}
                                value={formState.parent2Relationship}
                                onChange={(e) => updateField('parent2Relationship', e.target.value)}
                                className={formInputClass(false, 'bg-white')}
                              >
                                <option value="">Selecciona relación…</option>
                                {RELATIONSHIP_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </FormField>
                          )}
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
                          disabled={!canEditCriteria}
                          checked={formState.hasFamilyInGroup}
                          onChange={(e) => updateField('hasFamilyInGroup', e.target.checked)}
                          className={formCheckboxClass}
                        />
                        <span>
                          <strong>Familiar en el grupo (+100)</strong>
                        </span>
                      </label>
                      <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!canEditCriteria}
                          checked={formState.socialInclusionPriority}
                          onChange={(e) =>
                            updateField('socialInclusionPriority', e.target.checked)
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
                          disabled={!canEditCriteria}
                          checked={formState.comesFromOtherGroup}
                          onChange={(e) => updateField('comesFromOtherGroup', e.target.checked)}
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
                          disabled={!canEditCriteria}
                          value={formState.familyMemberDetails}
                          onChange={(e) => updateField('familyMemberDetails', e.target.value)}
                          className={formInputClass()}
                        />
                      </FormField>
                    )}

                    {formState.comesFromOtherGroup && (
                      <FormField label="Grupo scout de procedencia">
                        <input
                          type="text"
                          disabled={!canEditCriteria}
                          value={formState.originGroupDetails}
                          onChange={(e) => updateField('originGroupDetails', e.target.value)}
                          className={formInputClass()}
                        />
                      </FormField>
                    )}

                    <FormField label="Motivación de la familia">
                      <textarea
                        rows={2}
                        disabled={!canEditCriteria}
                        value={formState.motivation}
                        onChange={(e) => updateField('motivation', e.target.value)}
                        className={formInputClass(false, 'resize-y')}
                      />
                    </FormField>

                    <FormField label="Notas internas del Kraal (privadas)">
                      <textarea
                        rows={3}
                        disabled={!canEditCriteria}
                        value={formState.kraalInternalNotes}
                        onChange={(e) => updateField('kraalInternalNotes', e.target.value)}
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

              {activeTab === 'inscripcion' && detail.enrollment && (
                <div className="space-y-4">
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold uppercase tracking-wider text-[#000254]">
                        Datos legales, DNI y consentimientos
                      </h3>
                      <SecButton variant="secondary" size="xs" onClick={handleDownloadPdf}>
                        <FileDown size={13} /> Descargar PDF oficial
                      </SecButton>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FormField label="DNI / NIE del educando">
                        <input
                          type="text"
                          disabled={!canEditFullEnrollment}
                          value={formState.childDni}
                          onChange={(e) => updateField('childDni', e.target.value)}
                          placeholder="Sin DNI"
                          className={formInputClass(false, 'uppercase')}
                        />
                      </FormField>
                      <FormField label="Teléfono del educando">
                        <input
                          type="tel"
                          disabled={!canEditFullEnrollment}
                          value={formState.childPhone}
                          onChange={(e) => updateField('childPhone', e.target.value)}
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="Email del educando">
                        <input
                          type="email"
                          disabled={!canEditFullEnrollment}
                          value={formState.childEmail}
                          onChange={(e) => updateField('childEmail', e.target.value)}
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="Situación legal">
                        <select
                          disabled={!canEditFullEnrollment}
                          value={formState.legalStatus}
                          onChange={(e) =>
                            updateField(
                              'legalStatus',
                              e.target.value as UnifiedFormState['legalStatus'],
                            )
                          }
                          className={formInputClass(false, 'bg-white')}
                        >
                          <option value="MENOR">Menor de edad</option>
                          <option value="MAYOR">Mayor de edad</option>
                          <option value="EMANCIPADO">Emancipado</option>
                        </select>
                      </FormField>
                      <FormField label="Recepción de circulares">
                        <select
                          disabled={!canEditFullEnrollment}
                          value={formState.circularPreference}
                          onChange={(e) =>
                            updateField(
                              'circularPreference',
                              e.target.value as UnifiedFormState['circularPreference'],
                            )
                          }
                          className={formInputClass(false, 'bg-white')}
                        >
                          <option value="EMAIL">Correo electrónico</option>
                          <option value="CORREO_POSTAL">Correo postal</option>
                        </select>
                      </FormField>
                      <FormField label="Régimen de custodia">
                        <select
                          disabled={!canEditFullEnrollment}
                          value={formState.custodyType}
                          onChange={(e) =>
                            updateField(
                              'custodyType',
                              e.target.value as UnifiedFormState['custodyType'],
                            )
                          }
                          className={formInputClass(false, 'bg-white')}
                        >
                          <option value="SIN_ESPECIFICAR">Estándar / Patria potestad</option>
                          <option value="CUSTODIA_UNICA">Custodia Única</option>
                          <option value="CUSTODIA_CONJUNTA">Custodia Conjunta</option>
                          <option value="TUTELA_LEGAL">Tutela Legal</option>
                        </select>
                      </FormField>
                      <FormField label="DNI / NIE Tutor 1">
                        <input
                          type="text"
                          disabled={!canEditFullEnrollment}
                          value={formState.parent1Dni}
                          onChange={(e) => updateField('parent1Dni', e.target.value)}
                          className={formInputClass(false, 'uppercase')}
                        />
                      </FormField>
                      <FormField label="DNI / NIE Tutor 2">
                        <input
                          type="text"
                          disabled={!canEditFullEnrollment}
                          value={formState.parent2Dni}
                          onChange={(e) => updateField('parent2Dni', e.target.value)}
                          className={formInputClass(false, 'uppercase')}
                        />
                      </FormField>
                      <FormField label="Situación familiar / estado civil">
                        <input
                          type="text"
                          disabled={!canEditFullEnrollment}
                          value={formState.parentsMaritalStatus}
                          onChange={(e) => updateField('parentsMaritalStatus', e.target.value)}
                          className={formInputClass()}
                        />
                      </FormField>
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
                      <SecBadge tone="neutral">
                        Versión v{detail.enrollment.consentTextVersion || '2026.1'}
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
                        {canPreviewAurora && (
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

                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 text-xs">
                    <h3 className="font-bold uppercase tracking-wider text-[#000254] inline-flex items-center gap-1.5">
                      <HeartPulse size={14} className="text-rose-600" /> Ficha médica y emergencia
                    </h3>
                    {detail.enrollment.medicalAccessRestricted ? (
                      <p className="inline-flex items-center gap-1.5 text-slate-500">
                        <Lock size={13} /> Acceso restringido: tu perfil solo tiene permiso de lectura general.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <FormField label="Grupo sanguíneo">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.bloodType}
                              onChange={(e) => updateField('bloodType', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Enfermedades crónicas" className="sm:col-span-2">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.chronicDiseases}
                              onChange={(e) => updateField('chronicDiseases', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Alergias" className="sm:col-span-3">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.allergies}
                              onChange={(e) => updateField('allergies', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Dolor de cabeza">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.medHeadache}
                              onChange={(e) => updateField('medHeadache', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Fiebre">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.medFever}
                              onChange={(e) => updateField('medFever', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Dolor de estómago">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.medStomach}
                              onChange={(e) => updateField('medStomach', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Dolor de garganta">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.medThroat}
                              onChange={(e) => updateField('medThroat', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Observaciones médicas" className="sm:col-span-2">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.medicalObservations}
                              onChange={(e) => updateField('medicalObservations', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Contacto de emergencia">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.emergencyContactName}
                              onChange={(e) => updateField('emergencyContactName', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Teléfono de emergencia">
                            <input
                              type="tel"
                              disabled={!canEditFullEnrollment}
                              value={formState.emergencyContactPhone}
                              onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Vínculo emergencia">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.emergencyContactRelationship}
                              onChange={(e) =>
                                updateField('emergencyContactRelationship', e.target.value)
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!canEditFullEnrollment}
                            checked={formState.authorizesEmergency}
                            onChange={(e) => updateField('authorizesEmergency', e.target.checked)}
                            className={formCheckboxClass}
                          />
                          <span>Autorización médica de urgencia activa</span>
                        </label>
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 text-xs">
                    <h3 className="font-bold uppercase tracking-wider text-[#000254] inline-flex items-center gap-1.5">
                      <CreditCard size={14} className="text-[#01317b]" /> Datos bancarios (SEPA)
                    </h3>
                    {detail.enrollment.bankAccessRestricted ? (
                      <p className="inline-flex items-center gap-1.5 text-slate-500">
                        <Lock size={13} /> IBAN enmascarado: {detail.enrollment.ibanMasked}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <FormField label="Titular de la cuenta">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.accountHolderName}
                              onChange={(e) => updateField('accountHolderName', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="DNI del titular">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.accountHolderDni}
                              onChange={(e) => updateField('accountHolderDni', e.target.value)}
                              className={formInputClass(false, 'uppercase')}
                            />
                          </FormField>
                          <FormField label="IBAN">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.iban}
                              onChange={(e) => updateField('iban', e.target.value)}
                              className={formInputClass(false, 'font-mono uppercase')}
                            />
                          </FormField>
                          <FormField label="Dirección del titular">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.accountHolderAddress}
                              onChange={(e) => updateField('accountHolderAddress', e.target.value)}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Localidad del titular">
                            <input
                              type="text"
                              disabled={!canEditFullEnrollment}
                              value={formState.accountHolderMunicipality}
                              onChange={(e) =>
                                updateField('accountHolderMunicipality', e.target.value)
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Código postal del titular">
                            <input
                              type="text"
                              maxLength={5}
                              disabled={!canEditFullEnrollment}
                              value={formState.accountHolderPostalCode}
                              onChange={(e) =>
                                updateField('accountHolderPostalCode', e.target.value)
                              }
                              className={formInputClass()}
                            />
                          </FormField>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!canEditFullEnrollment}
                            checked={formState.authorizesSepa}
                            onChange={(e) => updateField('authorizesSepa', e.target.checked)}
                            className={formCheckboxClass}
                          />
                          <span>Orden de domiciliación SEPA autorizada</span>
                        </label>
                      </div>
                    )}
                  </section>

                  {/* Firmas digitales registradas (siempre en solo lectura por integridad legal) */}
                  {(detail.enrollment.signatureParent1 || detail.enrollment.signatureParent2) && (
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 text-xs">
                      <h3 className="font-bold uppercase tracking-wider text-[#000254]">
                        Firmas registradas (solo lectura)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {detail.enrollment.signatureParent1 && (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8f9fc] p-3 space-y-1.5">
                            <p className="font-semibold text-slate-700">
                              Firma 1 · {detail.enrollment.signer1FullName || detail.parent1FirstName}{' '}
                              ({formatIsoToHumanShort(detail.enrollment.signedAtParent1)})
                            </p>
                            <img
                              src={detail.enrollment.signatureParent1}
                              alt="Firma tutor 1"
                              className="h-24 max-w-full object-contain"
                            />
                          </div>
                        )}
                        {detail.enrollment.signatureParent2 && (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8f9fc] p-3 space-y-1.5">
                            <p className="font-semibold text-slate-700">
                              Firma 2 · {detail.enrollment.signer2FullName || detail.parent2FirstName}{' '}
                              {detail.enrollment.signedAtParent2
                                ? `(${formatIsoToHumanShort(detail.enrollment.signedAtParent2)})`
                                : ''}
                            </p>
                            <img
                              src={detail.enrollment.signatureParent2}
                              alt="Firma tutor 2"
                              className="h-24 max-w-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </section>
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
                            <strong className="text-[#0c1933]">
                              {AUDIT_ACTION_LABELS[event.action] || event.action}
                            </strong>
                            <span className="text-slate-500 block text-[11px]">
                              Realizado por:{' '}
                              {event.actor
                                ? `${event.actor.name} (${event.actor.email})`
                                : 'Familia / Formulario público'}
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
