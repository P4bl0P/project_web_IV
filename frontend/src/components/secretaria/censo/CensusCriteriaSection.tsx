import type { DirectCensusPayload } from '../../../services/api';
import FormField from '../../shared/forms/FormField';
import FormSection from '../../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../../shared/forms/formStyles';
import type { CensusChangeHandler, CensusFieldErrors } from './censusForm';

interface Props {
  formData: DirectCensusPayload;
  fieldErrors: CensusFieldErrors;
  onChange: CensusChangeHandler;
}

export default function CensusCriteriaSection({ formData, fieldErrors, onChange }: Props) {
  return (
    <FormSection
      title="Información complementaria"
      description="Estos datos son opcionales salvo que actives uno de los criterios."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-[#f8f9fc] p-3.5 transition-colors">
          <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              name="hasFamilyInGroup"
              checked={formData.hasFamilyInGroup}
              onChange={onChange}
              className={formCheckboxClass}
            />
            <span>Familiar directo en el Grupo IV</span>
          </label>
          {formData.hasFamilyInGroup && (
            <FormField label="Nombre y parentesco" required error={fieldErrors.familyMemberDetails} className="mt-3">
              <input
                name="familyMemberDetails"
                value={formData.familyMemberDetails}
                onChange={onChange}
                aria-invalid={Boolean(fieldErrors.familyMemberDetails)}
                className={formInputClass(Boolean(fieldErrors.familyMemberDetails))}
              />
            </FormField>
          )}
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-[#f8f9fc] p-3.5 transition-colors">
          <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              name="comesFromOtherGroup"
              checked={formData.comesFromOtherGroup}
              onChange={onChange}
              className={formCheckboxClass}
            />
            <span>Procede de otro grupo scout</span>
          </label>
          {formData.comesFromOtherGroup && (
            <FormField label="Grupo de procedencia" required error={fieldErrors.originGroupDetails} className="mt-3">
              <input
                name="originGroupDetails"
                value={formData.originGroupDetails}
                onChange={onChange}
                aria-invalid={Boolean(fieldErrors.originGroupDetails)}
                className={formInputClass(Boolean(fieldErrors.originGroupDetails))}
              />
            </FormField>
          )}
        </div>
        <FormField label="Motivación y observaciones" className="md:col-span-2">
          <textarea
            name="motivation"
            value={formData.motivation}
            onChange={onChange}
            rows={3}
            className={formInputClass(false, 'resize-y')}
          />
        </FormField>
      </div>
    </FormSection>
  );
}
