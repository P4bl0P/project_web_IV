import { useState, useEffect, type FormEvent } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Users,
  Compass,
  Trash2,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { applicationsApi, type CreateApplicationPayload } from '../services/api';

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

type FieldErrors = Partial<Record<keyof CreateApplicationPayload, string>>;

function calculatePreviewBranch(birthDateStr: string): { branch: string; age: number } | null {
  if (!birthDateStr) return null;
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const solarRoundStartYear = currentMonth >= 9 ? currentYear : currentYear - 1;
  const age = solarRoundStartYear - birthDate.getFullYear();

  if (age < 6) return { branch: 'Pre-Castor (Aún menor de 6 años)', age };
  if (age >= 6 && age <= 7) return { branch: 'Castores (Colonia)', age };
  if (age >= 8 && age <= 10) return { branch: 'Lobatos (Manada)', age };
  if (age >= 11 && age <= 13) return { branch: 'Rangers (Tropa)', age };
  if (age >= 14 && age <= 16) return { branch: 'Pioneros (Escultas)', age };
  if (age >= 17 && age <= 19) return { branch: 'Rutas (Clan)', age };
  return { branch: 'Fuera de rango de edad de educandos (> 19 años)', age };
}

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

  const [showSecondParent, setShowSecondParent] = useState<boolean>(() => {
    return Boolean(formData.parent2FirstName || formData.parent2Phone);
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedChildren, setSubmittedChildren] = useState<
    Array<{ name: string; branch: string }>
  >([]);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const branchPreview = calculatePreviewBranch(formData.childBirthDate);

  // Motor de validación propio en el Frontend
  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6789]\d{8}$/;
    const postalCodeRegex = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;

    // 1. Educando
    if (formData.childFirstName.trim().length < 2) {
      errors.childFirstName = 'Introduce el nombre del menor (mínimo 2 letras).';
    }
    if (formData.childLastName.trim().length < 2) {
      errors.childLastName = 'Introduce los apellidos del menor.';
    }
    if (!formData.childBirthDate) {
      errors.childBirthDate = 'Selecciona la fecha de nacimiento.';
    } else {
      const birth = new Date(formData.childBirthDate);
      const now = new Date();
      if (birth > now) {
        errors.childBirthDate = 'La fecha de nacimiento no puede estar en el futuro.';
      } else if (now.getFullYear() - birth.getFullYear() > 22) {
        errors.childBirthDate = 'Revisa el año de nacimiento (supera la edad máxima de educandos).';
      }
    }

    // 2. Dirección
    if (formData.streetAddress.trim().length < 3) {
      errors.streetAddress = 'Introduce el nombre de la calle, avenida o plaza.';
    }
    if (!postalCodeRegex.test(formData.postalCode.trim())) {
      errors.postalCode = 'Introduce un código postal válido de 5 dígitos (ej. 41089).';
    }
    if (formData.municipality?.trim().length === 0) {
      errors.municipality = 'El municipio es obligatorio.';
    }
    if (formData.province?.trim().length === 0) {
      errors.province = 'La provincia es obligatoria.';
    }

    // 3. Tutor Principal
    if (formData.parent1FirstName.trim().length < 2) {
      errors.parent1FirstName = 'Introduce el nombre del padre, madre o tutor.';
    }
    if (formData.parent1LastName.trim().length < 2) {
      errors.parent1LastName = 'Introduce los apellidos del tutor.';
    }
    const cleanPhone1 = formData.parent1Phone.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone1)) {
      errors.parent1Phone = 'Introduce un teléfono español válido de 9 dígitos (sin +34).';
    }
    if (!emailRegex.test(formData.parent1Email.trim())) {
      errors.parent1Email = 'Introduce un correo electrónico válido (ej. nombre@correo.com).';
    }

    // 4. Segundo Tutor (si está desplegado y rellenado)
    if (showSecondParent) {
      const cleanPhone2 = (formData.parent2Phone || '').replace(/\s+/g, '');
      if (cleanPhone2 && !phoneRegex.test(cleanPhone2)) {
        errors.parent2Phone = 'El teléfono del segundo tutor debe tener 9 dígitos.';
      }
      if (formData.parent2Email?.trim() && !emailRegex.test(formData.parent2Email.trim())) {
        errors.parent2Email = 'El correo del segundo tutor no tiene un formato válido.';
      }
    }

    // 5. Criterios condicionales
    if (formData.hasFamilyInGroup && !formData.familyMemberDetails?.trim()) {
      errors.familyMemberDetails = 'Indica el nombre de su hermano/a o familiar en el grupo.';
    }
    if (formData.comesFromOtherGroup && !formData.originGroupDetails?.trim()) {
      errors.originGroupDetails = 'Indica de qué grupo scout proviene.';
    }

    return errors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof CreateApplicationPayload;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [fieldName]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
    }

    // Limpiar el error de ese campo en cuanto el padre empieza a corregirlo
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

  // Función mágica para apuntar a un hermano conservando todos los datos de padres y domicilio
  const handleAddSibling = () => {
    const lastChild = submittedChildren[submittedChildren.length - 1];
    const siblingNote = lastChild
      ? `Hermano/a de ${lastChild.name} (solicitud enviada hoy)`
      : formData.familyMemberDetails;

    setFormData((prev) => ({
      ...prev,
      childFirstName: '',
      childLastName: prev.childLastName, // Mantenemos los apellidos del hermano por comodidad
      childBirthDate: '',
      familyMemberDetails: prev.familyMemberDetails || siblingNote,
    }));
    setFieldErrors({});
    setServerError(null);
    setShowSuccessScreen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateForm();
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
        parent2FirstName:
          showSecondParent && formData.parent2FirstName?.trim()
            ? formData.parent2FirstName.trim()
            : undefined,
        parent2LastName:
          showSecondParent && formData.parent2LastName?.trim()
            ? formData.parent2LastName.trim()
            : undefined,
        parent2Phone:
          showSecondParent && formData.parent2Phone?.trim()
            ? formData.parent2Phone.replace(/\s+/g, '')
            : undefined,
        parent2Email:
          showSecondParent && formData.parent2Email?.trim()
            ? formData.parent2Email.trim()
            : undefined,
        motivation: formData.motivation?.trim() || undefined,
        familyMemberDetails: formData.hasFamilyInGroup
          ? formData.familyMemberDetails?.trim()
          : undefined,
        originGroupDetails: formData.comesFromOtherGroup
          ? formData.originGroupDetails?.trim()
          : undefined,
      };

      const result = await applicationsApi.submitApplication(payload);
      localStorage.removeItem(STORAGE_KEY);

      setSubmittedChildren((prev) => [
        ...prev,
        {
          name: `${result.childFirstName} ${result.childLastName}`,
          branch: result.calculatedBranch,
        },
      ]);
      setShowSuccessScreen(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Si NestJS devuelve un array de mensajes de class-validator, lo mostramos claro
        setServerError(err.message);
      } else {
        setServerError('Ocurrió un error inesperado al enviar la solicitud.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof CreateApplicationPayload) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none ${
      fieldErrors[field]
        ? 'border-red-500 bg-red-50/40 focus:border-red-600'
        : 'border-gray-300 bg-white focus:border-indigo-600'
    }`;

  if (showSuccessScreen) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-green-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Solicitud registrada con éxito!
          </h2>

          <div className="my-4 space-y-2">
            {submittedChildren.map((child, idx) => (
              <div
                key={idx}
                className="bg-indigo-50/70 border border-indigo-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 flex items-center justify-between"
              >
                <span className="font-semibold">{child.name}</span>
                <span className="text-xs font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-full">
                  {child.branch}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 text-blue-900 text-sm rounded-xl p-4 text-left mb-6 space-y-2">
            <p className="font-semibold">¿Qué ocurre a partir de ahora?</p>
            <p>
              1. El Kraal revisará la solicitud y quedará en la lista de espera oficial del Grupo IV.
            </p>
            <p>
              2. Cuando haya plaza en su rama, recibiréis un <strong>enlace directo por WhatsApp</strong> para completar la ficha médica sin tener que repetir estos datos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleAddSibling}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 shadow-md transition"
            >
              <UserPlus size={18} />
              Inscribir a otro hermano/a (conservando mis datos)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Cabecera */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-2xl p-6 md:p-8 text-white shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-white/20 text-xs font-semibold px-3 py-1 rounded-full mb-2">
              Fase 1 · Lista de Espera
            </span>
            <h1 className="text-2xl md:text-3xl font-bold">
              Solicitud de Entrada al Grupo IV
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Grupo Scout San José de Calasanz · Montequinto (Dos Hermanas)
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="self-start md:self-auto flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
          >
            <Trash2 size={14} />
            Empezar de cero
          </button>
        </div>
      </div>

      {/* Aviso si ya ha inscrito a un hermano en esta sesión */}
      {submittedChildren.length > 0 && (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>
            Hemos mantenido tus datos familiares y de domicilio. <strong>Solo tienes que escribir el nombre y fecha de nacimiento del siguiente hermano/a.</strong>
          </span>
        </div>
      )}

      {/* Errores generales o de validación */}
      {(serverError || Object.keys(fieldErrors).length > 0) && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Por favor, revisa los campos marcados en rojo:</p>
            {serverError && <p className="mt-1">{serverError}</p>}
          </div>
        </div>
      )}

      {/* noValidate desactiva los carteles nativos de HTML5 para usar nuestra validación propia */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* BLOQUE 1: Datos del Educando */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Compass className="text-indigo-600" size={20} />
            1. Datos del Niño, Niña o Joven
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="childFirstName"
                value={formData.childFirstName}
                onChange={handleChange}
                placeholder="Ej. Lucas"
                className={inputClass('childFirstName')}
              />
              {fieldErrors.childFirstName && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.childFirstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                name="childLastName"
                value={formData.childLastName}
                onChange={handleChange}
                placeholder="Ej. García Pérez"
                className={inputClass('childLastName')}
              />
              {fieldErrors.childLastName && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.childLastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de nacimiento *
              </label>
              <input
                type="date"
                name="childBirthDate"
                value={formData.childBirthDate}
                onChange={handleChange}
                className={inputClass('childBirthDate')}
              />
              {fieldErrors.childBirthDate && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.childBirthDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo * <span className="text-xs text-gray-400 font-normal">(Ratio de rama)</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={inputClass('gender')}
              >
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          {branchPreview && !fieldErrors.childBirthDate && (
            <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 flex items-center gap-3 text-indigo-900">
              <Sparkles size={18} className="text-indigo-600 shrink-0" />
              <p className="text-sm">
                Por su año de nacimiento ({branchPreview.age} años en esta ronda solar), solicita
                plaza para: <strong>{branchPreview.branch}</strong>
              </p>
            </div>
          )}
        </section>

        {/* BLOQUE 2: Dirección Postal */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            2. Domicilio Familiar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calle / Avenida / Plaza *
              </label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="Avda. Madre Paula Montalt"
                className={inputClass('streetAddress')}
              />
              {fieldErrors.streetAddress && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.streetAddress}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número
              </label>
              <input
                type="text"
                name="streetNumber"
                value={formData.streetNumber}
                onChange={handleChange}
                placeholder="Ej. 12"
                className={inputClass('streetNumber')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Piso / Puerta
              </label>
              <input
                type="text"
                name="ApartmentDoor"
                value={formData.ApartmentDoor}
                onChange={handleChange}
                placeholder="Ej. 3º B"
                className={inputClass('ApartmentDoor')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Postal *
              </label>
              <input
                type="text"
                name="postalCode"
                maxLength={5}
                value={formData.postalCode}
                onChange={handleChange}
                className={inputClass('postalCode')}
              />
              {fieldErrors.postalCode && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.postalCode}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Municipio *
              </label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
                className={inputClass('municipality')}
              />
              {fieldErrors.municipality && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.municipality}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provincia *
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                className={inputClass('province')}
              />
              {fieldErrors.province && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.province}</p>
              )}
            </div>
          </div>
        </section>

        {/* BLOQUE 3: Padres / Tutores Legales */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            3. Datos de los Padres o Tutores
          </h2>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-3">
              Padre / Madre / Tutor Principal *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="parent1FirstName"
                  value={formData.parent1FirstName}
                  onChange={handleChange}
                  className={inputClass('parent1FirstName')}
                />
                {fieldErrors.parent1FirstName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.parent1FirstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  name="parent1LastName"
                  value={formData.parent1LastName}
                  onChange={handleChange}
                  className={inputClass('parent1LastName')}
                />
                {fieldErrors.parent1LastName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.parent1LastName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono móvil (WhatsApp) *
                </label>
                <input
                  type="tel"
                  name="parent1Phone"
                  value={formData.parent1Phone}
                  onChange={handleChange}
                  placeholder="600112233"
                  className={inputClass('parent1Phone')}
                />
                {fieldErrors.parent1Phone && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.parent1Phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  name="parent1Email"
                  value={formData.parent1Email}
                  onChange={handleChange}
                  placeholder="familia@ejemplo.com"
                  className={inputClass('parent1Email')}
                />
                {fieldErrors.parent1Email && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.parent1Email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-indigo-700">
              <input
                type="checkbox"
                checked={showSecondParent}
                onChange={(e) => setShowSecondParent(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              Añadir datos del segundo progenitor / tutor (Opcional)
            </label>

            {showSecondParent && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre (Progenitor 2)
                  </label>
                  <input
                    type="text"
                    name="parent2FirstName"
                    value={formData.parent2FirstName}
                    onChange={handleChange}
                    className={inputClass('parent2FirstName')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos (Progenitor 2)
                  </label>
                  <input
                    type="text"
                    name="parent2LastName"
                    value={formData.parent2LastName}
                    onChange={handleChange}
                    className={inputClass('parent2LastName')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono móvil
                  </label>
                  <input
                    type="tel"
                    name="parent2Phone"
                    value={formData.parent2Phone}
                    onChange={handleChange}
                    className={inputClass('parent2Phone')}
                  />
                  {fieldErrors.parent2Phone && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.parent2Phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="parent2Email"
                    value={formData.parent2Email}
                    onChange={handleChange}
                    className={inputClass('parent2Email')}
                  />
                  {fieldErrors.parent2Email && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.parent2Email}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* BLOQUE 4: Criterios de Admisión y Motivación */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">
            4. Criterios de Prioridad y Motivación
          </h2>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="hasFamilyInGroup"
                checked={formData.hasFamilyInGroup}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded text-indigo-600"
              />
              <div>
                <span className="block text-sm font-semibold text-gray-800">
                  ¿Tiene algún familiar directo en el Grupo IV actualmente?
                </span>
                <span className="text-xs text-gray-500">
                  Hermano/a educando, responsable (Scouter) o Viejo Lobo del grupo.
                </span>
              </div>
            </label>

            {formData.hasFamilyInGroup && (
              <div className="mt-3 pl-7">
                <input
                  type="text"
                  name="familyMemberDetails"
                  value={formData.familyMemberDetails}
                  onChange={handleChange}
                  placeholder="Indica el nombre completo del familiar y su parentesco"
                  className={inputClass('familyMemberDetails')}
                />
                {fieldErrors.familyMemberDetails && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.familyMemberDetails}</p>
                )}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="comesFromOtherGroup"
                checked={formData.comesFromOtherGroup}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded text-indigo-600"
              />
              <div>
                <span className="block text-sm font-semibold text-gray-800">
                  ¿Proviene de otro Grupo Scout?
                </span>
                <span className="text-xs text-gray-500">
                  Para jóvenes que desean continuar su camino en el escultismo.
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
                  placeholder="Indica el nombre del Grupo Scout y localidad de procedencia"
                  className={inputClass('originGroupDetails')}
                />
                {fieldErrors.originGroupDetails && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.originGroupDetails}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivación para la entrada en el grupo (y observaciones que debamos conocer)
            </label>
            <textarea
              name="motivation"
              rows={3}
              value={formData.motivation}
              onChange={handleChange}
              placeholder="Cuéntanos por qué os gustaría formar parte del Grupo IV..."
              className={inputClass('motivation')}
            />
          </div>
        </section>

        {/* Botón de envío */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">
            Tus respuestas se guardan automáticamente en este dispositivo mientras escribes.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold px-8 py-3.5 rounded-xl shadow-md transition"
          >
            {isSubmitting ? 'Validando y enviando...' : 'Enviar Solicitud de Entrada'}
          </button>
        </div>
      </form>
    </div>
  );
}