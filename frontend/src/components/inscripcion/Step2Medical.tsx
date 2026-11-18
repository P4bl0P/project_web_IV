import type { ChangeEvent } from 'react';
import type { CompleteEnrollmentPayload } from '../../services/api';
import FormField from '../ui/forms/FormField';
import FormSection from '../ui/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../ui/forms/formStyles';

interface Props {
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  fieldErrors?: Record<string, string>;
}

export default function Step2Medical({ formData, onChange, fieldErrors = {} }: Props) {
  return (
    <FormSection title="2. Ficha médica" description="Indica cualquier información relevante para la atención del educando.">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormField label="Grupo sanguíneo">
          <input
            type="text"
            name="bloodType"
            value={formData.bloodType}
            onChange={onChange}
            placeholder="Ej. A+, 0-"
            className={formInputClass()}
          />
        </FormField>
        <FormField label="Enfermedades crónicas" className="md:col-span-2">
          <input
            type="text"
            name="chronicDiseases"
            value={formData.chronicDiseases}
            onChange={onChange}
            className={formInputClass()}
          />
        </FormField>
      </div>

      <FormField label="Alergias">
        <textarea
          name="allergies"
          rows={2}
          value={formData.allergies}
          onChange={onChange}
          className={formInputClass(false, 'resize-y')}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
        {([
          ['medHeadache', 'Dolor de Cabeza'],
          ['medFever', 'Fiebre'],
          ['medStomach', 'Estómago'],
          ['medThroat', 'Garganta'],
        ] as const).map(([field, label]) => (
          <FormField key={field} label={label}>
            <input
              type="text"
              name={field}
              value={formData[field]}
              onChange={onChange}
              placeholder="Qué administrarle..."
              className={formInputClass()}
            />
          </FormField>
        ))}
      </div>

      <FormField label="Observaciones médicas">
        <textarea
          name="medicalObservations"
          rows={2}
          value={formData.medicalObservations}
          onChange={onChange}
          className={formInputClass(false, 'resize-y')}
        />
      </FormField>

      <label className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer text-xs text-amber-950 ${
        fieldErrors.authorizesEmergency ? 'border-red-400 bg-red-50' : 'border-amber-200 bg-amber-50'
      }`}>
        <input
          type="checkbox"
          name="authorizesEmergency"
          checked={formData.authorizesEmergency}
          onChange={onChange}
          className={formCheckboxClass}
        />
        <span>
          <strong>Autorización médica de urgencia:</strong> Autorizo a los responsables del Grupo Scout a tomar la decisión médica oportuna en caso de urgencia si no es posible localizarme.
        </span>
      </label>
      {fieldErrors.authorizesEmergency && <p className="text-[11px] text-red-600">{fieldErrors.authorizesEmergency}</p>}
    </FormSection>
  );
}