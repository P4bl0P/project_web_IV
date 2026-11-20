import type { ChangeEvent } from 'react';
import type { CreateApplicationPayload } from '../../services/api';
import type { SolicitudFieldErrors } from '../../utils/scoutValidators';
import FormField from '../shared/forms/FormField';
import FormSection from '../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';

interface CriteriosSectionProps {
  formData: CreateApplicationPayload;
  fieldErrors: SolicitudFieldErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function CriteriosSection({
  formData,
  fieldErrors,
  onChange,
}: CriteriosSectionProps) {
  return (
    <FormSection
      title="4. Criterios de prioridad y motivación"
      description="Esta información ayuda al Kraal a gestionar la lista de espera."
    >
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="hasFamilyInGroup"
            checked={formData.hasFamilyInGroup}
            onChange={onChange}
            className={formCheckboxClass}
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
              onChange={onChange}
              placeholder="Nombre completo y parentesco"
              className={formInputClass(Boolean(fieldErrors.familyMemberDetails))}
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
            onChange={onChange}
            className={formCheckboxClass}
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
              onChange={onChange}
              placeholder="Nombre del grupo scout y localidad"
              className={formInputClass(Boolean(fieldErrors.originGroupDetails))}
            />
          </div>
        )}
      </div>

      <FormField label="Motivación y observaciones" error={fieldErrors.motivation}>
        <textarea
          name="motivation"
          rows={3}
          value={formData.motivation}
          onChange={onChange}
          placeholder="Cuéntanos por qué os gustaría formar parte del Grupo IV..."
          className={formInputClass(false, 'resize-y')}
        />
      </FormField>
    </FormSection>
  );
}
