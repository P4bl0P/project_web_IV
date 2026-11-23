import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import {
  applicationsApi,
  type CompleteEnrollmentPayload,
  type MagicEnrollmentPublicView,
} from '../services/api';
import { validateEnrollmentStep } from '../utils/scoutValidators';
import Step1Legal from '../components/inscripcion/Step1Legal';
import Step2Medical from '../components/inscripcion/Step2Medical';
import Step3Bank from '../components/inscripcion/Step3Bank';
import Step4Sign from '../components/inscripcion/Step4Sign';
import FormAlert from '../components/shared/forms/FormAlert';
import { SecButton } from '../components/secretaria/secretariaTheme';

export default function InscripcionMagicaPage() {
  const { token } = useParams<{ token: string }>();
  const [applicant, setApplicant] = useState<MagicEnrollmentPublicView | null>(null);
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
    childFirstName: '',
    childLastName1: '',
    childLastName2: '',
    hasNoSecondLastName: false,
    noSecondLastNameJustification: '',
    childBirthDate: '',
    gender: '',
    streetAddress: '',
    streetNumber: '',
    apartmentDoor: '',
    postalCode: '',
    municipality: '',
    province: '',
    parent1FirstName: '',
    parent1LastName: '',
    parent1Phone: '',
    parent1Email: '',
    parent1Relationship: '',
    parent2FirstName: '',
    parent2LastName: '',
    parent2Phone: '',
    parent2Email: '',
    parent2Relationship: '',
    childDni: '',
    childPhone: '',
    childEmail: '',
    legalStatus: 'MENOR',
    circularPreference: 'EMAIL',
    parent1Dni: '',
    parent2Dni: '',
    parentsMaritalStatus: '',
    custodyType: 'SIN_ESPECIFICAR',
    acceptsDataStorage: true,
    acceptsDataTransfer: true,
    authorizesImages: true,
    consentTextVersion: '2026.1',
    bloodType: '',
    chronicDiseases: '',
    allergies: '',
    medHeadache: '',
    medFever: '',
    medStomach: '',
    medThroat: '',
    medicalObservations: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    authorizesEmergency: true,
    accountHolderName: '',
    accountHolderDni: '',
    accountHolderAddress: '',
    accountHolderMunicipality: '',
    accountHolderPostalCode: '',
    iban: '',
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
        setFormData((prev) => ({
          ...prev,
          childFirstName: data.childFirstName || '',
          childLastName1: data.childLastName1 || '',
          childLastName2: data.childLastName2 || '',
          hasNoSecondLastName: Boolean(data.hasNoSecondLastName),
          noSecondLastNameJustification: data.noSecondLastNameJustification || '',
          childBirthDate: data.childBirthDate ? data.childBirthDate.slice(0, 10) : '',
          gender:
            data.gender === 'MASCULINO' || data.gender === 'FEMENINO' ? data.gender : '',
          streetAddress: data.streetAddress || '',
          streetNumber: data.streetNumber || '',
          apartmentDoor: data.apartmentDoor || '',
          postalCode: data.postalCode || '',
          municipality: data.municipality || '',
          province: data.province || '',
          parent1FirstName: data.parent1FirstName || '',
          parent1LastName: data.parent1LastName || '',
          parent1Phone: data.parent1Phone || '',
          parent1Email: data.parent1Email || '',
          parent1Relationship: data.parent1Relationship || '',
          parent2FirstName: data.parent2FirstName || '',
          parent2LastName: data.parent2LastName || '',
          parent2Phone: data.parent2Phone || '',
          parent2Email: data.parent2Email || '',
          parent2Relationship: data.parent2Relationship || '',
        }));
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'Enlace inválido'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => {
      if (name === 'hasNoSecondLastName' && val === true) {
        return { ...prev, hasNoSecondLastName: true, childLastName2: '' };
      }
      return { ...prev, [name]: val };
    });
    setStepError(null);
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

  const handleNext = () => {
    const err = validateEnrollmentStep(step, formData);
    if (err) return setStepError(err);
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
      const payload: CompleteEnrollmentPayload = {
        ...formData,
        childFirstName: formData.childFirstName?.trim() || undefined,
        childLastName1: formData.childLastName1?.trim() || undefined,
        childLastName2: formData.hasNoSecondLastName
          ? undefined
          : formData.childLastName2?.trim() || undefined,
        hasNoSecondLastName: Boolean(formData.hasNoSecondLastName),
        noSecondLastNameJustification: formData.hasNoSecondLastName
          ? formData.noSecondLastNameJustification?.trim() || undefined
          : undefined,
        childBirthDate: formData.childBirthDate || undefined,
        gender: formData.gender as 'MASCULINO' | 'FEMENINO',
        streetAddress: formData.streetAddress.trim(),
        streetNumber: formData.streetNumber?.trim() || undefined,
        apartmentDoor: formData.apartmentDoor?.trim() || undefined,
        postalCode: formData.postalCode.trim(),
        municipality: formData.municipality.trim(),
        province: formData.province.trim(),
        parent1FirstName: formData.parent1FirstName?.trim() || undefined,
        parent1LastName: formData.parent1LastName?.trim() || undefined,
        parent1Phone: formData.parent1Phone?.replace(/\s+/g, '') || undefined,
        parent1Email: formData.parent1Email?.trim() || undefined,
        parent1Relationship: formData.parent1Relationship?.trim() || undefined,
        parent2FirstName: formData.parent2FirstName?.trim() || undefined,
        parent2LastName: formData.parent2LastName?.trim() || undefined,
        parent2Phone: formData.parent2Phone?.replace(/\s+/g, '') || undefined,
        parent2Email: formData.parent2Email?.trim() || undefined,
        parent2Relationship: formData.parent2Relationship?.trim() || undefined,
        parent1Dni: formData.parent1Dni.trim().toUpperCase(),
        parent2Dni: formData.parent2Dni?.trim().toUpperCase() || undefined,
        childDni: formData.childDni?.trim().toUpperCase() || undefined,
        childPhone: formData.childPhone?.replace(/\s+/g, '') || undefined,
        childEmail: formData.childEmail?.trim() || undefined,
        emergencyContactName: formData.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone?.replace(/\s+/g, '') || undefined,
        emergencyContactRelationship: formData.emergencyContactRelationship?.trim() || undefined,
        accountHolderName: formData.accountHolderName.trim(),
        accountHolderDni: formData.accountHolderDni.trim().toUpperCase(),
        accountHolderAddress: formData.accountHolderAddress?.trim() || undefined,
        accountHolderMunicipality: formData.accountHolderMunicipality?.trim() || undefined,
        accountHolderPostalCode: formData.accountHolderPostalCode?.trim() || undefined,
        iban: formData.iban.replace(/\s+/g, '').toUpperCase(),
        signer1FullName: `${formData.parent1FirstName || ''} ${formData.parent1LastName || ''}`.trim(),
        signer1Dni: formData.parent1Dni.trim().toUpperCase(),
        signer2FullName: formData.signatureParent2
          ? `${formData.parent2FirstName || ''} ${formData.parent2LastName || ''}`.trim() || undefined
          : undefined,
        signer2Dni: formData.signatureParent2
          ? formData.parent2Dni?.trim().toUpperCase() || undefined
          : undefined,
        signatureParent2: formData.signatureParent2 || undefined,
      };

      await applicationsApi.submitMagicEnrollment(token, payload);
      setCompleted(true);
    } catch (e: unknown) {
      setStepError(e instanceof Error ? e.message : 'Error al guardar la inscripción.');
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
      <div className="state-card page-width">
        <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">¡Inscripción Completada!</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2">
          La ficha de {formData.childFirstName || applicant.childFirstName} ({applicant.calculatedBranch} · Ronda {applicant.solarRound}) ha quedado registrada y este enlace de un solo uso se ha cerrado de forma segura.
        </p>
      </div>
    );
  }

  return (
    <div className="page-width space-y-5 pt-[35px] pb-[52px] min-[801px]:pt-16 min-[801px]:pb-20">
      <div className="bg-gradient-to-r from-[#000254] to-[#01317b] text-white rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_14px_34px_-10px_rgba(0,2,84,0.22)]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">
            Secretaría · Inscripción Oficial ({applicant.solarRound})
          </p>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
            {formData.childFirstName || applicant.childFirstName}{' '}
            {formData.childLastName1 || applicant.childLastName1}{' '}
            {!formData.hasNoSecondLastName ? formData.childLastName2 || applicant.childLastName2 || '' : ''}
          </h1>
          <p className="text-xs text-blue-100/85 mt-0.5">{applicant.calculatedBranch}</p>
        </div>
        <span className="text-xs font-bold bg-white/15 border border-white/20 px-3.5 py-1.5 rounded-full">
          Paso {step} de 4
        </span>
      </div>

      {stepError && <FormAlert>{stepError}</FormAlert>}

      <div className="space-y-4">
        <nav className="grid grid-cols-2 gap-2 min-[801px]:grid-cols-4" aria-label="Apartados de la inscripción">
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
                className={`flex min-h-12 cursor-pointer items-center gap-[9px] rounded-[14px] border px-3 py-2 text-xs font-bold transition-all duration-200 active:translate-y-0 active:scale-[0.985] focus-visible:outline-3 focus-visible:outline-[#01317b]/[0.18] focus-visible:outline-offset-2 min-[801px]:min-h-[52px] ${
                  isCurrent
                    ? 'border-[#01317b] bg-[#eef4fc] text-[#000254] shadow-[0_7px_18px_rgba(1,49,123,0.08)]'
                    : isComplete
                      ? 'border-[#b9dfcb] bg-[#f3faf6] text-[#28704a] hover:-translate-y-px'
                      : 'border-[#e4e9f1] bg-[#f8fafc] text-[#69778d] hover:-translate-y-px hover:border-[#bdc9dc] hover:bg-[#f8fafc]'
                }`}
              >
                <span
                  className={`grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] ${
                    isCurrent
                      ? 'bg-[#01317b] text-white'
                      : isComplete
                        ? 'bg-[#dff2e7] text-[#28704a]'
                        : 'bg-[#edf1f6] text-[#718096]'
                  }`}
                >
                  {isComplete ? <CheckCircle2 size={16} /> : item.number}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {step === 1 && (
            <Step1Legal
              applicant={applicant}
              formData={formData}
              onChange={handleChange}
              showIdentityRevision
            />
          )}
          {step === 2 && (
            <Step2Medical
              formData={formData}
              onChange={handleChange}
              onFillEmergencyFromTutor1={handleFillEmergencyFromTutor1}
            />
          )}
          {step === 3 && (
            <Step3Bank
              formData={formData}
              onChange={handleChange}
              onFillHolderFromTutor1={handleFillHolderFromTutor1}
            />
          )}
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
