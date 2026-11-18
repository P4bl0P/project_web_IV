import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, X } from 'lucide-react';
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
      currentStep === 1 ? (formData.custodyType === 'CUSTODIA_CONJUNTA' && !formData.parent2Dni ? 'parent2Dni' : 'parent1Dni') :
      currentStep === 2 ? 'authorizesEmergency' :
      currentStep === 3
        ? (!formData.accountHolderName.trim()
          ? 'accountHolderName'
          : !formData.accountHolderDni.trim()
            ? 'accountHolderDni'
            : formData.iban.replace(/\s+/g, '').length !== 24
              ? 'iban'
              : 'authorizesSepa') :
      formData.custodyType === 'CUSTODIA_CONJUNTA' && !formData.signatureParent2 ? 'signatureParent2' : 'signatureParent1';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="census-form-title">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-slate-50 shadow-xl">
        <header className="flex items-start justify-between bg-indigo-900 px-5 py-5 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Secretaría · Censo</p>
            <h2 id="census-form-title" className="mt-1 text-xl font-bold">
              {isEditing ? 'Editar inscripción censada' : 'Alta directa en el censo'}
            </h2>
            <p className="mt-1 text-xs text-indigo-200">Los campos marcados con * son obligatorios.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-indigo-100 hover:bg-white/10" aria-label="Cerrar formulario">
            <X size={18} />
          </button>
        </header>

        <nav className="grid grid-cols-2 gap-2 border-b border-slate-200 bg-white p-3 md:grid-cols-4" aria-label="Pasos del formulario">
          {STEPS.map((item) => (
            <button
              key={item.number}
              type="button"
              onClick={() => item.number < step && setStep(item.number)}
              className={`rounded-xl px-3 py-2 text-left transition ${
                item.number === step
                  ? 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200'
                  : item.number < step
                    ? 'text-slate-700 hover:bg-slate-50'
                    : 'text-slate-400'
              }`}
              aria-current={item.number === step ? 'step' : undefined}
            >
              <span className="text-[11px] font-bold uppercase tracking-wide">Paso {item.number}</span>
              <span className="mt-0.5 block text-xs font-bold">{item.title}</span>
              <span className="mt-0.5 block text-[11px]">{item.description}</span>
            </button>
          ))}
        </nav>

        <main className="space-y-5 p-5">
          {error && <CensusErrorSummary message={error} fieldErrors={fieldErrors} />}

          {step === 1 && (
            <>
              <CensusIdentitySection formData={formData} fieldErrors={fieldErrors} onChange={handleChange} />
              <Step1Legal applicant={applicantForSteps} formData={formData} onChange={handleChange} fieldErrors={fieldErrors} />
              <CensusCriteriaSection formData={formData} fieldErrors={fieldErrors} onChange={handleChange} />
            </>
          )}
          {step === 2 && <Step2Medical formData={formData} onChange={handleChange} fieldErrors={fieldErrors} />}
          {step === 3 && <Step3Bank formData={formData} onChange={handleChange} fieldErrors={fieldErrors} />}
          {step === 4 && (
            <Step4Sign
              applicant={applicantForSteps}
              formData={formData}
              onChange={handleChange}
              onSign1={(signatureParent1) => setFormData((previous) => ({ ...previous, signatureParent1 }))}
              onSign2={(signatureParent2) => setFormData((previous) => ({ ...previous, signatureParent2 }))}
              readOnly={isEditing}
            />
          )}

          <footer className="flex justify-between border-t border-slate-200 pt-4">
            {step > 1 ? (
              <button type="button" onClick={() => setStep((current) => current - 1)} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-white">
                <ChevronLeft size={15} /> Anterior
              </button>
            ) : <div />}
            {step < 4 ? (
              <button type="button" onClick={handleNext} className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">
                Siguiente <ChevronRight size={15} />
              </button>
            ) : (
              <button type="button" disabled={saving} onClick={handleSubmit} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isEditing ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
                {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear y censar'}
              </button>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
