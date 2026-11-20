import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { applicationsApi, type CreateApplicationPayload } from '../services/api';
import { validateSolicitudForm, type SolicitudFieldErrors } from '../utils/scoutValidators';
import CriteriosSection from '../components/solicitud/CriteriosSection';
import EducandoSection from '../components/solicitud/EducandoSection';
import FamilySection from '../components/solicitud/FamilySection';
import SolicitudSuccess from '../components/solicitud/SolicitudSuccess';
import FormAlert from '../components/shared/forms/FormAlert';

const STORAGE_KEY = 'grupo_iv_solicitud_draft';

const initialFormState: CreateApplicationPayload = {
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
};

export default function SolicitudPage() {
  const [formData, setFormData] = useState<CreateApplicationPayload>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...initialFormState, ...JSON.parse(saved) };
      } catch {
        return initialFormState;
      }
    }
    return initialFormState;
  });

  const [showSecondParent, setShowSecondParent] = useState<boolean>(
    Boolean(formData.parent2FirstName || formData.parent2Phone),
  );
  const [fieldErrors, setFieldErrors] = useState<SolicitudFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedChildren, setSubmittedChildren] = useState<Array<{ name: string; branch: string }>>([]);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof CreateApplicationPayload;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({ ...prev, [fieldName]: val }));
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(initialFormState);
    setShowSecondParent(false);
    setFieldErrors({});
    setServerError(null);
  };

  const handleAddSibling = () => {
    const lastChild = submittedChildren[submittedChildren.length - 1];
    setFormData((prev) => ({
      ...prev,
      childFirstName: '',
      childLastName: prev.childLastName,
      childBirthDate: '',
      familyMemberDetails: prev.familyMemberDetails || (lastChild ? `Hermano/a de ${lastChild.name}` : ''),
    }));
    setFieldErrors({});
    setServerError(null);
    setShowSuccessScreen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateSolicitudForm(formData, showSecondParent);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateApplicationPayload = {
        ...formData,
        parent1Phone: formData.parent1Phone.replace(/\s+/g, ''),
        streetNumber: formData.streetNumber?.trim() || undefined,
        ApartmentDoor: formData.ApartmentDoor?.trim() || undefined,
        parent2Phone: showSecondParent && formData.parent2Phone?.trim() ? formData.parent2Phone.replace(/\s+/g, '') : undefined,
        parent2Email: showSecondParent && formData.parent2Email?.trim() ? formData.parent2Email.trim() : undefined,
        motivation: formData.motivation?.trim() || undefined,
        familyMemberDetails: formData.hasFamilyInGroup ? formData.familyMemberDetails?.trim() : undefined,
        originGroupDetails: formData.comesFromOtherGroup ? formData.originGroupDetails?.trim() : undefined,
      };

      const result = await applicationsApi.submitApplication(payload);
      localStorage.removeItem(STORAGE_KEY);

      setSubmittedChildren((prev) => [
        ...prev,
        { name: `${result.childFirstName} ${result.childLastName}`, branch: result.calculatedBranch },
      ]);
      setShowSuccessScreen(true);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Error inesperado al enviar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccessScreen) {
    return <SolicitudSuccess submittedChildren={submittedChildren} onAddSibling={handleAddSibling} />;
  }

  return (
    <div className="page-width pt-[35px] pb-[52px] min-[801px]:pt-16 min-[801px]:pb-20">
      <div className="mb-[27px] flex flex-col items-start justify-between gap-5 rounded-[25px] bg-[linear-gradient(120deg,#000254,#01317b)] px-[23px] py-[27px] text-white shadow-[0_18px_40px_rgba(0,5,84,0.15)] min-[801px]:flex-row min-[801px]:items-center min-[801px]:px-[38px] min-[801px]:py-[34px]">
        <div>
          <span className="mb-2 inline-block rounded-full bg-white/[0.14] px-3 py-1 text-xs font-semibold">
            Fase 1 · Lista de espera
          </span>
          <h1 className="mt-[11px] mb-[5px] text-[clamp(25px,4vw,38px)] font-bold tracking-[-0.04em]">
            Solicitud de Entrada al Grupo IV
          </h1>
          <p className="m-0 text-xs text-[#bfd0ec] sm:text-sm">
            Grupo Scout San José de Calasanz · Montequinto
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearDraft}
          className="flex cursor-pointer items-center gap-1.5 self-start rounded-lg bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20 md:self-auto"
        >
          <Trash2 size={14} /> Empezar de cero
        </button>
      </div>

      {(serverError || Object.keys(fieldErrors).length > 0) && (
        <div className="mb-6">
          <FormAlert>
            <p className="font-semibold">Por favor, revisa los campos marcados en rojo.</p>
            {serverError && <p className="mt-1">{serverError}</p>}
          </FormAlert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <EducandoSection formData={formData} fieldErrors={fieldErrors} onChange={handleChange} />

        <FamilySection
          formData={formData}
          fieldErrors={fieldErrors}
          showSecondParent={showSecondParent}
          onToggleSecondParent={setShowSecondParent}
          onChange={handleChange}
        />

        <CriteriosSection
          formData={formData}
          fieldErrors={fieldErrors}
          onChange={handleChange}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-[20px] shadow-[0_5px_18px_rgba(0,5,84,0.035)] border border-[#e4e9f1]">
          <p className="text-xs text-slate-500">Tus respuestas se guardan automáticamente mientras escribes.</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto cursor-pointer bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold px-8 py-3.5 rounded-xl shadow-sm transition"
          >
            {isSubmitting ? 'Validando y enviando...' : 'Enviar Solicitud de Entrada'}
          </button>
        </div>
      </form>
    </div>
  );
}
