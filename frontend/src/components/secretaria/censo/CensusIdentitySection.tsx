import type { DirectCensusPayload } from '../../../services/api';
import CensusField from './CensusField';
import { censusInputClass } from './censusStyles';
import type { CensusChangeHandler, CensusFieldErrors } from './censusForm';

interface Props {
  formData: DirectCensusPayload;
  fieldErrors: CensusFieldErrors;
  onChange: CensusChangeHandler;
}

export default function CensusIdentitySection({ formData, fieldErrors, onChange }: Props) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">Datos personales y familiares</h3>
        <p className="mt-1 text-xs text-slate-500">Completa los datos identificativos y de contacto del educando y sus tutores.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <CensusField label="Nombre del educando" required error={fieldErrors.childFirstName}>
          <input name="childFirstName" autoComplete="given-name" value={formData.childFirstName} onChange={onChange} aria-invalid={Boolean(fieldErrors.childFirstName)} className={censusInputClass(Boolean(fieldErrors.childFirstName))} />
        </CensusField>
        <CensusField label="Apellidos" required error={fieldErrors.childLastName} className="md:col-span-2">
          <input name="childLastName" autoComplete="family-name" value={formData.childLastName} onChange={onChange} aria-invalid={Boolean(fieldErrors.childLastName)} className={censusInputClass(Boolean(fieldErrors.childLastName))} />
        </CensusField>
        <CensusField label="Fecha de nacimiento" required error={fieldErrors.childBirthDate}>
          <input type="date" name="childBirthDate" value={formData.childBirthDate} onChange={onChange} aria-invalid={Boolean(fieldErrors.childBirthDate)} className={censusInputClass(Boolean(fieldErrors.childBirthDate))} />
        </CensusField>
        <CensusField label="Género">
          <select name="gender" value={formData.gender} onChange={onChange} className={censusInputClass(false, 'bg-white')}>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
            <option value="OTRO">Otro</option>
          </select>
        </CensusField>
        <CensusField label="Nombre del tutor 1" required error={fieldErrors.parent1FirstName}>
          <input name="parent1FirstName" autoComplete="given-name" value={formData.parent1FirstName} onChange={onChange} aria-invalid={Boolean(fieldErrors.parent1FirstName)} className={censusInputClass(Boolean(fieldErrors.parent1FirstName))} />
        </CensusField>
        <CensusField label="Apellidos del tutor 1" required error={fieldErrors.parent1LastName} className="md:col-span-2">
          <input name="parent1LastName" autoComplete="family-name" value={formData.parent1LastName} onChange={onChange} aria-invalid={Boolean(fieldErrors.parent1LastName)} className={censusInputClass(Boolean(fieldErrors.parent1LastName))} />
        </CensusField>
        <CensusField label="Nombre del tutor 2">
          <input name="parent2FirstName" autoComplete="additional-name" value={formData.parent2FirstName} onChange={onChange} className={censusInputClass()} />
        </CensusField>
        <CensusField label="Apellidos del tutor 2" className="md:col-span-2">
          <input name="parent2LastName" autoComplete="family-name" value={formData.parent2LastName} onChange={onChange} className={censusInputClass()} />
        </CensusField>
      </div>
    </section>
  );
}
