import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { applicationsApi, type CreateApplicationPayload } from '../services/api';
import { validateSolicitudForm, type SolicitudFieldErrors } from '../utils/scoutValidators';
import EducandoSection from '../components/solicitud/EducandoSection';
import FamilySection from '../components/solicitud/FamilySection';
import SolicitudSuccess from '../components/solicitud/SolicitudSuccess';

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
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block bg-white/20 text-xs font-semibold px-3 py-1 rounded-full mb-2">
            Fase 1 · Lista de Espera
          </span>
          <h1 className="text-2xl md:text-3xl font-bold">Solicitud de Entrada al Grupo IV</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">Grupo Scout San José de Calasanz · Montequinto</p>
        </div>
        <button
          type="button"
          onClick={handleClearDraft}
          className="self-start md:self-auto flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
        >
          <Trash2 size={14} /> Empezar de cero
        </button>
      </div>

      {(serverError || Object.keys(fieldErrors).length > 0) && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Por favor, revisa los campos marcados en rojo:</p>
            {serverError && <p className="mt-1">{serverError}</p>}
          </div>
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

        {/* Bloque Criterios y Motivación */}
        <section className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">4. Criterios de Prioridad y Motivación</h2>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="hasFamilyInGroup"
                checked={formData.hasFamilyInGroup}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded text-indigo-600"
              />
              <div>
                <span className="block text-xs sm:text-sm font-semibold text-slate-800">
                  ¿Tiene algún familiar directo en el Grupo IV actualmente?
                </span>
                <span className="text-xs text-slate-500">Hermano/a educando, scouter o viejo lobo.</span>
              </div>
            </label>
            {formData.hasFamilyInGroup && (
              <div className="mt-3 pl-7">
                <input
                  type="text"
                  name="familyMemberDetails"
                  value={formData.familyMemberDetails}
                  onChange={handleChange}
                  placeholder="Nombre completo y parentesco"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="comesFromOtherGroup"
                checked={formData.comesFromOtherGroup}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded text-indigo-600"
              />
              <div>
                <span className="block text-xs sm:text-sm font-semibold text-slate-800">
                  ¿Proviene de otro Grupo Scout?
                </span>
              </div>
            </label>
            {formData.comesFromOtherGroup && (
              <div className="mt-3 pl-7">
                <input
                  type="text"
                  name="originGroupDetails"
                  value={formData.originGroupDetails}
                  onChange={handleChange}
                  placeholder="Nombre del grupo scout y localidad"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Motivación y Observaciones</label>
            <textarea
              name="motivation"
              rows={3}
              value={formData.motivation}
              onChange={handleChange}
              placeholder="Cuéntanos por qué os gustaría formar parte del Grupo IV..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600"
            />
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-2xs border border-slate-200">
          <p className="text-xs text-slate-500">Tus respuestas se guardan automáticamente mientras escribes.</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold px-8 py-3.5 rounded-xl shadow-sm transition"
          >
            {isSubmitting ? 'Validando y enviando...' : 'Enviar Solicitud de Entrada'}
          </button>
        </div>
      </form>
    </div>
  );
}