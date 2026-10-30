import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  HeartPulse,
  Landmark,
  PenTool,
  ChevronRight,
  ChevronLeft,
  Eraser,
  ShieldCheck,
} from 'lucide-react';
import {
  applicationsApi,
  type ApplicantRecord,
  type CompleteEnrollmentPayload,
} from '../services/api';

// Componente ligero de Firma Táctil / Ratón sin dependencias externas
function SignatureBox({
  label,
  onChange,
}: {
  label: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e1b4b';

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">{label}</label>
        <button
          type="button"
          onClick={clearSignature}
          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-2.5 py-1 rounded-lg transition"
        >
          <Eraser size={13} />
          Borrar firma
        </button>
      </div>
      <div className="border-2 border-dashed border-indigo-300 rounded-2xl bg-white overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
          className="w-full h-40 cursor-crosshair touch-none"
        />
      </div>
      <p className="text-xs text-gray-500">
        Firma dentro del recuadro usando el dedo (en móvil/tablet) o el ratón.
      </p>
    </div>
  );
}

const DNI_REGEX = /^[XYZxyz]?\d{7,8}[A-Za-z]$/;
const IBAN_REGEX = /^ES\d{22}$/i;

export default function InscripcionMagicaPage() {
  const { token } = useParams<{ token: string }>();
  const [applicant, setApplicant] = useState<ApplicantRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [formData, setFormData] = useState<CompleteEnrollmentPayload>({
    streetAddress: '',
    streetNumber: '',
    ApartmentDoor: '',
    postalCode: '',
    municipality: '',
    province: '',
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
        if (data.status === 'INSCRIPCION_COMPLETADA' || data.status === 'CENSADO') {
          setCompleted(true);
        }
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
          parent2Phone: data.parent2Phone || '',
          parent2Email: data.parent2Email || '',
          accountHolderName: `${data.parent1FirstName} ${data.parent1LastName}`,
        }));
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Enlace inválido');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setStepError(null);
  };

  const validateCurrentStep = (): string | null => {
    if (step === 1) {
      if (!formData.streetAddress?.trim() || !formData.postalCode?.trim()) {
        return 'Por favor, confirma la dirección y el código postal.';
      }
      if (!DNI_REGEX.test(formData.parent1Dni.trim())) {
        return 'Introduce un DNI/NIE válido para el Tutor 1 (ej. 12345678A).';
      }
      if (
        formData.custodyType === 'CUSTODIA_CONJUNTA' &&
        !DNI_REGEX.test((formData.parent2Dni || '').trim())
      ) {
        return 'En caso de custodia conjunta, el DNI del segundo progenitor es obligatorio.';
      }
      if (formData.childDni?.trim() && !DNI_REGEX.test(formData.childDni.trim())) {
        return 'El formato del DNI del menor no es válido.';
      }
    }

    if (step === 2) {
      if (!formData.authorizesEmergency) {
        return 'Es necesario marcar la autorización médica de urgencia para participar en las actividades.';
      }
    }

    if (step === 3) {
      if (!formData.accountHolderName.trim()) {
        return 'Indica el nombre completo del titular de la cuenta bancaria.';
      }
      if (!DNI_REGEX.test(formData.accountHolderDni.trim())) {
        return 'Introduce un DNI/NIE válido para el titular de la cuenta.';
      }
      const cleanIban = formData.iban.replace(/\s+/g, '').toUpperCase();
      if (!IBAN_REGEX.test(cleanIban)) {
        return 'El IBAN debe comenzar por ES seguido de 22 dígitos numéricos (24 caracteres en total).';
      }
      if (!formData.authorizesSepa) {
        return 'Debes aceptar la orden de domiciliación bancaria SEPA.';
      }
    }

    if (step === 4) {
      if (!formData.acceptsDataStorage || !formData.acceptsDataTransfer) {
        return 'Debes aceptar el tratamiento y cesión de datos legales al Movimiento Scout Católico.';
      }
      if (!formData.signatureParent1) {
        return 'Falta la firma en el recuadro del Tutor Principal.';
      }
      if (formData.custodyType === 'CUSTODIA_CONJUNTA' && !formData.signatureParent2) {
        return 'Al haber indicado Custodia Conjunta, es obligatoria la segunda firma.';
      }
    }

    return null;
  };

  const handleNextStep = () => {
    const error = validateCurrentStep();
    if (error) {
      setStepError(error);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }
    setStepError(null);
    // Si rellena el DNI del tutor 1 en el paso 1 y el del titular bancario está vacío, lo pre-rellenamos
    if (step === 1 && !formData.accountHolderDni) {
      setFormData((prev) => ({ ...prev, accountHolderDni: prev.parent1Dni.toUpperCase() }));
    }
    setStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    const error = validateCurrentStep();
    if (error || !token) {
      setStepError(error);
      return;
    }

    setIsSubmitting(true);
    setStepError(null);

    try {
      const payload: CompleteEnrollmentPayload = {
        ...formData,
        parent1Dni: formData.parent1Dni.trim().toUpperCase(),
        parent2Dni: formData.parent2Dni?.trim().toUpperCase() || undefined,
        childDni: formData.childDni?.trim().toUpperCase() || undefined,
        childPhone: formData.childPhone?.trim() || undefined,
        childEmail: formData.childEmail?.trim() || undefined,
        parent2Phone: formData.parent2Phone?.trim() || undefined,
        parent2Email: formData.parent2Email?.trim() || undefined,
        accountHolderDni: formData.accountHolderDni.trim().toUpperCase(),
        iban: formData.iban.replace(/\s+/g, '').toUpperCase(),
        signatureParent2: formData.signatureParent2 || undefined,
      };

      await applicationsApi.submitMagicEnrollment(token, payload);
      setCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setStepError(err instanceof Error ? err.message : 'Error al guardar la inscripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-600">
        Verificando enlace personal de inscripción...
      </div>
    );
  }

  if (loadError || !applicant) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
          <AlertCircle size={42} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace no disponible</h2>
          <p className="text-sm text-gray-600">{loadError}</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Inscripción Oficial Completada!
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Todos los datos médicos, bancarios y firmas de{' '}
            <strong>
              {applicant.childFirstName} {applicant.childLastName}
            </strong>{' '}
            en la rama <strong>{applicant.calculatedBranch}</strong> han quedado registrados correctamente.
          </p>
          <div className="bg-emerald-50 text-emerald-900 text-xs rounded-xl p-4 text-left">
            No tenéis que imprimir ni llevar ningún papel físico: Secretaría del Grupo IV validará
            la ficha directamente en el censo oficial. ¡Bienvenidos al grupo!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Cabecera Personalizada */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-800 rounded-2xl p-6 text-white shadow-md mb-6">
        <span className="inline-block bg-white/20 text-xs font-semibold px-3 py-1 rounded-full mb-2">
          Fase 2 · Hoja Oficial de Inscripción MSC
        </span>
        <h1 className="text-2xl font-bold">
          Inscripción de {applicant.childFirstName} {applicant.childLastName}
        </h1>
        <p className="text-blue-100 text-sm mt-1">
          Plaza asignada en la rama: <strong>{applicant.calculatedBranch}</strong> ({applicant.currentAge} años)
        </p>
      </div>

      {/* Barra de Progreso de 4 Pasos */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { num: 1, title: '1. Datos y DNI', icon: FileText },
          { num: 2, title: '2. Ficha Médica', icon: HeartPulse },
          { num: 3, title: '3. Banco SEPA', icon: Landmark },
          { num: 4, title: '4. Firma Digital', icon: PenTool },
        ].map((item) => {
          const Icon = item.icon;
          const active = step === item.num;
          const done = step > item.num;
          return (
            <div
              key={item.num}
              className={`p-3 rounded-xl border text-center transition ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : done
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-white text-gray-400 border-gray-200'
              }`}
            >
              <Icon size={18} className="mx-auto mb-1" />
              <span className="text-xs font-bold block truncate">{item.title}</span>
            </div>
          );
        })}
      </div>

      {stepError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-medium">
          <AlertCircle size={20} className="shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {/* PASO 1: Confirmar Datos y Añadir DNI / Custodia */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Paso 1: Confirmación de Domicilio y Datos Legales
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Hemos recuperado los datos de vuestra solicitud. Revisa si os habéis mudado y añade los DNI para el seguro scout.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI del Educando (si tiene)
                </label>
                <input
                  type="text"
                  name="childDni"
                  value={formData.childDni}
                  onChange={handleChange}
                  placeholder="12345678A"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Situación del Asociado
                </label>
                <select
                  name="legalStatus"
                  value={formData.legalStatus}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm bg-white"
                >
                  <option value="MENOR">Menor de edad</option>
                  <option value="MAYOR">Mayor de edad</option>
                  <option value="EMANCIPADO">Menor emancipado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recepción de Circulares
                </label>
                <select
                  name="circularPreference"
                  value={formData.circularPreference}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm bg-white"
                >
                  <option value="EMAIL">Vía E-Mail</option>
                  <option value="CORREO_POSTAL">Correo Postal</option>
                </select>
              </div>
            </div>

            {/* Domicilio pre-rellenado */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Dirección (Calle / Avda) *
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nº</label>
                <input
                  type="text"
                  name="streetNumber"
                  value={formData.streetNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Código Postal *</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* DNI Padres y Custodia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI de {applicant.parent1FirstName} {applicant.parent1LastName} (Tutor 1) *
                </label>
                <input
                  type="text"
                  name="parent1Dni"
                  value={formData.parent1Dni}
                  onChange={handleChange}
                  placeholder="12345678A"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI del Segundo Tutor {formData.custodyType === 'CUSTODIA_CONJUNTA' ? '*' : '(Opcional)'}
                </label>
                <input
                  type="text"
                  name="parent2Dni"
                  value={formData.parent2Dni}
                  onChange={handleChange}
                  placeholder="87654321B"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado Civil de los Padres / Tutores
                </label>
                <input
                  type="text"
                  name="parentsMaritalStatus"
                  value={formData.parentsMaritalStatus}
                  onChange={handleChange}
                  placeholder="Casados, divorciados, familia monoparental..."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Custodia Legal (Si aplica)
                </label>
                <select
                  name="custodyType"
                  value={formData.custodyType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm bg-white"
                >
                  <option value="SIN_ESPECIFICAR">Matrimonio / Convivencia estándar</option>
                  <option value="CUSTODIA_UNICA">Custodia Única (1 firma)</option>
                  <option value="CUSTODIA_CONJUNTA">Custodia Conjunta (Exige firma de ambos padres)</option>
                  <option value="TUTELA_LEGAL">Tutela Legal</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Ficha Médica (Hoja 2 MSC) */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Paso 2: Ficha Médica para Acampadas y Salidas
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Información confidencial para el equipo de responsables durante las actividades.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grupo Sanguíneo (si se conoce)
                </label>
                <input
                  type="text"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange}
                  placeholder="Ej. A+, 0-, Desconocido..."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enfermedades Crónicas
                </label>
                <input
                  type="text"
                  name="chronicDiseases"
                  value={formData.chronicDiseases}
                  onChange={handleChange}
                  placeholder="Asma, diabetes, ninguna..."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alergias (Alimentarias, medicamentosas, picaduras, etc.)
              </label>
              <textarea
                name="allergies"
                rows={2}
                value={formData.allergies}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3">
                ¿Qué medicación habitual se le puede administrar en caso leve de...?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dolor de Cabeza
                  </label>
                  <input
                    type="text"
                    name="medHeadache"
                    value={formData.medHeadache}
                    onChange={handleChange}
                    placeholder="Ej. Paracetamol / Ibuprofeno"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fiebre</label>
                  <input
                    type="text"
                    name="medFever"
                    value={formData.medFever}
                    onChange={handleChange}
                    placeholder="Ej. Apiretal / Dalsy"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Molestias de Estómago
                  </label>
                  <input
                    type="text"
                    name="medStomach"
                    value={formData.medStomach}
                    onChange={handleChange}
                    placeholder="Ej. Suero oral / Nada"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dolor de Garganta
                  </label>
                  <input
                    type="text"
                    name="medThroat"
                    value={formData.medThroat}
                    onChange={handleChange}
                    placeholder="Ej. Ibuprofeno"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones médicas adicionales (tratamientos, intolerancias, etc.)
              </label>
              <textarea
                name="medicalObservations"
                rows={2}
                value={formData.medicalObservations}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm"
              />
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                name="authorizesEmergency"
                checked={formData.authorizesEmergency}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded text-indigo-600"
              />
              <span className="text-xs text-amber-950 leading-relaxed">
                <strong>Autorización médica de urgencia:</strong> Autorizo bajo mi responsabilidad a
                los responsables del Grupo Scout para que, en caso de accidente o enfermedad que
                requiera algún tipo de tratamiento médico o intervención quirúrgica urgente y no
                siendo posible mi localización, puedan tomar la decisión oportuna.
              </span>
            </label>
          </div>
        )}

        {/* PASO 3: Domiciliación Bancaria SEPA (Hoja 3 MSC) */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Paso 3: Domiciliación Bancaria de Cuotas (SEPA)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Para el abono de cuotas trimestrales y actividades del Grupo Scout.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre y Apellidos del Titular de la Cuenta *
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI / NIE del Titular *
                </label>
                <input
                  type="text"
                  name="accountHolderDni"
                  value={formData.accountHolderDni}
                  onChange={handleChange}
                  placeholder="12345678A"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Cuenta IBAN (ES + 22 dígitos) *
                </label>
                <input
                  type="text"
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                  placeholder="ES00 0000 0000 0000 0000 0000"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Puedes escribirlo con o sin espacios (24 caracteres en total empezando por ES).
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
              <input
                type="checkbox"
                name="authorizesSepa"
                checked={formData.authorizesSepa}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded text-indigo-600"
              />
              <span className="text-xs text-gray-700 leading-relaxed">
                <strong>AUTORIZO</strong> a mi Entidad Bancaria para que en mi nombre y con cargo a
                mi cuenta, tenga a bien abonar mis cuotas al Grupo Scout IV San José de Calasanz.
                Acepto que, en caso de producirse la devolución de alguno de mis recibos, los gastos
                de devolución se cargarán en el siguiente cobro.
              </span>
            </label>
          </div>
        )}

        {/* PASO 4: Autorizaciones Legales y Firma Táctil en Pantalla */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Paso 4: Consentimientos Legales y Firma Digital
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Revisa las autorizaciones oficiales del Movimiento Scout Católico y firma en el recuadro inferior.
              </p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-700">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptsDataStorage"
                  checked={formData.acceptsDataStorage}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded text-indigo-600"
                />
                <span>
                  <strong>Tratamiento de datos (Obligatorio):</strong> Autorizo a que los datos
                  personales sean almacenados y tratados por el Grupo Scout y el Movimiento Scout
                  Católico (LOPDGDD) para la gestión de las actividades propias del grupo
                  (manualidades, talleres, juegos, acampadas y campamentos).
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptsDataTransfer"
                  checked={formData.acceptsDataTransfer}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded text-indigo-600"
                />
                <span>
                  <strong>Cesión federativa MSC (Obligatorio):</strong> Autorizo que los datos
                  personales sean cedidos a las distintas asociaciones y federaciones pertenecientes
                  al Movimiento Scout Católico con la finalidad de gestionar seguros y censos.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-gray-200">
                <input
                  type="checkbox"
                  name="authorizesImages"
                  checked={formData.authorizesImages}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded text-indigo-600"
                />
                <span>
                  <strong>Derechos de Imagen (Fotografías y Vídeos):</strong> Autorizo al Grupo
                  Scout a la utilización de fotografías y vídeos tomados en las actividades con la
                  finalidad de mostrar y promocionar el escultismo en ámbitos no comerciales.{' '}
                  <em>(Desmarca esta casilla si NO autorizas el uso de imágenes).</em>
                </span>
              </label>
            </div>

            {/* Recuadro Firma 1 */}
            <SignatureBox
              label={`Firma del Padre / Madre / Tutor 1 (${applicant.parent1FirstName} ${applicant.parent1LastName} - DNI ${formData.parent1Dni}) *`}
              onChange={(sig) => setFormData((prev) => ({ ...prev, signatureParent1: sig }))}
            />

            {/* Recuadro Firma 2 (Si hay custodia conjunta) */}
            {formData.custodyType === 'CUSTODIA_CONJUNTA' && (
              <div className="pt-4 border-t border-gray-200">
                <SignatureBox
                  label={`Segunda Firma Obligatoria por Custodia Conjunta (DNI ${formData.parent2Dni}) *`}
                  onChange={(sig) => setFormData((prev) => ({ ...prev, signatureParent2: sig }))}
                />
              </div>
            )}
          </div>
        )}

        {/* Botonera Inferior de Navegación del Asistente */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setStepError(null);
                setStep((prev) => prev - 1);
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 transition"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-sm transition"
            >
              Siguiente paso
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-bold px-7 py-3.5 rounded-xl shadow-md transition"
            >
              <ShieldCheck size={18} />
              {isSubmitting ? 'Guardando inscripción...' : 'Firmar y Completar Inscripción'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}