import type { DirectCensusPayload } from '../../../services/api';
import FormField from '../../ui/forms/FormField';
import FormSection from '../../ui/forms/FormSection';
import { formInputClass } from '../../ui/forms/formStyles';
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
          <input name="childFirstName" autoComplete="given-name" value={formData.childFirstName} onChange={onChange} aria-invalid={Boolean(fieldErrors.childFirstName)} className={formInputClass(Boolean(fieldErrors.childFirstName))} />
        </FormField>
        <FormField label="Apellidos" required error={fieldErrors.childLastName} className="md:col-span-2">
          <input name="childLastName" autoComplete="family-name" value={formData.childLastName} onChange={onChange} aria-invalid={Boolean(fieldErrors.childLastName)} className={formInputClass(Boolean(fieldErrors.childLastName))} />
        </FormField>
        <FormField label="Fecha de nacimiento" required error={fieldErrors.childBirthDate}>
          <input type="date" name="childBirthDate" value={formData.childBirthDate} onChange={onChange} aria-invalid={Boolean(fieldErrors.childBirthDate)} className={formInputClass(Boolean(fieldErrors.childBirthDate))} />
        </FormField>
        <FormField label="Género">
          <select name="gender" value={formData.gender} onChange={onChange} className={formInputClass(false, 'bg-white cursor-pointer')}>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
            <option value="OTRO">Otro</option>
          </select>
        </FormField>
        <FormField label="Nombre del tutor 1" required error={fieldErrors.parent1FirstName}>
          <input name="parent1FirstName" autoComplete="given-name" value={formData.parent1FirstName} onChange={onChange} aria-invalid={Boolean(fieldErrors.parent1FirstName)} className={formInputClass(Boolean(fieldErrors.parent1FirstName))} />
        </FormField>
        <FormField label="Apellidos del tutor 1" required error={fieldErrors.parent1LastName} className="md:col-span-2">
          <input name="parent1LastName" autoComplete="family-name" value={formData.parent1LastName} onChange={onChange} aria-invalid={Boolean(fieldErrors.parent1LastName)} className={formInputClass(Boolean(fieldErrors.parent1LastName))} />
        </FormField>
        <FormField label="Nombre del tutor 2">
          <input name="parent2FirstName" autoComplete="additional-name" value={formData.parent2FirstName} onChange={onChange} className={formInputClass()} />
        </FormField>
        <FormField label="Apellidos del tutor 2" className="md:col-span-2">
          <input name="parent2LastName" autoComplete="family-name" value={formData.parent2LastName} onChange={onChange} className={formInputClass()} />
        </FormField>
      </div>
    </FormSection>
  );
}
