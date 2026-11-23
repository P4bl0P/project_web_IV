import { BadRequestException } from '@nestjs/common';
import { calculateScoutBranchForRound } from './scout-branch.util';

export const VALIDATION_REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[6789]\d{8}$/,
  POSTAL_CODE: /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/,
  DNI: /^(?:\d{8}|[XYZxyz]\d{7})[A-Za-z]$/,
  IBAN: /^ES\d{22}$/i,
};

export function normalizeTextForSearch(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDigits(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\D/g, '');
}

export function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeDni(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const clean = value.replace(/\s+/g, '').trim().toUpperCase();
  return clean.length > 0 ? clean : null;
}

export function normalizePhone(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\s+/g, '').trim();
}

export function normalizeIban(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\s+/g, '').trim().toUpperCase();
}

export function assertValidDniFormat(dni: string, fieldLabel: string): string {
  const normalized = normalizeDni(dni);
  if (!normalized || !VALIDATION_REGEX.DNI.test(normalized)) {
    throw new BadRequestException(
      `El ${fieldLabel} no tiene un formato DNI/NIE válido (ej. 12345678Z o X1234567L).`,
    );
  }
  return normalized;
}

export interface SurnameResolutionInput {
  childLastName1?: string | null;
  childLastName2?: string | null;
  hasNoSecondLastName?: boolean;
  noSecondLastNameJustification?: string | null;
  childLastName?: string | null;
}

export interface ResolvedSurnames {
  childLastName1: string;
  childLastName2: string | null;
  hasNoSecondLastName: boolean;
  noSecondLastNameJustification: string | null;
  childLastName: string;
}

/**
 * Aplica la regla obligatoria de segundo apellido salvo excepción explícita y justificada.
 * Mantiene compatibilidad si un cliente heredado envía `childLastName` compuesto.
 */
export function resolveAndValidateSurnames(input: SurnameResolutionInput): ResolvedSurnames {
  const hasNoSecond = Boolean(input.hasNoSecondLastName);
  const justification = normalizeOptionalString(input.noSecondLastNameJustification);

  let surname1 = normalizeOptionalString(input.childLastName1);
  let surname2 = normalizeOptionalString(input.childLastName2);

  if (!surname1 && input.childLastName) {
    const collapsed = input.childLastName.trim().replace(/\s+/g, ' ');
    if (collapsed) {
      const firstSpace = collapsed.indexOf(' ');
      if (firstSpace > 0) {
        surname1 = collapsed.slice(0, firstSpace);
        if (!surname2 && !hasNoSecond) {
          surname2 = collapsed.slice(firstSpace + 1).trim();
        }
      } else {
        surname1 = collapsed;
      }
    }
  }

  if (!surname1 || surname1.length < 2) {
    throw new BadRequestException(
      'El primer apellido del educando es obligatorio y debe tener al menos 2 caracteres.',
    );
  }

  if (hasNoSecond) {
    if (!justification || justification.length < 5) {
      throw new BadRequestException(
        'Si el educando no dispone de segundo apellido, debes indicar una justificación explícita (mínimo 5 caracteres).',
      );
    }
    return {
      childLastName1: surname1,
      childLastName2: null,
      hasNoSecondLastName: true,
      noSecondLastNameJustification: justification,
      childLastName: surname1,
    };
  }

  if (!surname2 || surname2.length < 1) {
    throw new BadRequestException(
      'El segundo apellido del educando es obligatorio salvo que se marque y justifique expresamente que no dispone de él.',
    );
  }

  return {
    childLastName1: surname1,
    childLastName2: surname2,
    hasNoSecondLastName: false,
    noSecondLastNameJustification: null,
    childLastName: `${surname1} ${surname2}`.trim(),
  };
}

/**
 * Valida la fecha de nacimiento y la elegibilidad oficial de rama para la ronda solar.
 */
export function validateBirthDateAndBranch(
  birthDateInput: Date | string,
  options: { allowAdultResponsables?: boolean } = {},
) {
  const birth = new Date(birthDateInput);
  if (Number.isNaN(birth.getTime())) {
    throw new BadRequestException('La fecha de nacimiento no es válida.');
  }

  const now = new Date();
  if (birth > now) {
    throw new BadRequestException('La fecha de nacimiento no puede ser futura.');
  }

  const calc = calculateScoutBranchForRound(birthDateInput);
  if (calc.age > 99) {
    throw new BadRequestException('La fecha de nacimiento supera el rango válido.');
  }

  if (calc.age < 6) {
    throw new BadRequestException(
      'El menor no alcanza la edad mínima (6 años durante la ronda solar) para incorporarse a Castores.',
    );
  }

  if (calc.isExternalRutas) {
    throw new BadRequestException(
      'Las edades de 18 a 20 años corresponden a la Agrupación de Rutas, fuera de las ramas gestionadas por el Grupo IV.',
    );
  }

  if (!options.allowAdultResponsables && calc.isAdultLeader) {
    throw new BadRequestException(
      'A partir de los 21 años corresponde a la categoría de Responsables y debe tramitarse desde Secretaría/Kraal.',
    );
  }

  return calc;
}
