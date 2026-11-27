import type { ChangeEvent, FocusEvent } from 'react';
import { Award } from 'lucide-react';
import type { CreateApplicationPayload } from '../../services/api';
import type { SolicitudFieldErrors } from '../../utils/scoutValidators';
import FormField from '../shared/forms/FormField';
import FormSection from '../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';
import { getSolicitudErrorId, getSolicitudFieldId } from './solicitudForm';

interface CriteriosSectionProps {
  formData: CreateApplicationPayload;
  fieldErrors: SolicitudFieldErrors;
  validFields?: Partial<Record<keyof CreateApplicationPayload, boolean>>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function CriteriosSection({
  formData,
  fieldErrors,
  validFields = {},
  onChange,
  onBlur,
}: CriteriosSectionProps) {
  const familyDetailsId = getSolicitudFieldId('familyMemberDetails');
  const familyDetailsErrorId = getSolicitudErrorId('familyMemberDetails');
  const originGroupId = getSolicitudFieldId('originGroupDetails');
  const originGroupErrorId = getSolicitudErrorId('originGroupDetails');
  const motivationId = getSolicitudFieldId('motivation');
  const motivationErrorId = getSolicitudErrorId('motivation');
  const motivationLength = (formData.motivation || '').length;

  return (
    <FormSection className="motion-safe:animate-[reveal_0.6s_cubic-bezier(0.2,0.8,0.2,1)_0.12s_both]">
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#01317b]/[0.08] text-[#01317b]"
            aria-hidden="true"
          >
            <Award size={20} />
          </span>
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#e22328]">
              Sección 3 de 3
            </span>
            <h2 className="mt-0.5 text-base sm:text-lg font-bold tracking-tight text-[#000254]">
              Criterios de prioridad y motivación
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#627089]">
              Esta información ayuda al Kraal a gestionar la lista de espera de forma justa y transparente.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className={`rounded-xl border p-4 transition-colors duration-150 ${
            formData.hasFamilyInGroup
              ? 'border-[#01317b]/25 bg-[#01317b]/[0.03]'
              : 'border-slate-200/85 bg-[#f8f9fc] hover:border-slate-300'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id={getSolicitudFieldId('hasFamilyInGroup')}
              type="checkbox"
              name="hasFamilyInGroup"
              checked={formData.hasFamilyInGroup}
              onChange={onChange}
              className={formCheckboxClass}
            />
            <div>
              <span className="block text-xs sm:text-sm font-semibold text-[#0c1933]">
                ¿Tiene algún familiar directo en el Grupo IV actualmente?
              </span>
              <span className="mt-0.5 block text-[11px] text-[#627089]">
                Hermano/a educando, scouter o viejo lobo.
              </span>
            </div>
          </label>

          {formData.hasFamilyInGroup && (
            <div className="mt-3.5 pl-0 sm:pl-7 animate-sec-expand">
              <FormField
                label="Nombre completo y parentesco"
                htmlFor={familyDetailsId}
                required
                error={fieldErrors.familyMemberDetails}
                errorId={familyDetailsErrorId}
                isValid={Boolean(validFields.familyMemberDetails)}
              >
                <input
                  id={familyDetailsId}
                  type="text"
                  name="familyMemberDetails"
                  autoComplete="off"
                  value={formData.familyMemberDetails}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={Boolean(fieldErrors.familyMemberDetails)}
                  aria-describedby={
                    fieldErrors.familyMemberDetails ? familyDetailsErrorId : undefined
                  }
                  placeholder="Ej. Ana García Pérez (hermana en Lobatos)"
                  className={formInputClass(
                    Boolean(fieldErrors.familyMemberDetails),
                    '',
                    Boolean(validFields.familyMemberDetails),
                  )}
                />
              </FormField>
            </div>
          )}
        </div>

        <div
          className={`rounded-xl border p-4 transition-colors duration-150 ${
            formData.comesFromOtherGroup
              ? 'border-[#01317b]/25 bg-[#01317b]/[0.03]'
              : 'border-slate-200/85 bg-[#f8f9fc] hover:border-slate-300'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id={getSolicitudFieldId('comesFromOtherGroup')}
              type="checkbox"
              name="comesFromOtherGroup"
              checked={formData.comesFromOtherGroup}
              onChange={onChange}
              className={formCheckboxClass}
            />
            <div>
              <span className="block text-xs sm:text-sm font-semibold text-[#0c1933]">
                ¿Proviene de otro Grupo Scout?
              </span>
              <span className="mt-0.5 block text-[11px] text-[#627089]">
                Traslado o experiencia previa en otro grupo federado.
              </span>
            </div>
          </label>

          {formData.comesFromOtherGroup && (
            <div className="mt-3.5 pl-0 sm:pl-7 animate-sec-expand">
              <FormField
                label="Grupo scout de procedencia y localidad"
                htmlFor={originGroupId}
                required
                error={fieldErrors.originGroupDetails}
                errorId={originGroupErrorId}
                isValid={Boolean(validFields.originGroupDetails)}
              >
                <input
                  id={originGroupId}
                  type="text"
                  name="originGroupDetails"
                  autoComplete="off"
                  value={formData.originGroupDetails}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={Boolean(fieldErrors.originGroupDetails)}
                  aria-describedby={
                    fieldErrors.originGroupDetails ? originGroupErrorId : undefined
                  }
                  placeholder="Ej. Grupo Scout San Jorge · Sevilla"
                  className={formInputClass(
                    Boolean(fieldErrors.originGroupDetails),
                    '',
                    Boolean(validFields.originGroupDetails),
                  )}
                />
              </FormField>
            </div>
          )}
        </div>
      </div>

      <FormField
        label="Motivación y observaciones"
        htmlFor={motivationId}
        hint="Opcional · Cuéntanos por qué os gustaría formar parte del Grupo IV o cualquier aspecto relevante."
        error={fieldErrors.motivation}
        errorId={motivationErrorId}
        badge={
          <span className="text-[11px] font-medium text-slate-400 tabular-nums">
            {motivationLength}/1000
          </span>
        }
      >
        <textarea
          id={motivationId}
          name="motivation"
          rows={3}
          maxLength={1000}
          autoComplete="off"
          value={formData.motivation}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(fieldErrors.motivation)}
          aria-describedby={fieldErrors.motivation ? motivationErrorId : undefined}
          placeholder="Cuéntanos por qué os gustaría formar parte del Grupo IV..."
          className={formInputClass(Boolean(fieldErrors.motivation), 'resize-y')}
        />
      </FormField>
    </FormSection>
  );
}
