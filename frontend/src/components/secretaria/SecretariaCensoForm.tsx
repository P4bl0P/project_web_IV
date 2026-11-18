import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  applicationsApi,
  type ApplicantRecord,
  type DirectCensusPayload,
} from '../../services/api';
import { validateEnrollmentStep, validateSolicitudForm } from '../../utils/scoutValidators';
import Step1Legal from '../inscripcion/Step1Legal';
import Step2Medical from '../inscripcion/Step2Medical';
import Step3Bank from '../inscripcion/Step3Bank';
import Step4Sign from '../inscripcion/Step4Sign';
import CensusCriteriaSection from './censo/CensusCriteriaSection';
import CensusErrorSummary from './censo/CensusErrorSummary';
import CensusIdentitySection from './censo/CensusIdentitySection';
import {
  buildCensusPayload,
  formFromRecord,
  type CensusChangeHandler,
  type CensusFieldErrors,
} from './censo/censusForm';
import { SecButton } from './secretariaTheme';
import { secTokens } from './secretariaTokens';

interface Props {
  record?: ApplicantRecord | null;
  onClose: () => void;
  onSaved: (record: ApplicantRecord) => void;
}

const STEPS = [
  { number: 1, title: 'Datos personales', description: 'Identidad, contacto y domicilio' },
  { number: 2, title: 'Ficha médica', description: 'Salud y autorizaciones médicas' },
  { number: 3, title: 'Domiciliación', description: 'Cuenta bancaria y SEPA' },
  { number: 4, title: 'Autorizaciones', description: 'Consentimientos y firmas' },
];

export default function SecretariaCensoForm({ record, onClose, onSaved }: Props) {
  const isEditing = Boolean(record);
  const [formData, setFormData] = useState<DirectCensusPayload>(() => formFromRecord(record));
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CensusFieldErrors>({});
  const [saving, setSaving] = useState(false);

  const showSecondParent = useMemo(
    () => Boolean(formData.parent2FirstName || formData.parent2Phone || formData.parent2Email),
    [formData.parent2Email, formData.parent2FirstName, formData.parent2Phone],
  );

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const handleChange: CensusChangeHandler = (event) => {
    const { name, value, type } = event.target;
    const nextValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;
    setFormData((previous) => ({ ...previous, [name]: nextValue }));
    setError(null);
    setFieldErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  const setEnrollmentError = (currentStep: number) => {
    const field =
      currentStep === 1
        ? formData.custodyType === 'CUSTODIA_CONJUNTA' && !formData.parent2Dni
          ? 'parent2Dni'
          : 'parent1Dni'
        : currentStep === 2
          ? 'authorizesEmergency'
          : currentStep === 3
            ? !formData.accountHolderName.trim()
              ? 'accountHolderName'
              : !formData.accountHolderDni.trim()
                ? 'accountHolderDni'
                : formData.iban.replace(/\s+/g, '').length !== 24
                  ? 'iban'
                  : 'authorizesSepa'
            : formData.custodyType === 'CUSTODIA_CONJUNTA' && !formData.signatureParent2
              ? 'signatureParent2'
              : 'signatureParent1';
    setFieldErrors((previous) => ({ ...previous, [field]: 'Revisa este campo.' }));
  };

  const validateCurrentStep = () => {
    if (step === 1) {
      const solicitudErrors = validateSolicitudForm(formData, showSecondParent);
      setFieldErrors(solicitudErrors as CensusFieldErrors);
      if (Object.keys(solicitudErrors).length > 0) return 'Revisa los datos personales y de contacto.';
    }

    const enrollmentError = validateEnrollmentStep(step, formData);
    if (enrollmentError) {
      setEnrollmentError(step);
      return enrollmentError;
    }
    return null;
  };

  const handleNext = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((current) => current + 1);
  };

  const handleSubmit = async () => {
    for (const currentStep of [1, 2, 3, 4]) {
      const enrollmentError = validateEnrollmentStep(currentStep, formData);
      if (enrollmentError) {
        setStep(currentStep);
        setError(enrollmentError);
        setEnrollmentError(currentStep);
        return;
      }
    }

    const solicitudErrors = validateSolicitudForm(formData, showSecondParent);
    if (Object.keys(solicitudErrors).length > 0) {
      setStep(1);
      setError('Revisa los datos personales y de contacto.');
      setFieldErrors(solicitudErrors as CensusFieldErrors);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const completePayload = buildCensusPayload(formData);
      let saved: ApplicantRecord;
      if (isEditing) {
        const editablePayload: Partial<DirectCensusPayload> = { ...completePayload };
        delete editablePayload.signatureParent1;
        delete editablePayload.signatureParent2;
        saved = await applicationsApi.updateCensus(record!.id, editablePayload);
      } else {
        saved = await applicationsApi.createDirectCensus(completePayload);
      }
      onSaved(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el censo.');
    } finally {
      setSaving(false);
    }
  };

  const applicantForSteps = { parent1FirstName: formData.parent1FirstName };

  return (
    <div
      className={secTokens.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="census-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className={secTokens.modalPanel}>
        {/* Cabecera de la ventana modal */}
        <header className="flex items-start justify-between gap-4 bg-gradient-to-r from-[#000254] to-[#01317b] px-5 sm:px-7 py-5 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">
              Secretaría · Censo Oficial
            </p>
            <h2 id="census-form-title" className="mt-1 text-lg sm:text-xl font-bold tracking-tight">
              {isEditing ? 'Editar inscripción censada' : 'Alta directa en el censo'}
            </h2>
            <p className="mt-1 text-xs text-blue-100/85">
              Los campos marcados con * son obligatorios para completar la ficha oficial.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            aria-label="Cerrar formulario"
          >
            <X size={18} />
          </button>
        </header>

        {/* Navegación por pasos (homogénea con la inscripción mágica) */}
        <nav
          className="grid grid-cols-2 gap-2 border-b border-slate-200/85 bg-white px-4 sm:px-6 py-3 md:grid-cols-4"
          aria-label="Pasos del formulario"
        >
          {STEPS.map((item) => {
            const isCurrent = item.number === step;
            const isCompleted = item.number < step;
            return (
              <button
                key={item.number}
                type="button"
                onClick={() => isCompleted && setStep(item.number)}
                disabled={!isCompleted && !isCurrent}
                className={`group flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-150 ${
                  isCurrent
                    ? 'border-[#01317b]/30 bg-[#01317b]/[0.06] text-[#000254] shadow-[0_2px_10px_rgba(1,49,123,0.06)]'
                    : isCompleted
                      ? 'border-emerald-200/90 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-50 cursor-pointer'
                      : 'border-slate-200/60 bg-slate-50/60 text-slate-400 cursor-default'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    isCurrent
                      ? 'bg-[#01317b] text-white'
                      : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200/80 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={13} /> : item.number}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider opacity-75">
                    Paso {item.number}
                  </span>
                  <span className="mt-0.5 block text-xs font-bold truncate">{item.title}</span>
                  <span className="mt-0.5 hidden sm:block text-[11px] opacity-80 truncate">
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Contenido del paso activo */}
        <main className="space-y-4 p-4 sm:p-6 max-h-[calc(85vh-9rem)] overflow-y-auto">
          {error && <CensusErrorSummary message={error} fieldErrors={fieldErrors} />}

          {step === 1 && (
            <div className="space-y-4">
              <CensusIdentitySection
                formData={formData}
                fieldErrors={fieldErrors}
                onChange={handleChange}
              />
              <Step1Legal
                applicant={applicantForSteps}
                formData={formData}
                onChange={handleChange}
                fieldErrors={fieldErrors}
              />
              <CensusCriteriaSection
                formData={formData}
                fieldErrors={fieldErrors}
                onChange={handleChange}
              />
            </div>
          )}
          {step === 2 && (
            <Step2Medical formData={formData} onChange={handleChange} fieldErrors={fieldErrors} />
          )}
          {step === 3 && (
            <Step3Bank formData={formData} onChange={handleChange} fieldErrors={fieldErrors} />
          )}
          {step === 4 && (
            <Step4Sign
              applicant={applicantForSteps}
              formData={formData}
              onChange={handleChange}
              onSign1={(signatureParent1) =>
                setFormData((previous) => ({ ...previous, signatureParent1 }))
              }
              onSign2={(signatureParent2) =>
                setFormData((previous) => ({ ...previous, signatureParent2 }))
              }
              readOnly={isEditing}
            />
          )}

          {/* Barra inferior de acciones del formulario */}
          <footer className="flex items-center justify-between gap-3 border-t border-slate-200/85 pt-4 mt-2">
            {step > 1 ? (
              <SecButton
                variant="secondary"
                size="lg"
                onClick={() => setStep((current) => current - 1)}
              >
                <ChevronLeft size={15} /> Anterior
              </SecButton>
            ) : (
              <SecButton variant="tertiary" size="lg" onClick={onClose}>
                Cancelar
              </SecButton>
            )}

            {step < 4 ? (
              <SecButton variant="primary" size="lg" onClick={handleNext}>
                Siguiente <ChevronRight size={15} />
              </SecButton>
            ) : (
              <SecButton
                variant="success"
                size="lg"
                disabled={saving}
                onClick={handleSubmit}
              >
                {isEditing ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
                {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear y censar'}
              </SecButton>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
