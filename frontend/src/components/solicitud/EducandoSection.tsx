import type { ChangeEvent } from 'react';
import { Compass, Sparkles } from 'lucide-react';
import type { CreateApplicationPayload } from '../../services/api';
import { getTodayIsoDate } from '../../utils/dateUtils';
import { calculatePreviewBranch, type SolicitudFieldErrors } from '../../utils/scoutValidators';
import DatePicker from '../ui/forms/DatePicker';
import FormField from '../ui/forms/FormField';
import FormSection from '../ui/forms/FormSection';
import { formInputClass } from '../ui/forms/formStyles';

interface Props {
  formData: CreateApplicationPayload;
  fieldErrors: SolicitudFieldErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function EducandoSection({ formData, fieldErrors, onChange }: Props) {
  const branchPreview = calculatePreviewBranch(formData.childBirthDate);

  return (
    <FormSection>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
        <Compass className="text-indigo-600" size={20} /> 1. Datos del Niño, Niña o Joven
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nombre" required error={fieldErrors.childFirstName}>
          <input
            type="text"
            name="childFirstName"
            value={formData.childFirstName}
            onChange={onChange}
            placeholder="Ej. Lucas"
            className={formInputClass(Boolean(fieldErrors.childFirstName))}
          />
        </FormField>

        <FormField label="Apellidos" required error={fieldErrors.childLastName}>
          <input
            type="text"
            name="childLastName"
            value={formData.childLastName}
            onChange={onChange}
            placeholder="Ej. García Pérez"
            className={formInputClass(Boolean(fieldErrors.childLastName))}
          />
        </FormField>

        <FormField label="Fecha de nacimiento" required error={fieldErrors.childBirthDate}>
          <DatePicker
            name="childBirthDate"
            value={formData.childBirthDate}
            onChange={onChange}
            required
            hasError={Boolean(fieldErrors.childBirthDate)}
            max={getTodayIsoDate()}
            min={`${new Date().getFullYear() - 25}-01-01`}
            defaultViewYear={new Date().getFullYear() - 10}
            aria-label="Fecha de nacimiento"
          />
        </FormField>

        <FormField label="Sexo" required hint="Ratio de rama">
          <select
            name="gender"
            value={formData.gender}
            onChange={onChange}
            className={formInputClass(Boolean(fieldErrors.gender))}
          >
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
            <option value="OTRO">Otro</option>
          </select>
        </FormField>
      </div>

      {branchPreview && !fieldErrors.childBirthDate && (
        <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 flex items-center gap-3 text-indigo-900">
          <Sparkles size={18} className="text-indigo-600 shrink-0" />
          <p className="text-xs sm:text-sm">
            Por su año de nacimiento ({branchPreview.age} años en esta ronda solar), solicita
            plaza para: <strong>{branchPreview.branch}</strong>
          </p>
        </div>
      )}
    </FormSection>
  );
}