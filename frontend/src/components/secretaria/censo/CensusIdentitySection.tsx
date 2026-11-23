import type { DirectCensusPayload } from '../../../services/api';
import { getTodayIsoDate } from '../../../utils/dateUtils';
import DatePicker from '../../shared/forms/DatePicker';
import FormField from '../../shared/forms/FormField';
import FormSection from '../../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../../shared/forms/formStyles';
import type { CensusChangeHandler, CensusFieldErrors } from './censusForm';

interface Props {
  formData: DirectCensusPayload;
  fieldErrors: CensusFieldErrors;
  onChange: CensusChangeHandler;
}

export default function CensusIdentitySection({ formData, fieldErrors, onChange }: Props) {
  return (
    <FormSection
      title="Datos personales y familiares"
      description="Completa los datos identificativos y de contacto del educando y sus tutores."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <FormField label="Nombre del educando" required error={fieldErrors.childFirstName}>
          <input
            name="childFirstName"
            autoComplete="given-name"
            value={formData.childFirstName}
            onChange={onChange}
            aria-invalid={Boolean(fieldErrors.childFirstName)}
            className={formInputClass(Boolean(fieldErrors.childFirstName))}
          />
        </FormField>
        <FormField label="Primer apellido" required error={fieldErrors.childLastName1}>
          <input
            name="childLastName1"
            autoComplete="family-name"
            value={formData.childLastName1}
            onChange={onChange}
            aria-invalid={Boolean(fieldErrors.childLastName1)}
            className={formInputClass(Boolean(fieldErrors.childLastName1))}
          />
        </FormField>
        <FormField
          label="Segundo apellido"
          required={!formData.hasNoSecondLastName}
          error={fieldErrors.childLastName2}
        >
          <input
            name="childLastName2"
            disabled={Boolean(formData.hasNoSecondLastName)}
            value={formData.hasNoSecondLastName ? '' : formData.childLastName2 || ''}
            onChange={onChange}
            aria-invalid={Boolean(fieldErrors.childLastName2)}
            className={formInputClass(
              Boolean(fieldErrors.childLastName2),
              formData.hasNoSecondLastName ? 'bg-slate-100 text-slate-400' : '',
            )}
          />
        </FormField>
        <FormField label="Fecha de nacimiento" required error={fieldErrors.childBirthDate}>
          <DatePicker
            name="childBirthDate"
            value={formData.childBirthDate}
            onChange={onChange}
            required
            hasError={Boolean(fieldErrors.childBirthDate)}
            aria-invalid={Boolean(fieldErrors.childBirthDate)}
            max={getTodayIsoDate()}
            min={`${new Date().getFullYear() - 25}-01-01`}
            defaultViewYear={new Date().getFullYear() - 10}
            aria-label="Fecha de nacimiento"
          />
        </FormField>

        <div className="md:col-span-4 rounded-xl border border-slate-200/80 bg-[#f8f9fc] p-3 space-y-2.5">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              name="hasNoSecondLastName"
              checked={Boolean(formData.hasNoSecondLastName)}
              onChange={onChange}
              className={formCheckboxClass}
            />
            <span>Sin segundo apellido (excepción documental)</span>
          </label>
          {formData.hasNoSecondLastName && (
            <FormField
              label="Justificación de ausencia de segundo apellido"
              required
              error={fieldErrors.noSecondLastNameJustification}
            >
              <input
                name="noSecondLastNameJustification"
                value={formData.noSecondLastNameJustification || ''}
                onChange={onChange}
                className={formInputClass(Boolean(fieldErrors.noSecondLastNameJustification))}
              />
            </FormField>
          )}
        </div>

        <FormField label="Género" required error={fieldErrors.gender}>
          <select
            name="gender"
            value={formData.gender}
            onChange={onChange}
            className={formInputClass(Boolean(fieldErrors.gender), 'bg-white cursor-pointer')}
          >
            <option value="">Selecciona género…</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
          </select>
        </FormField>
        <FormField label="Nombre del tutor 1" required error={fieldErrors.parent1FirstName}>
          <input
            name="parent1FirstName"
            autoComplete="given-name"
            value={formData.parent1FirstName}
            onChange={onChange}
            aria-invalid={Boolean(fieldErrors.parent1FirstName)}
            className={formInputClass(Boolean(fieldErrors.parent1FirstName))}
          />
        </FormField>
        <FormField
          label="Apellidos del tutor 1"
          required
          error={fieldErrors.parent1LastName}
          className="md:col-span-2"
        >
          <input
            name="parent1LastName"
            autoComplete="family-name"
            value={formData.parent1LastName}
            onChange={onChange}
            aria-invalid={Boolean(fieldErrors.parent1LastName)}
            className={formInputClass(Boolean(fieldErrors.parent1LastName))}
          />
        </FormField>
        <FormField label="Nombre del tutor 2">
          <input
            name="parent2FirstName"
            autoComplete="additional-name"
            value={formData.parent2FirstName || ''}
            onChange={onChange}
            className={formInputClass()}
          />
        </FormField>
        <FormField label="Apellidos del tutor 2" className="md:col-span-2">
          <input
            name="parent2LastName"
            autoComplete="family-name"
            value={formData.parent2LastName || ''}
            onChange={onChange}
            className={formInputClass()}
          />
        </FormField>
      </div>
    </FormSection>
  );
}
