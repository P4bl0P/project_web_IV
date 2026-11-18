import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { applicationsApi, type ApplicantRecord, type CompleteEnrollmentPayload } from '../services/api';
import { validateEnrollmentStep } from '../utils/scoutValidators';
import Step1Legal from '../components/inscripcion/Step1Legal';
import Step2Medical from '../components/inscripcion/Step2Medical';
import Step3Bank from '../components/inscripcion/Step3Bank';
import Step4Sign from '../components/inscripcion/Step4Sign';
import FormAlert from '../components/ui/forms/FormAlert';
import { SecButton } from '../components/secretaria/secretariaTheme';

export default function InscripcionMagicaPage() {
  const { token } = useParams<{ token: string }>();
  const [applicant, setApplicant] = useState<ApplicantRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const stepItems = [
    { number: 1, label: 'Datos legales' },
    { number: 2, label: 'Ficha médica' },
    { number: 3, label: 'Datos bancarios' },
    { number: 4, label: 'Firmas' },
  ];

  const [formData, setFormData] = useState<CompleteEnrollmentPayload>({
    streetAddress: '',
    streetNumber: '',
    ApartmentDoor: '',
    postalCode: '41089',
    municipality: 'Dos Hermanas',
    province: 'Sevilla',
    parent1Phone: '',
    parent1Email: '',
    parent2Phone: '',
    parent2Email: '',
    childDni: '',
    childPhone: '',
    childEmail: '',
    legalStatus: 'MENOR',
    circularPreference: 'EMAIL',
    parent1Dni: '',
    parent2Dni: '',
    parentsMaritalStatus: 'Casados',
    custodyType: 'SIN_ESPECIFICAR',
    acceptsDataStorage: true,
    acceptsDataTransfer: true,
    authorizesImages: true,
    bloodType: '',
    chronicDiseases: 'Ninguna',
    allergies: 'Ninguna',
    medHeadache: '',
    medFever: '',
    medStomach: '',
    medThroat: '',
    medicalObservations: '',
    authorizesEmergency: true,
    accountHolderName: '',
    accountHolderDni: '',
    iban: 'ES',
    authorizesSepa: true,
    signatureParent1: '',
    signatureParent2: '',
  });

  useEffect(() => {
    if (!token) return;
    applicationsApi
      .getByMagicToken(token)
      .then((data) => {
        setApplicant(data);
        if (data.status === 'INSCRIPCION_COMPLETADA') setCompleted(true);
        setFormData((prev) => ({
          ...prev,
          streetAddress: data.streetAddress || '',
          streetNumber: data.streetNumber || '',
          ApartmentDoor: data.ApartmentDoor || '',
          postalCode: data.postalCode || '41089',
          municipality: data.municipality || 'Dos Hermanas',
          province: data.province || 'Sevilla',
          parent1Phone: data.parent1Phone || '',
          parent1Email: data.parent1Email || '',
          accountHolderName: `${data.parent1FirstName} ${data.parent1LastName}`,
          ...(data.enrollment
            ? {
                childDni: data.enrollment.childDni || '',
                childPhone: data.enrollment.childPhone || '',
                childEmail: data.enrollment.childEmail || '',
                legalStatus: data.enrollment.legalStatus,
                circularPreference: data.enrollment.circularPreference,
                parent1Dni: data.enrollment.parent1Dni || '',
                parent2Dni: data.enrollment.parent2Dni || '',
                parentsMaritalStatus: data.enrollment.parentsMaritalStatus || '',
                custodyType: data.enrollment.custodyType,
                acceptsDataStorage: data.enrollment.acceptsDataStorage,
                acceptsDataTransfer: data.enrollment.acceptsDataTransfer,
                authorizesImages: data.enrollment.authorizesImages,
                bloodType: data.enrollment.bloodType || '',
                chronicDiseases: data.enrollment.chronicDiseases || 'Ninguna',
                allergies: data.enrollment.allergies || 'Ninguna',
                medHeadache: data.enrollment.medHeadache || '',
                medFever: data.enrollment.medFever || '',
                medStomach: data.enrollment.medStomach || '',
                medThroat: data.enrollment.medThroat || '',
                medicalObservations: data.enrollment.medicalObservations || '',
                authorizesEmergency: data.enrollment.authorizesEmergency,
                accountHolderName: data.enrollment.accountHolderName,
                accountHolderDni: data.enrollment.accountHolderDni,
                iban: data.enrollment.iban,
                authorizesSepa: data.enrollment.authorizesSepa,
                signatureParent1: data.enrollment.signatureParent1 || '',
                signatureParent2: data.enrollment.signatureParent2 || '',
              }
            : {}),
        }));
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'Enlace inválido'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    setStepError(null);
  };

  const handleNext = () => {
    const err = validateEnrollmentStep(step, formData);
    if (err) return setStepError(err);
    if (step === 1 && !formData.accountHolderDni) {
      setFormData((p) => ({ ...p, accountHolderDni: p.parent1Dni.toUpperCase() }));
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    let err: string | null = null;
    let invalidStep = 4;
    for (let checkStep = 1; checkStep <= 4; checkStep++) {
      err = validateEnrollmentStep(checkStep, formData);
      if (err) {
        invalidStep = checkStep;
        break;
      }
    }
      if (err) {
        setStep(invalidStep);
        return setStepError(err);
      }
      if (!token) return setStepError('Enlace inválido');
    setIsSubmitting(true);
    try {
      await applicationsApi.submitMagicEnrollment(token, {
        ...formData,
        parent1Dni: formData.parent1Dni.trim().toUpperCase(),
        parent2Dni: formData.parent2Dni?.trim().toUpperCase() || undefined,
        childDni: formData.childDni?.trim().toUpperCase() || undefined,
        accountHolderDni: formData.accountHolderDni.trim().toUpperCase(),
        iban: formData.iban.replace(/\s+/g, '').toUpperCase(),
        signatureParent2: formData.signatureParent2 || undefined,
      });
      setCompleted(true);
    } catch (e: unknown) {
      setStepError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="state-card page-width">Cargando inscripción...</div>;
  if (loadError || !applicant) {
    return (
      <div className="state-card page-width">
        <AlertCircle size={36} className="text-red-500 mx-auto mb-2" />
        <p className="text-sm text-slate-700">{loadError}</p>
      </div>
    );
  }
  if (completed) {
    return (
      <div className="state-card page-width success-state">
        <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">¡Inscripción Completada!</h2>
        <p className="text-xs text-slate-600 mt-2">
          La ficha de {applicant.childFirstName} ({applicant.calculatedBranch}) ha quedado registrada.
        </p>
      </div>
    );
  }

  return (
    <div className="enrollment-page page-width space-y-5">
      <div className="bg-gradient-to-r from-[#000254] to-[#01317b] text-white rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_14px_34px_-10px_rgba(0,2,84,0.22)]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">
            Secretaría · Inscripción Oficial
          </p>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
            {applicant.childFirstName} {applicant.childLastName}
          </h1>
          <p className="text-xs text-blue-100/85 mt-0.5">{applicant.calculatedBranch}</p>
        </div>
        <span className="text-xs font-bold bg-white/15 border border-white/20 px-3.5 py-1.5 rounded-full">
          Paso {step} de 4
        </span>
      </div>

      {stepError && <FormAlert>{stepError}</FormAlert>}

      <div className="space-y-4">
        <nav className="enrollment-step-nav" aria-label="Apartados de la inscripción">
          {stepItems.map((item) => {
            const isCurrent = step === item.number;
            const isComplete =
              !isCurrent && validateEnrollmentStep(item.number, formData) === null;
            return (
              <button
                key={item.number}
                type="button"
                onClick={() => {
                  setStep(item.number);
                  setStepError(null);
                }}
                aria-current={isCurrent ? 'step' : undefined}
                className={`enrollment-step-button ${
                  isCurrent ? 'is-current' : isComplete ? 'is-complete' : 'is-pending'
                }`}
              >
                <span className="enrollment-step-number">
                  {isComplete ? <CheckCircle2 size={16} /> : item.number}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {step === 1 && <Step1Legal applicant={applicant} formData={formData} onChange={handleChange} />}
          {step === 2 && <Step2Medical formData={formData} onChange={handleChange} />}
          {step === 3 && <Step3Bank formData={formData} onChange={handleChange} />}
          {step === 4 && (
            <Step4Sign
              applicant={applicant}
              formData={formData}
              onChange={handleChange}
              onSign1={(s) => setFormData((p) => ({ ...p, signatureParent1: s }))}
              onSign2={(s) => setFormData((p) => ({ ...p, signatureParent2: s }))}
            />
          )}

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/85 bg-white px-5 py-4 shadow-[0_2px_10px_-3px_rgba(12,25,51,0.04)]">
            {step > 1 ? (
              <SecButton
                variant="secondary"
                size="lg"
                onClick={() => setStep((s) => s - 1)}
              >
                <ChevronLeft size={15} /> Anterior
              </SecButton>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <SecButton
                variant="primary"
                size="lg"
                onClick={handleNext}
              >
                Siguiente <ChevronRight size={15} />
              </SecButton>
            ) : (
              <SecButton
                variant="success"
                size="lg"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                <ShieldCheck size={16} /> {isSubmitting ? 'Guardando...' : 'Firmar y Enviar'}
              </SecButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}