import type { ChangeEvent, FocusEvent } from 'react';
import { UserPlus, Users } from 'lucide-react';
import type { CreateApplicationPayload } from '../../services/api';
import type { SolicitudFieldErrors } from '../../utils/scoutValidators';
import FormField from '../shared/forms/FormField';
import FormSection from '../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';
import { getSolicitudErrorId, getSolicitudFieldId } from './solicitudForm';

interface Props {
  formData: CreateApplicationPayload;
  fieldErrors: SolicitudFieldErrors;
  validFields?: Partial<Record<keyof CreateApplicationPayload, boolean>>;
  showSecondParent: boolean;
  onToggleSecondParent: (checked: boolean) => void;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function FamilySection({
  formData,
  fieldErrors,
  validFields = {},
  showSecondParent,
  onToggleSecondParent,
  onChange,
  onBlur,
}: Props) {
  const p1FirstNameId = getSolicitudFieldId('parent1FirstName');
  const p1FirstNameErrorId = getSolicitudErrorId('parent1FirstName');
  const p1LastNameId = getSolicitudFieldId('parent1LastName');
  const p1LastNameErrorId = getSolicitudErrorId('parent1LastName');
  const p1PhoneId = getSolicitudFieldId('parent1Phone');
  const p1PhoneErrorId = getSolicitudErrorId('parent1Phone');
  const p1PhoneHintId = `${p1PhoneId}-hint`;
  const p1EmailId = getSolicitudFieldId('parent1Email');
  const p1EmailErrorId = getSolicitudErrorId('parent1Email');

  const p2FirstNameId = getSolicitudFieldId('parent2FirstName');
  const p2LastNameId = getSolicitudFieldId('parent2LastName');
  const p2PhoneId = getSolicitudFieldId('parent2Phone');
  const p2PhoneErrorId = getSolicitudErrorId('parent2Phone');
  const p2EmailId = getSolicitudFieldId('parent2Email');
  const p2EmailErrorId = getSolicitudErrorId('parent2Email');

  return (
    <FormSection className="motion-safe:animate-[reveal_0.55s_cubic-bezier(0.2,0.8,0.2,1)_0.06s_both]">
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#01317b]/[0.08] text-[#01317b]"
            aria-hidden="true"
          >
            <Users size={20} />
          </span>
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#e22328]">
              Sección 2 de 3
            </span>
            <h2 className="mt-0.5 text-base sm:text-lg font-bold tracking-tight text-[#000254]">
              Datos de contacto familiar (Padres o tutores)
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#627089]">
              El domicilio completo, los DNI y el resto de documentación legal se solicitarán únicamente si se oferta plaza.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#000254]">
            Tutor o representante legal principal
          </h3>
          <span className="inline-flex items-center rounded-full border border-[#01317b]/20 bg-[#edf3fb] px-2.5 py-0.5 text-[10px] font-bold text-[#01317b]">
            Obligatorio
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5">
          <FormField
            label="Nombre"
            htmlFor={p1FirstNameId}
            required
            error={fieldErrors.parent1FirstName}
            errorId={p1FirstNameErrorId}
            isValid={Boolean(validFields.parent1FirstName)}
          >
            <input
              id={p1FirstNameId}
              type="text"
              name="parent1FirstName"
              autoComplete="off"
              value={formData.parent1FirstName}
              onChange={onChange}
              onBlur={onBlur}
              aria-invalid={Boolean(fieldErrors.parent1FirstName)}
              aria-describedby={fieldErrors.parent1FirstName ? p1FirstNameErrorId : undefined}
              placeholder="Ej. María"
              className={formInputClass(
                Boolean(fieldErrors.parent1FirstName),
                '',
                Boolean(validFields.parent1FirstName),
              )}
            />
          </FormField>

          <FormField
            label="Apellidos"
            htmlFor={p1LastNameId}
            required
            error={fieldErrors.parent1LastName}
            errorId={p1LastNameErrorId}
            isValid={Boolean(validFields.parent1LastName)}
          >
            <input
              id={p1LastNameId}
              type="text"
              name="parent1LastName"
              autoComplete="off"
              value={formData.parent1LastName}
              onChange={onChange}
              onBlur={onBlur}
              aria-invalid={Boolean(fieldErrors.parent1LastName)}
              aria-describedby={fieldErrors.parent1LastName ? p1LastNameErrorId : undefined}
              placeholder="Ej. Pérez López"
              className={formInputClass(
                Boolean(fieldErrors.parent1LastName),
                '',
                Boolean(validFields.parent1LastName),
              )}
            />
          </FormField>

          <FormField
            label="Teléfono (WhatsApp)"
            htmlFor={p1PhoneId}
            required
            hint="9 dígitos · Canal principal para avisarte si surge plaza."
            hintId={p1PhoneHintId}
            error={fieldErrors.parent1Phone}
            errorId={p1PhoneErrorId}
            isValid={Boolean(validFields.parent1Phone)}
          >
            <input
              id={p1PhoneId}
              type="tel"
              inputMode="tel"
              name="parent1Phone"
              autoComplete="off"
              value={formData.parent1Phone}
              onChange={onChange}
              onBlur={onBlur}
              aria-invalid={Boolean(fieldErrors.parent1Phone)}
              aria-describedby={
                [p1PhoneHintId, fieldErrors.parent1Phone ? p1PhoneErrorId : null]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              placeholder="600112233"
              className={formInputClass(
                Boolean(fieldErrors.parent1Phone),
                '',
                Boolean(validFields.parent1Phone),
              )}
            />
          </FormField>

          <FormField
            label="Correo electrónico"
            htmlFor={p1EmailId}
            required
            hint="Recibirás comunicaciones del proceso si fuese necesario."
            error={fieldErrors.parent1Email}
            errorId={p1EmailErrorId}
            isValid={Boolean(validFields.parent1Email)}
          >
            <input
              id={p1EmailId}
              type="email"
              inputMode="email"
              name="parent1Email"
              autoComplete="off"
              value={formData.parent1Email}
              onChange={onChange}
              onBlur={onBlur}
              aria-invalid={Boolean(fieldErrors.parent1Email)}
              aria-describedby={fieldErrors.parent1Email ? p1EmailErrorId : undefined}
              placeholder="familia@ejemplo.com"
              className={formInputClass(
                Boolean(fieldErrors.parent1Email),
                '',
                Boolean(validFields.parent1Email),
              )}
            />
          </FormField>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <label
          className={`flex items-start sm:items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors duration-150 ${
            showSecondParent
              ? 'border-[#01317b]/25 bg-[#01317b]/[0.03]'
              : 'border-slate-200/85 bg-[#f8f9fc] hover:border-slate-300'
          }`}
        >
          <span className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={showSecondParent}
              onChange={(e) => onToggleSecondParent(e.target.checked)}
              className={formCheckboxClass}
            />
            <span className="text-xs sm:text-sm font-semibold text-[#000254]">
              Añadir segundo progenitor / tutor
              <span className="block text-[11px] font-normal text-[#627089]">
                Opcional · Útil para mantener ambos contactos disponibles en Secretaría.
              </span>
            </span>
          </span>
          <UserPlus
            size={16}
            className={`shrink-0 transition-colors ${
              showSecondParent ? 'text-[#01317b]' : 'text-slate-400'
            }`}
            aria-hidden="true"
          />
        </label>

        {showSecondParent && (
          <div className="mt-3 grid grid-cols-1 gap-4 rounded-xl border border-slate-200/85 bg-[#f8f9fc] p-4 sm:p-5 md:grid-cols-2 animate-sec-expand">
            <FormField
              label="Nombre"
              htmlFor={p2FirstNameId}
              isValid={Boolean(validFields.parent2FirstName)}
            >
              <input
                id={p2FirstNameId}
                type="text"
                name="parent2FirstName"
                autoComplete="off"
                value={formData.parent2FirstName || ''}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Nombre del segundo tutor"
                className={formInputClass(false, '', Boolean(validFields.parent2FirstName))}
              />
            </FormField>

            <FormField
              label="Apellidos"
              htmlFor={p2LastNameId}
              isValid={Boolean(validFields.parent2LastName)}
            >
              <input
                id={p2LastNameId}
                type="text"
                name="parent2LastName"
                autoComplete="off"
                value={formData.parent2LastName || ''}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Apellidos del segundo tutor"
                className={formInputClass(false, '', Boolean(validFields.parent2LastName))}
              />
            </FormField>

            <FormField
              label="Teléfono"
              htmlFor={p2PhoneId}
              error={fieldErrors.parent2Phone}
              errorId={p2PhoneErrorId}
              isValid={Boolean(validFields.parent2Phone)}
            >
              <input
                id={p2PhoneId}
                type="tel"
                inputMode="tel"
                name="parent2Phone"
                autoComplete="off"
                value={formData.parent2Phone || ''}
                onChange={onChange}
                onBlur={onBlur}
                aria-invalid={Boolean(fieldErrors.parent2Phone)}
                aria-describedby={fieldErrors.parent2Phone ? p2PhoneErrorId : undefined}
                placeholder="600112233"
                className={formInputClass(
                  Boolean(fieldErrors.parent2Phone),
                  '',
                  Boolean(validFields.parent2Phone),
                )}
              />
            </FormField>

            <FormField
              label="Correo electrónico"
              htmlFor={p2EmailId}
              error={fieldErrors.parent2Email}
              errorId={p2EmailErrorId}
              isValid={Boolean(validFields.parent2Email)}
            >
              <input
                id={p2EmailId}
                type="email"
                inputMode="email"
                name="parent2Email"
                autoComplete="off"
                value={formData.parent2Email || ''}
                onChange={onChange}
                onBlur={onBlur}
                aria-invalid={Boolean(fieldErrors.parent2Email)}
                aria-describedby={fieldErrors.parent2Email ? p2EmailErrorId : undefined}
                placeholder="segundo.tutor@ejemplo.com"
                className={formInputClass(
                  Boolean(fieldErrors.parent2Email),
                  '',
                  Boolean(validFields.parent2Email),
                )}
              />
            </FormField>
          </div>
        )}
      </div>
    </FormSection>
  );
}
