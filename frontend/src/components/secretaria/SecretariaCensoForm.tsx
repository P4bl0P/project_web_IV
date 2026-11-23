import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { useLockBodyScroll } from '../../utils/useLockBodyScroll';
import Step1Legal from '../inscripcion/Step1Legal';
import Step2Medical from '../inscripcion/Step2Medical';
import Step3Bank from '../inscripcion/Step3Bank';
import Step4Sign from '../inscripcion/Step4Sign';
import CensusCriteriaSection from './censo/CensusCriteriaSection';
import CensusErrorSummary from './censo/CensusErrorSummary';
import CensusIdentitySection from './censo/CensusIdentitySection';
import {
  EMPTY_CENSUS_FORM,
  buildCensusPayload,
  findFirstInvalidCensusStep,
  validateAllCensusSteps,
  type CensusChangeHandler,
  type CensusFieldErrors,
  type CensusStepNumber,
} from './censo/censusForm';
import { SecButton } from './secretariaTheme';
import { secTokens } from './secretariaTokens';

interface Props {
  onClose: () => void;
  onSaved: (record: ApplicantRecord) => void;
}

const STEPS: {
  number: CensusStepNumber;
  title: string;
  description: string;
}[] = [
  { number: 1, title: 'Datos personales', description: 'Identidad, contacto y domicilio' },
  { number: 2, title: 'Ficha médica', description: 'Salud y autorizaciones médicas' },
  { number: 3, title: 'Domiciliación', description: 'Cuenta bancaria y SEPA' },
  { number: 4, title: 'Autorizaciones', description: 'Consentimientos y firmas' },
];

export default function SecretariaCensoForm({ onClose, onSaved }: Props) {
  useLockBodyScroll();

  const [formData, setFormData] = useState<DirectCensusPayload>(() => ({ ...EMPTY_CENSUS_FORM }));
  const [step, setStep] = useState<CensusStepNumber>(1);
  const [visitedSteps, setVisitedSteps] = useState<Partial<Record<CensusStepNumber, boolean>>>({
    1: true,
  });
  const [validatedSteps, setValidatedSteps] = useState<Partial<Record<CensusStepNumber, boolean>>>(
    {},
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showSecondParent = useMemo(
    () => Boolean(formData.parent2FirstName || formData.parent2Phone || formData.parent2Email),
    [formData.parent2Email, formData.parent2FirstName, formData.parent2Phone],
  );

  const stepValidations = useMemo(
    () => validateAllCensusSteps(formData, showSecondParent),
    [formData, showSecondParent],
  );

  const currentStepValidation = stepValidations[step];
  const isCurrentStepValidated = Boolean(validatedSteps[step]);
  const fieldErrors: CensusFieldErrors = isCurrentStepValidated
    ? currentStepValidation.fieldErrors
    : {};
  const error = serverError ?? (isCurrentStepValidated ? currentStepValidation.message : null);

  const handleChange: CensusChangeHandler = (event) => {
    const { name, value, type } = event.target;
    const nextValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;
    setFormData((previous) => ({ ...previous, [name]: nextValue }));
    setServerError(null);
  };

  const handleSelectStep = (targetStep: CensusStepNumber) => {
    if (targetStep === step) return;
    setServerError(null);
    setVisitedSteps((previous) => ({ ...previous, [step]: true, [targetStep]: true }));
    setValidatedSteps((previous) => ({ ...previous, [step]: true }));
    setStep(targetStep);
  };

  const handlePrevious = () => {
    if (step > 1) {
      handleSelectStep((step - 1) as CensusStepNumber);
    }
  };

  const handleNext = () => {
    setServerError(null);
    setVisitedSteps((previous) => ({ ...previous, [step]: true }));
    setValidatedSteps((previous) => ({ ...previous, [step]: true }));
    if (!currentStepValidation.isValid) {
      return;
    }
    if (step < 4) {
      const nextStep = (step + 1) as CensusStepNumber;
      setVisitedSteps((previous) => ({ ...previous, [nextStep]: true }));
      setStep(nextStep);
    }
  };

  const handleFillEmergencyFromTutor1 = () => {
    setFormData((prev) => ({
      ...prev,
      emergencyContactName: `${prev.parent1FirstName || ''} ${prev.parent1LastName || ''}`.trim(),
      emergencyContactPhone: prev.parent1Phone || '',
      emergencyContactRelationship: prev.parent1Relationship || 'Tutor principal',
    }));
  };

  const handleFillHolderFromTutor1 = () => {
    const fullAddress = [formData.streetAddress, formData.streetNumber, formData.apartmentDoor]
      .filter(Boolean)
      .join(', ');
    setFormData((prev) => ({
      ...prev,
      accountHolderName: `${prev.parent1FirstName || ''} ${prev.parent1LastName || ''}`.trim(),
      accountHolderDni: (prev.parent1Dni || '').trim().toUpperCase(),
      accountHolderAddress: fullAddress,
      accountHolderMunicipality: prev.municipality,
      accountHolderPostalCode: prev.postalCode,
    }));
  };

  const handleSubmit = async () => {
    setServerError(null);
    setVisitedSteps({ 1: true, 2: true, 3: true, 4: true });
    setValidatedSteps({ 1: true, 2: true, 3: true, 4: true });

    const firstInvalidStep = findFirstInvalidCensusStep(stepValidations);
    if (firstInvalidStep) {
      setStep(firstInvalidStep.step);
      return;
    }

    setSaving(true);
    try {
      const completePayload = buildCensusPayload(formData);
      const saved = await applicationsApi.createDirectCensus(completePayload);
      onSaved(saved);
    } catch (reason) {
      setServerError(reason instanceof Error ? reason.message : 'No se pudo guardar el censo.');
    } finally {
      setSaving(false);
    }
  };

  const applicantForSteps = { parent1FirstName: formData.parent1FirstName };

  return createPortal(
    <div
      className={secTokens.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="census-form-title"
    >
      <div className={secTokens.modalPanel}>
        <header className="shrink-0 flex items-start justify-between gap-4 bg-gradient-to-r from-[#000254] to-[#01317b] px-5 sm:px-7 py-5 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">
              Secretaría · Censo Oficial
            </p>
            <h2 id="census-form-title" className="mt-1 text-lg sm:text-xl font-bold tracking-tight">
              Alta directa en el censo
            </h2>
            <p className="mt-1 text-xs text-blue-100/85">
              Los campos marcados con * son obligatorios para completar la ficha oficial.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            aria-label="Cerrar formulario"
          >
            <X size={18} />
          </button>
        </header>

        <nav
          className="shrink-0 grid grid-cols-2 gap-2 border-b border-slate-200/85 bg-white px-4 sm:px-6 py-3 md:grid-cols-4"
          aria-label="Pasos del formulario"
        >
          {STEPS.map((item) => {
            const isCurrent = item.number === step;
            const stepValidation = stepValidations[item.number];
            const isStepValidated = Boolean(validatedSteps[item.number]);
            const hasStepError = !isCurrent && isStepValidated && !stepValidation.isValid;
            const isCompleted =
              !isCurrent &&
              !hasStepError &&
              stepValidation.isValid &&
              Boolean(visitedSteps[item.number]);

            return (
              <button
                key={item.number}
                type="button"
                onClick={() => handleSelectStep(item.number)}
                className={`group flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${
                  isCurrent
                    ? 'border-[#01317b]/30 bg-[#01317b]/[0.06] text-[#000254] shadow-[0_2px_10px_rgba(1,49,123,0.06)]'
                    : hasStepError
                      ? 'border-rose-200/90 bg-rose-50/60 text-rose-900 hover:bg-rose-50'
                      : isCompleted
                        ? 'border-emerald-200/90 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-50'
                        : 'border-slate-200/80 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-slate-100/70 hover:text-[#000254]'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    isCurrent
                      ? 'bg-[#01317b] text-white'
                      : hasStepError
                        ? 'bg-rose-600 text-white'
                        : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200/80 text-slate-600 group-hover:bg-[#01317b]/10 group-hover:text-[#01317b]'
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

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 p-4 sm:p-6">
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
                showIdentityRevision={false}
              />
              <CensusCriteriaSection
                formData={formData}
                fieldErrors={fieldErrors}
                onChange={handleChange}
              />
            </div>
          )}
          {step === 2 && (
            <Step2Medical
              formData={formData}
              onChange={handleChange}
              onFillEmergencyFromTutor1={handleFillEmergencyFromTutor1}
              fieldErrors={fieldErrors}
            />
          )}
          {step === 3 && (
            <Step3Bank
              formData={formData}
              onChange={handleChange}
              onFillHolderFromTutor1={handleFillHolderFromTutor1}
              fieldErrors={fieldErrors}
            />
          )}
          {step === 4 && (
            <Step4Sign
              applicant={applicantForSteps}
              formData={formData}
              onChange={handleChange}
              onSign1={(signatureParent1) => {
                setFormData((previous) => ({ ...previous, signatureParent1 }));
                setServerError(null);
              }}
              onSign2={(signatureParent2) => {
                setFormData((previous) => ({ ...previous, signatureParent2 }));
                setServerError(null);
              }}
            />
          )}
        </main>

        <footer className="shrink-0 flex items-center justify-between gap-3 border-t border-slate-200/85 bg-white px-5 py-3.5">
          {step > 1 ? (
            <SecButton variant="secondary" size="lg" onClick={handlePrevious}>
              <ChevronLeft size={15} /> Anterior
            </SecButton>
          ) : (
            <div />
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
              <ShieldCheck size={16} />
              {saving ? 'Guardando…' : 'Crear y censar'}
            </SecButton>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
