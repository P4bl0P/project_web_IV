import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { applicationsApi, type ApplicantRecord, type CompleteEnrollmentPayload } from '../services/api';
import { validateEnrollmentStep } from '../utils/scoutValidators';
import Step1Legal from '../components/inscripcion/Step1Legal';
import Step2Medical from '../components/inscripcion/Step2Medical';
import Step3Bank from '../components/inscripcion/Step3Bank';
import Step4Sign from '../components/inscripcion/Step4Sign';

export default function InscripcionMagicaPage() {
  const { token } = useParams<{ token: string }>();
  const [applicant, setApplicant] = useState<ApplicantRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

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
        if (data.status === 'INSCRIPCION_COMPLETADA' || data.status === 'CENSADO') setCompleted(true);
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
    const err = validateEnrollmentStep(4, formData);
    if (err || !token) return setStepError(err);
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

  if (loading) return <div className="p-12 text-center text-slate-500">Cargando inscripción...</div>;
  if (loadError || !applicant) {
    return (
      <div className="max-w-md mx-auto p-8 mt-10 bg-white rounded-2xl border border-red-200 text-center">
        <AlertCircle size={36} className="text-red-500 mx-auto mb-2" />
        <p className="text-sm text-slate-700">{loadError}</p>
      </div>
    );
  }
  if (completed) {
    return (
      <div className="max-w-md mx-auto p-8 mt-10 bg-white rounded-2xl border border-emerald-200 text-center">
        <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">¡Inscripción Completada!</h2>
        <p className="text-xs text-slate-600 mt-2">
          La ficha de {applicant.childFirstName} ({applicant.calculatedBranch}) ha quedado registrada.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-5">
      <div className="bg-indigo-900 text-white rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            Inscripción · {applicant.childFirstName} {applicant.childLastName}
          </h1>
          <p className="text-xs text-indigo-200">{applicant.calculatedBranch}</p>
        </div>
        <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">Paso {step} de 4</span>
      </div>

      {stepError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-semibold">
          {stepError}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
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

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 px-4 py-2.5 rounded-xl border border-slate-300"
            >
              <ChevronLeft size={15} /> Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl"
            >
              Siguiente <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-6 py-3 rounded-xl"
            >
              <ShieldCheck size={16} /> {isSubmitting ? 'Guardando...' : 'Firmar y Enviar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}