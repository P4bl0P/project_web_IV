import type { CouncilRole } from '../types/conocenos';

export const COUNCIL_ROLES: readonly CouncilRole[] = [
  'Jefatura',
  'Secretaría',
  'Tesorería',
] as const;

export const DEFAULT_ROLE_DESCRIPTIONS: Record<CouncilRole, string> = {
  Jefatura:
    'Coordina la labor educativa y pastoral del grupo, acompaña al equipo de responsables (Kraal) y vela por los valores y la metodología scout en todas las secciones.',
  Secretaría:
    'Gestiona la administración oficial del grupo, el censo, el proceso de admisión y solicitudes, la custodia documental y la comunicación formal con las familias.',
  Tesorería:
    'Administra con transparencia los recursos económicos, presupuestos, cuotas y logística financiera para hacer posibles las actividades y campamentos del grupo.',
};

export const COUNCIL_ROLE_STYLES: Record<
  CouncilRole,
  { badge: string; accentBorder: string; subtleBg: string; dot: string }
> = {
  Jefatura: {
    badge: 'bg-[#000254] text-white border-[#000254]',
    accentBorder: 'border-t-[#000254]',
    subtleBg: 'bg-[#edf3fb]/60',
    dot: 'bg-[#000254]',
  },
  Secretaría: {
    badge: 'bg-[#01317b]/10 text-[#01317b] border-[#01317b]/25',
    accentBorder: 'border-t-[#01317b]',
    subtleBg: 'bg-sky-50/50',
    dot: 'bg-[#01317b]',
  },
  Tesorería: {
    badge: 'bg-rose-50 text-[#e22328] border-rose-200',
    accentBorder: 'border-t-[#e22328]',
    subtleBg: 'bg-rose-50/40',
    dot: 'bg-[#e22328]',
  },
};

export interface CouncilFormValues {
  fullName: string;
  role: CouncilRole;
  personalBio: string;
  displayOrder: string;
}

export type CouncilFormErrors = Partial<Record<keyof CouncilFormValues, string>>;

export function validateCouncilMemberForm(
  values: CouncilFormValues,
): CouncilFormErrors {
  const errors: CouncilFormErrors = {};
  const trimmedName = values.fullName.trim();
  const trimmedBio = values.personalBio.trim();

  if (!trimmedName) {
    errors.fullName = 'El nombre y los apellidos son obligatorios.';
  } else if (trimmedName.length < 2) {
    errors.fullName = 'Introduce al menos 2 caracteres para el nombre.';
  } else if (trimmedName.length > 120) {
    errors.fullName = 'El nombre no puede superar los 120 caracteres.';
  }

  if (!COUNCIL_ROLES.includes(values.role)) {
    errors.role = 'Selecciona un cargo válido del Consejo.';
  }

  if (trimmedBio.length > 500) {
    errors.personalBio = 'La presentación personal no puede superar los 500 caracteres.';
  }

  if (values.displayOrder.trim() !== '') {
    const parsed = Number(values.displayOrder);
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.displayOrder = 'El orden debe ser un número entero mayor o igual que 0.';
    }
  }

  return errors;
}
