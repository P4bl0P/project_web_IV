import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type {
  CouncilMember,
  CouncilRole,
  CreateCouncilMemberPayload,
  UpdateCouncilMemberPayload,
} from '../../types/conocenos';
import {
  COUNCIL_ROLES,
  DEFAULT_ROLE_DESCRIPTIONS,
  validateCouncilMemberForm,
  type CouncilFormErrors,
  type CouncilFormValues,
} from '../../utils/councilValidators';
import { useLockBodyScroll } from '../../utils/useLockBodyScroll';
import { SecButton } from '../secretaria/secretariaTheme';
import FormAlert from '../shared/forms/FormAlert';
import FormField from '../shared/forms/FormField';
import { formInputClass } from '../shared/forms/formStyles';

interface Props {
  member: CouncilMember | null;
  availableRoles: CouncilRole[];
  roleDescriptions: Record<CouncilRole, string>;
  nextDefaultOrder: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateCouncilMemberPayload | UpdateCouncilMemberPayload,
    editingId?: string,
  ) => Promise<void>;
}

export default function CouncilMemberFormModal({
  member,
  availableRoles,
  roleDescriptions,
  nextDefaultOrder,
  saving,
  onClose,
  onSubmit,
}: Props) {
  useLockBodyScroll();

  const isEditing = Boolean(member);
  const rolesList = availableRoles.length ? availableRoles : [...COUNCIL_ROLES];

  const [values, setValues] = useState<CouncilFormValues>({
    fullName: member?.fullName ?? '',
    role: member?.role ?? rolesList[0],
    personalBio: member?.personalBio ?? '',
    displayOrder: String(member ? member.displayOrder : nextDefaultOrder),
  });
  const [errors, setErrors] = useState<CouncilFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateCouncilMemberForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const parsedOrder =
      values.displayOrder.trim() === ''
        ? undefined
        : Number(values.displayOrder.trim());
    const trimmedBio = values.personalBio.trim();

    try {
      if (member) {
        const updatePayload: UpdateCouncilMemberPayload = {
          fullName: values.fullName.trim(),
          role: values.role,
          personalBio: trimmedBio ? trimmedBio : '',
          displayOrder: parsedOrder,
        };
        await onSubmit(updatePayload, member.id);
      } else {
        const createPayload: CreateCouncilMemberPayload = {
          fullName: values.fullName.trim(),
          role: values.role,
          ...(trimmedBio ? { personalBio: trimmedBio } : {}),
          ...(parsedOrder !== undefined ? { displayOrder: parsedOrder } : {}),
        };
        await onSubmit(createPayload);
      }
      onClose();
    } catch (reason) {
      setSubmitError(
        reason instanceof Error ? reason.message : 'No se pudieron guardar los cambios.',
      );
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 m-0 h-dvh w-screen overflow-hidden overscroll-none bg-[#0c1933]/45 backdrop-blur-md p-4 flex items-center justify-center animate-sec-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="council-modal-title"
    >
      <div className="relative w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-[24px] border border-white/80 bg-[#f8f9fc] shadow-[0_24px_64px_-12px_rgba(0,2,84,0.22)] animate-sec-modal">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-6 py-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#e22328]">
              Consejo de Grupo
            </span>
            <h2 id="council-modal-title" className="text-lg font-bold text-[#000254]">
              {isEditing ? 'Editar integrante' : 'Añadir integrante'}
            </h2>
          </div>
          <SecButton
            variant="secondary"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar formulario"
          >
            <X size={16} />
          </SecButton>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {submitError && <FormAlert>{submitError}</FormAlert>}

          <FormField label="Nombre y apellidos" required error={errors.fullName}>
            <input
              type="text"
              value={values.fullName}
              onChange={(event) => {
                setValues((prev) => ({ ...prev, fullName: event.target.value }));
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Ej. Laura Gómez Martínez"
              className={formInputClass(Boolean(errors.fullName))}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Cargo en el Consejo" required error={errors.role}>
              <select
                value={values.role}
                onChange={(event) => {
                  const nextRole = event.target.value as CouncilRole;
                  setValues((prev) => ({ ...prev, role: nextRole }));
                  if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                }}
                className={formInputClass(Boolean(errors.role))}
              >
                {rolesList.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Orden de aparición"
              hint="0 aparece primero"
              error={errors.displayOrder}
            >
              <input
                type="number"
                min={0}
                step={1}
                value={values.displayOrder}
                onChange={(event) => {
                  setValues((prev) => ({ ...prev, displayOrder: event.target.value }));
                  if (errors.displayOrder)
                    setErrors((prev) => ({ ...prev, displayOrder: undefined }));
                }}
                className={formInputClass(Boolean(errors.displayOrder))}
              />
            </FormField>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-600">
            <span className="font-bold text-[#000254]">
              Descripción compartida de {values.role}:
            </span>{' '}
            {roleDescriptions[values.role] ?? DEFAULT_ROLE_DESCRIPTIONS[values.role]}
          </div>

          <FormField
            label="Presentación personal (opcional)"
            hint="Máximo 500 caracteres. Puede dejarse en blanco."
            error={errors.personalBio}
          >
            <textarea
              rows={3}
              maxLength={500}
              value={values.personalBio}
              onChange={(event) => {
                setValues((prev) => ({ ...prev, personalBio: event.target.value }));
                if (errors.personalBio)
                  setErrors((prev) => ({ ...prev, personalBio: undefined }));
              }}
              placeholder="Breve presentación personal o trayectoria en el grupo..."
              className={formInputClass(Boolean(errors.personalBio), 'resize-y')}
            />
          </FormField>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80">
            <SecButton variant="secondary" size="md" onClick={onClose} disabled={saving}>
              Cancelar
            </SecButton>
            <SecButton type="submit" variant="primary" size="md" disabled={saving}>
              {saving
                ? 'Guardando…'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Añadir al Consejo'}
            </SecButton>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
