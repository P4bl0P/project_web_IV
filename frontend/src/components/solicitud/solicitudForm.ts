import type { CreateApplicationPayload } from '../../services/api';
import type { SolicitudFieldErrors } from '../../utils/scoutValidators';

const LEGACY_SOLICITUD_STORAGE_KEYS = [
  'grupo_iv_solicitud_draft_v2',
  'grupo_iv_solicitud_draft',
];

/**
 * Orden visual canónico de los campos del formulario de solicitud.
 * Se utiliza para localizar, desplazar y enfocar el primer campo inválido.
 */
export const SOLICITUD_FIELD_ORDER: Array<keyof CreateApplicationPayload> = [
  'childFirstName',
  'childLastName1',
  'childLastName2',
  'noSecondLastNameJustification',
  'childBirthDate',
  'parent1FirstName',
  'parent1LastName',
  'parent1Phone',
  'parent1Email',
  'parent2FirstName',
  'parent2LastName',
  'parent2Phone',
  'parent2Email',
  'hasFamilyInGroup',
  'familyMemberDetails',
  'comesFromOtherGroup',
  'originGroupDetails',
  'motivation',
];

export const SOLICITUD_FIELD_LABELS: Partial<Record<keyof CreateApplicationPayload, string>> = {
  childFirstName: 'Nombre del educando',
  childLastName1: 'Primer apellido del educando',
  childLastName2: 'Segundo apellido del educando',
  noSecondLastNameJustification: 'Justificación de ausencia de segundo apellido',
  childBirthDate: 'Fecha de nacimiento del educando',
  parent1FirstName: 'Nombre del tutor principal',
  parent1LastName: 'Apellidos del tutor principal',
  parent1Phone: 'Teléfono (WhatsApp) del tutor principal',
  parent1Email: 'Correo electrónico del tutor principal',
  parent2FirstName: 'Nombre del segundo tutor',
  parent2LastName: 'Apellidos del segundo tutor',
  parent2Phone: 'Teléfono del segundo tutor',
  parent2Email: 'Correo electrónico del segundo tutor',
  familyMemberDetails: 'Familiar directo en el Grupo IV',
  originGroupDetails: 'Grupo scout de procedencia',
  motivation: 'Motivación y observaciones',
};

export const SECOND_PARENT_FIELDS: ReadonlySet<keyof CreateApplicationPayload> = new Set([
  'parent2FirstName',
  'parent2LastName',
  'parent2Phone',
  'parent2Email',
]);

export function getSolicitudFieldId(field: keyof CreateApplicationPayload): string {
  return `solicitud-field-${String(field)}`;
}

export function getSolicitudErrorId(field: keyof CreateApplicationPayload): string {
  return `solicitud-error-${String(field)}`;
}

export function createIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createInitialFormState(): CreateApplicationPayload {
  const randomId =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `fam-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    childFirstName: '',
    childLastName1: '',
    childLastName2: '',
    hasNoSecondLastName: false,
    noSecondLastNameJustification: '',
    childBirthDate: '',
    familyUnitId: randomId,
    parent1FirstName: '',
    parent1LastName: '',
    parent1Phone: '',
    parent1Email: '',
    parent2FirstName: '',
    parent2LastName: '',
    parent2Phone: '',
    parent2Email: '',
    motivation: '',
    hasFamilyInGroup: false,
    familyMemberDetails: '',
    comesFromOtherGroup: false,
    originGroupDetails: '',
  };
}

/**
 * Elimina cualquier borrador previo almacenado en el navegador para evitar
 * que reaparezcan datos personales de solicitudes anteriores.
 */
export function clearLegacySolicitudDraftStorage(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_SOLICITUD_STORAGE_KEYS) {
    try {
      window.localStorage?.removeItem(key);
    } catch {
      // Ignorar errores de acceso restringido al almacenamiento
    }
    try {
      window.sessionStorage?.removeItem(key);
    } catch {
      // Ignorar errores de acceso restringido al almacenamiento
    }
  }
}

export function findFirstInvalidSolicitudField(
  errors: SolicitudFieldErrors,
): keyof CreateApplicationPayload | null {
  for (const field of SOLICITUD_FIELD_ORDER) {
    if (errors[field]) {
      return field;
    }
  }
  const fallbackKeys = Object.keys(errors) as Array<keyof CreateApplicationPayload>;
  for (const key of fallbackKeys) {
    if (errors[key]) {
      return key;
    }
  }
  return null;
}

export function getOrderedSolicitudErrors(
  errors: SolicitudFieldErrors,
): Array<{ field: keyof CreateApplicationPayload; label: string; message: string }> {
  const ordered: Array<{ field: keyof CreateApplicationPayload; label: string; message: string }> =
    [];
  const seen = new Set<keyof CreateApplicationPayload>();

  for (const field of SOLICITUD_FIELD_ORDER) {
    const message = errors[field];
    if (message) {
      seen.add(field);
      ordered.push({
        field,
        label: SOLICITUD_FIELD_LABELS[field] ?? String(field),
        message,
      });
    }
  }

  for (const [key, message] of Object.entries(errors) as Array<
    [keyof CreateApplicationPayload, string | undefined]
  >) {
    if (message && !seen.has(key)) {
      ordered.push({
        field: key,
        label: SOLICITUD_FIELD_LABELS[key] ?? String(key),
        message,
      });
    }
  }

  return ordered;
}

export function buildSolicitudSubmissionPayload(
  formData: CreateApplicationPayload,
  showSecondParent: boolean,
  idempotencyKey?: string,
): CreateApplicationPayload {
  const cleanLastName1 = formData.childLastName1.trim();
  const cleanLastName2 = formData.hasNoSecondLastName
    ? undefined
    : formData.childLastName2?.trim() || undefined;

  return {
    childFirstName: formData.childFirstName.trim(),
    childLastName1: cleanLastName1,
    childLastName2: cleanLastName2,
    hasNoSecondLastName: Boolean(formData.hasNoSecondLastName),
    noSecondLastNameJustification: formData.hasNoSecondLastName
      ? formData.noSecondLastNameJustification?.trim()
      : undefined,
    childBirthDate: formData.childBirthDate,
    familyUnitId: formData.familyUnitId,
    parent1FirstName: formData.parent1FirstName.trim(),
    parent1LastName: formData.parent1LastName.trim(),
    parent1Phone: formData.parent1Phone.replace(/\s+/g, ''),
    parent1Email: formData.parent1Email.trim(),
    parent2FirstName: showSecondParent ? formData.parent2FirstName?.trim() || undefined : undefined,
    parent2LastName: showSecondParent ? formData.parent2LastName?.trim() || undefined : undefined,
    parent2Phone:
      showSecondParent && formData.parent2Phone?.trim()
        ? formData.parent2Phone.replace(/\s+/g, '')
        : undefined,
    parent2Email:
      showSecondParent && formData.parent2Email?.trim()
        ? formData.parent2Email.trim()
        : undefined,
    motivation: formData.motivation?.trim() || undefined,
    hasFamilyInGroup: formData.hasFamilyInGroup,
    familyMemberDetails: formData.hasFamilyInGroup
      ? formData.familyMemberDetails?.trim()
      : undefined,
    comesFromOtherGroup: formData.comesFromOtherGroup,
    originGroupDetails: formData.comesFromOtherGroup
      ? formData.originGroupDetails?.trim()
      : undefined,
    idempotencyKey,
  };
}
