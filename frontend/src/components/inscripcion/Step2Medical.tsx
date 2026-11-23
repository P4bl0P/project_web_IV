import type { ChangeEvent } from 'react';
import { PhoneCall } from 'lucide-react';
import type { CompleteEnrollmentPayload } from '../../services/api';
import FormField from '../shared/forms/FormField';
import FormSection from '../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';

interface Props {
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFillEmergencyFromTutor1?: () => void;
  fieldErrors?: Record<string, string>;
}

export default function Step2Medical({
  formData,
  onChange,
  onFillEmergencyFromTutor1,
  fieldErrors = {},
}: Props) {
  return (
    <FormSection
      title="2. Ficha médica y contacto de emergencia"
      description="Información sanitaria confidencial de acceso restringido para el cuidado del educando."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormField label="Grupo sanguíneo">
          <input
            type="text"
            name="bloodType"
            value={formData.bloodType || ''}
            onChange={onChange}
            placeholder="Ej. A+, O-"
            className={formInputClass()}
          />
        </FormField>
        <FormField label="Enfermedades crónicas" className="md:col-span-2">
          <input
            type="text"
            name="chronicDiseases"
            value={formData.chronicDiseases || ''}
            onChange={onChange}
            placeholder="Indicar si padece alguna o dejar vacío si ninguna"
            className={formInputClass()}
          />
        </FormField>
      </div>

      <FormField label="Alergias e intolerancias">
        <textarea
          name="allergies"
          rows={2}
          value={formData.allergies || ''}
          onChange={onChange}
          placeholder="Medicamentos, alimentos, picaduras, etc."
          className={formInputClass(false, 'resize-y')}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#f8f9fc] p-4 rounded-xl border border-slate-200/80">
        {([
          ['medHeadache', 'Dolor de cabeza'],
          ['medFever', 'Fiebre'],
          ['medStomach', 'Dolor de estómago'],
          ['medThroat', 'Dolor de garganta'],
        ] as const).map(([field, label]) => (
          <FormField key={field} label={label}>
            <input
              type="text"
              name={field}
              value={formData[field] || ''}
              onChange={onChange}
              placeholder="Qué administrarle y pauta si procede..."
              className={formInputClass()}
            />
          </FormField>
        ))}
      </div>

      <FormField label="Observaciones médicas relevantes">
        <textarea
          name="medicalObservations"
          rows={2}
          value={formData.medicalObservations || ''}
          onChange={onChange}
          placeholder="Cualquier información adicional para campamentos o actividades..."
          className={formInputClass(false, 'resize-y')}
        />
      </FormField>

      <div className="rounded-xl border border-slate-200/80 bg-[#f8f9fc] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#000254] inline-flex items-center gap-1.5">
            <PhoneCall size={13} /> Contacto de emergencia
          </p>
          {onFillEmergencyFromTutor1 && (
            <button
              type="button"
              onClick={onFillEmergencyFromTutor1}
              className="text-[11px] font-semibold text-[#01317b] hover:underline cursor-pointer"
            >
              Usar datos del Tutor 1
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField label="Nombre completo">
            <input
              type="text"
              name="emergencyContactName"
              value={formData.emergencyContactName || ''}
              onChange={onChange}
              placeholder="Persona de contacto en urgencias"
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Teléfono de emergencia" error={fieldErrors.emergencyContactPhone}>
            <input
              type="tel"
              name="emergencyContactPhone"
              value={formData.emergencyContactPhone || ''}
              onChange={onChange}
              placeholder="600112233"
              className={formInputClass(Boolean(fieldErrors.emergencyContactPhone))}
            />
          </FormField>
          <FormField label="Relación / vínculo">
            <input
              type="text"
              name="emergencyContactRelationship"
              value={formData.emergencyContactRelationship || ''}
              onChange={onChange}
              placeholder="Ej. Madre, tío, abuela..."
              className={formInputClass()}
            />
          </FormField>
        </div>
      </div>

      <label
        className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer text-xs transition-colors ${
          fieldErrors.authorizesEmergency
            ? 'border-rose-400 bg-rose-50 text-rose-900'
            : 'border-amber-200/90 bg-amber-50/75 text-amber-950'
        }`}
      >
        <input
          type="checkbox"
          name="authorizesEmergency"
          checked={formData.authorizesEmergency}
          onChange={onChange}
          className={formCheckboxClass}
        />
        <span>
          <strong>Autorización médica de urgencia:</strong> Autorizo a los responsables del Grupo Scout a tomar la decisión médica oportuna en caso de accidente o enfermedad urgente si no es posible localizarme.
        </span>
      </label>
      {fieldErrors.authorizesEmergency && (
        <p className="text-[11px] font-medium text-rose-600">{fieldErrors.authorizesEmergency}</p>
      )}
    </FormSection>
  );
}
