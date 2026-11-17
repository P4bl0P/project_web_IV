import { useMemo, useState, type ChangeEvent } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, X } from 'lucide-react';
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

interface Props {
  record?: ApplicantRecord | null;
  onClose: () => void;
  onSaved: (record: ApplicantRecord) => void;
}

const emptyForm: DirectCensusPayload = {
  childFirstName: '',
  childLastName: '',
  childBirthDate: '',
  gender: 'MASCULINO',
  streetAddress: '',
  streetNumber: '',
  ApartmentDoor: '',
  postalCode: '41089',
  municipality: 'Dos Hermanas',
  province: 'Sevilla',
  parent1FirstName: '',
  parent1LastName: '',
  parent1Phone: '',
  parent1Email: '',
  parent2FirstName: '',
  parent2LastName: '',
  parent2Phone: '',
  parent2Email: '',
  motivation: '',
  hasFamilyInGroup: false,
  familyMemberDetails: '',
  comesFromOtherGroup: false,
  originGroupDetails: '',
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
};

function formFromRecord(record?: ApplicantRecord | null): DirectCensusPayload {
  if (!record) return { ...emptyForm };
  return {
    ...emptyForm,
    ...record,
    ...record.enrollment,
    childBirthDate: record.childBirthDate.slice(0, 10),
    streetNumber: record.streetNumber || '',
    ApartmentDoor: record.ApartmentDoor || '',
    parent2FirstName: record.parent2FirstName || '',
    parent2LastName: record.parent2LastName || '',
    parent2Phone: record.parent2Phone || '',
    parent2Email: record.parent2Email || '',
    motivation: record.motivation || '',
    familyMemberDetails: record.familyMemberDetails || '',
    originGroupDetails: record.originGroupDetails || '',
    signatureParent2: record.enrollment?.signatureParent2 || '',
  };
}

export default function SecretariaCensoForm({ record, onClose, onSaved }: Props) {
  const isEditing = Boolean(record);
  const [formData, setFormData] = useState<DirectCensusPayload>(() => formFromRecord(record));
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showSecondParent = useMemo(
    () => Boolean(formData.parent2FirstName || formData.parent2Phone || formData.parent2Email),
    [formData.parent2Email, formData.parent2FirstName, formData.parent2Phone],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    const nextValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;
    setFormData((previous) => ({ ...previous, [name]: nextValue }));
    setError(null);
  };

  const validateStep = () => {
    if (step === 1) {
      const solicitudErrors = validateSolicitudForm(formData, showSecondParent);
      if (solicitudErrors.childFirstName || solicitudErrors.childLastName || solicitudErrors.childBirthDate) {
        return 'Completa correctamente los datos básicos del educando.';
      }
      if (solicitudErrors.parent1FirstName || solicitudErrors.parent1LastName || solicitudErrors.parent1Phone || solicitudErrors.parent1Email) {
        return 'Completa correctamente los datos del tutor principal.';
      }
    }
    return validateEnrollmentStep(step, formData);
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) return setError(validationError);
    setStep((current) => current + 1);
  };

  const handleSubmit = async () => {
    for (const currentStep of [1, 2, 3, 4]) {
      const stepError = validateEnrollmentStep(currentStep, formData);
      if (stepError) {
        setStep(currentStep);
        setError(stepError);
        return;
      }
    }
    const solicitudErrors = validateSolicitudForm(formData, showSecondParent);
    if (Object.keys(solicitudErrors).length > 0) {
      setStep(1);
      setError('Revisa los datos personales, de contacto y dirección.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        parent1Phone: formData.parent1Phone.replace(/\s+/g, ''),
        parent2Phone: formData.parent2Phone?.replace(/\s+/g, '') || undefined,
        parent2Email: formData.parent2Email?.trim() || undefined,
        childEmail: formData.childEmail?.trim() || undefined,
        childDni: formData.childDni?.trim().toUpperCase() || undefined,
        parent1Dni: formData.parent1Dni.trim().toUpperCase(),
        parent2Dni: formData.parent2Dni?.trim().toUpperCase() || undefined,
        accountHolderDni: formData.accountHolderDni.trim().toUpperCase(),
        iban: formData.iban.replace(/\s+/g, '').toUpperCase(),
        signatureParent2: formData.signatureParent2 || undefined,
      };
      const saved = isEditing
        ? await applicationsApi.updateCensus(record!.id, payload)
        : await applicationsApi.createDirectCensus(payload);
      onSaved(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el censo.');
    } finally {
      setSaving(false);
    }
  };

  const applicantForSteps = { parent1FirstName: formData.parent1FirstName };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-5xl rounded-2xl bg-slate-50 shadow-xl">
        <div className="flex items-center justify-between rounded-t-2xl bg-indigo-900 px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-bold">{isEditing ? 'Editar inscripción censada' : 'Alta directa en el censo'}</h2>
            <p className="text-xs text-indigo-200">Paso {step} de 4 · mismos datos que la inscripción oficial</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <>
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-bold text-slate-900">Datos del educando y tutores</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <label className="text-xs font-semibold text-slate-700">Nombre del educando
                    <input name="childFirstName" value={formData.childFirstName} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 md:col-span-2">Apellidos
                    <input name="childLastName" value={formData.childLastName} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Nacimiento
                    <input type="date" name="childBirthDate" value={formData.childBirthDate} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Género
                    <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Nombre Tutor 1
                    <input name="parent1FirstName" value={formData.parent1FirstName} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 md:col-span-2">Apellidos Tutor 1
                    <input name="parent1LastName" value={formData.parent1LastName} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Nombre Tutor 2
                    <input name="parent2FirstName" value={formData.parent2FirstName} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 md:col-span-2">Apellidos Tutor 2
                    <input name="parent2LastName" value={formData.parent2LastName} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                </div>
              </section>
              <Step1Legal applicant={applicantForSteps} formData={formData} onChange={handleChange} />
              <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">Familiar en el grupo
                  <input type="checkbox" name="hasFamilyInGroup" checked={formData.hasFamilyInGroup} onChange={handleChange} className="ml-2 h-4 w-4 rounded text-indigo-600" />
                  {formData.hasFamilyInGroup && <input name="familyMemberDetails" value={formData.familyMemberDetails} onChange={handleChange} placeholder="Nombre y parentesco" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />}
                </label>
                <label className="text-xs font-semibold text-slate-700">Procede de otro grupo
                  <input type="checkbox" name="comesFromOtherGroup" checked={formData.comesFromOtherGroup} onChange={handleChange} className="ml-2 h-4 w-4 rounded text-indigo-600" />
                  {formData.comesFromOtherGroup && <input name="originGroupDetails" value={formData.originGroupDetails} onChange={handleChange} placeholder="Grupo de procedencia" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />}
                </label>
                <label className="text-xs font-semibold text-slate-700 md:col-span-2">Motivación y observaciones
                  <textarea name="motivation" value={formData.motivation} onChange={handleChange} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                </label>
              </section>
            </>
          )}
          {step === 2 && <Step2Medical formData={formData} onChange={handleChange} />}
          {step === 3 && <Step3Bank formData={formData} onChange={handleChange} />}
          {step === 4 && (
            <Step4Sign
              applicant={applicantForSteps}
              formData={formData}
              onChange={handleChange}
              onSign1={(signatureParent1) => setFormData((previous) => ({ ...previous, signatureParent1 }))}
              onSign2={(signatureParent2) => setFormData((previous) => ({ ...previous, signatureParent2 }))}
            />
          )}

          <div className="flex justify-between border-t border-slate-200 pt-4">
            {step > 1 ? (
              <button type="button" onClick={() => setStep((current) => current - 1)} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-600">
                <ChevronLeft size={15} /> Anterior
              </button>
            ) : <div />}
            {step < 4 ? (
              <button type="button" onClick={handleNext} className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white">
                Siguiente <ChevronRight size={15} />
              </button>
            ) : (
              <button type="button" disabled={saving} onClick={handleSubmit} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white disabled:opacity-60">
                {isEditing ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
                {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear y censar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
