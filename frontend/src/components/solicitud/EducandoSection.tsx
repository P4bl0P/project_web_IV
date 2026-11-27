import type { ChangeEvent, FocusEvent } from 'react';
import { AlertTriangle, Compass, Sparkles } from 'lucide-react';
import type { CreateApplicationPayload } from '../../services/api';
import { getTodayIsoDate } from '../../utils/dateUtils';
import { calculatePreviewBranch, type SolicitudFieldErrors } from '../../utils/scoutValidators';
import { SecBadge } from '../secretaria/secretariaTheme';
import { getBranchVisualConfig } from '../secretaria/secretariaTokens';
import DatePicker from '../shared/forms/DatePicker';
import FormField from '../shared/forms/FormField';
import FormSection from '../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';
import { getSolicitudErrorId, getSolicitudFieldId } from './solicitudForm';

interface Props {
  formData: CreateApplicationPayload;
  fieldErrors: SolicitudFieldErrors;
  validFields?: Partial<Record<keyof CreateApplicationPayload, boolean>>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function EducandoSection({
  formData,
  fieldErrors,
  validFields = {},
  onChange,
  onBlur,
}: Props) {
  const branchPreview = calculatePreviewBranch(formData.childBirthDate);
  const branchVisual = branchPreview ? getBranchVisualConfig(branchPreview.branch) : null;

  const childFirstNameId = getSolicitudFieldId('childFirstName');
  const childFirstNameErrorId = getSolicitudErrorId('childFirstName');
  const childLastName1Id = getSolicitudFieldId('childLastName1');
  const childLastName1ErrorId = getSolicitudErrorId('childLastName1');
  const childLastName2Id = getSolicitudFieldId('childLastName2');
  const childLastName2ErrorId = getSolicitudErrorId('childLastName2');
  const childBirthDateId = getSolicitudFieldId('childBirthDate');
  const childBirthDateErrorId = getSolicitudErrorId('childBirthDate');
  const justificationId = getSolicitudFieldId('noSecondLastNameJustification');
  const justificationErrorId = getSolicitudErrorId('noSecondLastNameJustification');

  return (
    <FormSection className="motion-safe:animate-[reveal_0.5s_cubic-bezier(0.2,0.8,0.2,1)_both]">
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#01317b]/[0.08] text-[#01317b]"
            aria-hidden="true"
          >
            <Compass size={20} />
          </span>
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#e22328]">
              Sección 1 de 3
            </span>
            <h2 className="mt-0.5 text-base sm:text-lg font-bold tracking-tight text-[#000254]">
              Datos del niño, niña o joven
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#627089]">
              Introduce los datos identificativos del educando. La rama scout se calculará automáticamente según su fecha de nacimiento.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5">
        <FormField
          label="Nombre"
          htmlFor={childFirstNameId}
          required
          error={fieldErrors.childFirstName}
          errorId={childFirstNameErrorId}
          isValid={Boolean(validFields.childFirstName)}
        >
          <input
            id={childFirstNameId}
            type="text"
            name="childFirstName"
            autoComplete="off"
            value={formData.childFirstName}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={Boolean(fieldErrors.childFirstName)}
            aria-describedby={fieldErrors.childFirstName ? childFirstNameErrorId : undefined}
            placeholder="Ej. Lucas"
            className={formInputClass(
              Boolean(fieldErrors.childFirstName),
              '',
              Boolean(validFields.childFirstName),
            )}
          />
        </FormField>

        <FormField
          label="Primer apellido"
          htmlFor={childLastName1Id}
          required
          error={fieldErrors.childLastName1}
          errorId={childLastName1ErrorId}
          isValid={Boolean(validFields.childLastName1)}
        >
          <input
            id={childLastName1Id}
            type="text"
            name="childLastName1"
            autoComplete="off"
            value={formData.childLastName1}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={Boolean(fieldErrors.childLastName1)}
            aria-describedby={fieldErrors.childLastName1 ? childLastName1ErrorId : undefined}
            placeholder="Ej. García"
            className={formInputClass(
              Boolean(fieldErrors.childLastName1),
              '',
              Boolean(validFields.childLastName1),
            )}
          />
        </FormField>

        <FormField
          label="Segundo apellido"
          htmlFor={childLastName2Id}
          required={!formData.hasNoSecondLastName}
          error={fieldErrors.childLastName2}
          errorId={childLastName2ErrorId}
          isValid={!formData.hasNoSecondLastName && Boolean(validFields.childLastName2)}
        >
          <input
            id={childLastName2Id}
            type="text"
            name="childLastName2"
            autoComplete="off"
            value={formData.hasNoSecondLastName ? '' : formData.childLastName2 || ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={Boolean(formData.hasNoSecondLastName)}
            aria-invalid={Boolean(fieldErrors.childLastName2)}
            aria-describedby={fieldErrors.childLastName2 ? childLastName2ErrorId : undefined}
            placeholder={formData.hasNoSecondLastName ? 'Sin segundo apellido' : 'Ej. Pérez'}
            className={formInputClass(
              Boolean(fieldErrors.childLastName2),
              formData.hasNoSecondLastName ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : '',
              !formData.hasNoSecondLastName && Boolean(validFields.childLastName2),
            )}
          />
        </FormField>

        <FormField
          label="Fecha de nacimiento"
          htmlFor={childBirthDateId}
          required
          error={fieldErrors.childBirthDate}
          errorId={childBirthDateErrorId}
          isValid={Boolean(validFields.childBirthDate)}
        >
          <DatePicker
            id={childBirthDateId}
            name="childBirthDate"
            value={formData.childBirthDate}
            onChange={onChange}
            required
            hasError={Boolean(fieldErrors.childBirthDate)}
            aria-invalid={Boolean(fieldErrors.childBirthDate)}
            aria-describedby={fieldErrors.childBirthDate ? childBirthDateErrorId : undefined}
            max={getTodayIsoDate()}
            min={`${new Date().getFullYear() - 25}-01-01`}
            defaultViewYear={new Date().getFullYear() - 10}
            aria-label="Fecha de nacimiento"
          />
        </FormField>
      </div>

      <div
        className={`rounded-xl border p-3.5 sm:p-4 space-y-3 transition-colors duration-150 ${
          formData.hasNoSecondLastName
            ? 'border-[#01317b]/25 bg-[#01317b]/[0.03]'
            : 'border-slate-200/85 bg-[#f8f9fc]'
        }`}
      >
        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
          <input
            type="checkbox"
            name="hasNoSecondLastName"
            checked={Boolean(formData.hasNoSecondLastName)}
            onChange={onChange}
            className={formCheckboxClass}
          />
          <span>
            El educando <strong className="text-[#0c1933]">no dispone de segundo apellido</strong> en su documentación oficial.
          </span>
        </label>

        {formData.hasNoSecondLastName && (
          <div className="pl-0 sm:pl-6 animate-sec-expand">
            <FormField
              label="Motivo o justificación"
              htmlFor={justificationId}
              required
              error={fieldErrors.noSecondLastNameJustification}
              errorId={justificationErrorId}
              isValid={Boolean(validFields.noSecondLastNameJustification)}
            >
              <input
                id={justificationId}
                type="text"
                name="noSecondLastNameJustification"
                autoComplete="off"
                value={formData.noSecondLastNameJustification || ''}
                onChange={onChange}
                onBlur={onBlur}
                aria-invalid={Boolean(fieldErrors.noSecondLastNameJustification)}
                aria-describedby={
                  fieldErrors.noSecondLastNameJustification ? justificationErrorId : undefined
                }
                placeholder="Ej. Documento extranjero con un único apellido legal"
                className={formInputClass(
                  Boolean(fieldErrors.noSecondLastNameJustification),
                  '',
                  Boolean(validFields.noSecondLastNameJustification),
                )}
              />
            </FormField>
          </div>
        )}
      </div>

      {branchPreview && !fieldErrors.childBirthDate && (
        <div
          role="status"
          aria-live="polite"
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 sm:p-4 animate-sec-expand ${
            branchPreview.isEligibleAsYouth
              ? 'border-[#01317b]/20 bg-[#f2f6fc] text-[#000254]'
              : 'border-amber-200 bg-amber-50/90 text-amber-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            {branchPreview.isEligibleAsYouth ? (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#01317b]/10 text-[#01317b]">
                <Sparkles size={16} aria-hidden="true" />
              </span>
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle size={16} aria-hidden="true" />
              </span>
            )}
            <p className="text-xs sm:text-sm leading-relaxed">
              {branchPreview.isEligibleAsYouth ? (
                <>
                  En la ronda solar <strong>{branchPreview.solarRoundLabel}</strong> cumple{' '}
                  <strong>{branchPreview.age} años</strong> y corresponde a:{' '}
                  <strong>{branchPreview.branch}</strong>.
                </>
              ) : branchPreview.isExternalRutas ? (
                <>
                  Con <strong>{branchPreview.age} años</strong> en la ronda{' '}
                  <strong>{branchPreview.solarRoundLabel}</strong> corresponde a{' '}
                  <strong>Rutas</strong> (Agrupación de Rutas, fuera de las ramas gestionadas por el
                  Grupo IV).
                </>
              ) : (
                <>
                  Con <strong>{branchPreview.age} años</strong> en la ronda{' '}
                  <strong>{branchPreview.solarRoundLabel}</strong> corresponde a{' '}
                  <strong>{branchPreview.branch}</strong>.
                </>
              )}
            </p>
          </div>
          {branchVisual && (
            <SecBadge tone={branchVisual.tone} dotColor={branchVisual.dotColor} className="self-start sm:self-auto shrink-0">
              {branchVisual.name}
            </SecBadge>
          )}
        </div>
      )}
    </FormSection>
  );
}
