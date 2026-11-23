import type { CompleteEnrollmentPayload, CreateApplicationPayload } from '../services/api';
import { getTodayIsoDate, parseIsoDate } from './dateUtils';
import { calculateScoutBranchForRound } from './scoutBranch';

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[6789]\d{8}$/,
  POSTAL_CODE: /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/,
  DNI: /^(?:\d{8}|[XYZxyz]\d{7})[A-Za-z]$/,
  IBAN: /^ES\d{22}$/i,
};

export type SolicitudFieldErrors = Partial<Record<keyof CreateApplicationPayload, string>>;

const BRANCH_SUBTITLES: Record<string, string> = {
  Castores: 'Castores (Colonia)',
  Lobatos: 'Lobatos (Manada)',
  Rangers: 'Rangers (Tropa)',
  Pioneros: 'Pioneros (Escultas)',
  Rutas: 'Rutas (Agrupación de Rutas · fuera del grupo)',
  Responsables: 'Responsables (21+ años)',
  'Menor de 6 años': 'Menor de 6 años (fuera de edad mínima)',
};

export function calculatePreviewBranch(birthDateStr: string): {
  branch: string;
  age: number;
  solarRoundLabel: string;
  isEligibleAsYouth: boolean;
  isExternalRutas: boolean;
  isAdultLeader: boolean;
} | null {
  if (!birthDateStr) return null;
  const parsed = parseIsoDate(birthDateStr);
  if (!parsed) return null;

  const calc = calculateScoutBranchForRound(birthDateStr);
  return {
    branch: BRANCH_SUBTITLES[calc.branch] ?? calc.branch,
    age: calc.age,
    solarRoundLabel: calc.solarRound.label,
    isEligibleAsYouth: calc.isEligibleAsYouth,
    isExternalRutas: calc.isExternalRutas,
    isAdultLeader: calc.isAdultLeader,
  };
}

export function validateSolicitudForm(
  formData: CreateApplicationPayload,
  showSecondParent: boolean,
  options: { allowAdultResponsables?: boolean } = {},
): SolicitudFieldErrors {
  const errors: SolicitudFieldErrors = {};

  if (formData.childFirstName.trim().length < 2) {
    errors.childFirstName = 'Mínimo 2 letras.';
  }
  if ((formData.childLastName1 || '').trim().length < 2) {
    errors.childLastName1 = 'Introduce el primer apellido (mín. 2 letras).';
  }
  if (formData.hasNoSecondLastName) {
    if ((formData.noSecondLastNameJustification || '').trim().length < 5) {
      errors.noSecondLastNameJustification =
        'Justifica explícitamente la ausencia de segundo apellido (mín. 5 caracteres).';
    }
  } else if (!(formData.childLastName2 || '').trim()) {
    errors.childLastName2 =
      'El segundo apellido es obligatorio salvo excepción justificada.';
  }

  if (!formData.childBirthDate) {
    errors.childBirthDate = 'Selecciona la fecha de nacimiento.';
  } else {
    const parsed = parseIsoDate(formData.childBirthDate);
    if (!parsed) {
      errors.childBirthDate = 'Selecciona una fecha de nacimiento válida.';
    } else {
      const birthIso = formData.childBirthDate.slice(0, 10);
      const todayIso = getTodayIsoDate();
      if (birthIso > todayIso) {
        errors.childBirthDate = 'No puede ser una fecha futura.';
      } else {
        const calc = calculateScoutBranchForRound(birthIso);
        if (calc.age > 99) {
          errors.childBirthDate = 'Fecha de nacimiento fuera de rango.';
        } else if (calc.age < 6) {
          errors.childBirthDate =
            'La edad mínima para Castores es cumplir 6 años durante la ronda solar.';
        } else if (calc.isExternalRutas) {
          errors.childBirthDate =
            'Las edades de 18 a 20 años corresponden a la Agrupación de Rutas (fuera del Grupo IV).';
        } else if (!options.allowAdultResponsables && calc.isAdultLeader) {
          errors.childBirthDate =
            'A partir de 21 años corresponde a la categoría de Responsables y debe tramitarse con Secretaría.';
        }
      }
    }
  }

  if (formData.parent1FirstName.trim().length < 2) errors.parent1FirstName = 'Nombre obligatorio.';
  if (formData.parent1LastName.trim().length < 2) errors.parent1LastName = 'Apellidos obligatorios.';
  if (!REGEX.PHONE.test(formData.parent1Phone.replace(/\s+/g, ''))) {
    errors.parent1Phone = 'Móvil válido de 9 dígitos.';
  }
  if (!REGEX.EMAIL.test(formData.parent1Email.trim())) errors.parent1Email = 'Email no válido.';

  if (showSecondParent) {
    const cleanP2 = (formData.parent2Phone || '').replace(/\s+/g, '');
    if (cleanP2 && !REGEX.PHONE.test(cleanP2)) errors.parent2Phone = 'Debe tener 9 dígitos.';
    if (formData.parent2Email?.trim() && !REGEX.EMAIL.test(formData.parent2Email.trim())) {
      errors.parent2Email = 'Email no válido.';
    }
  }

  if (formData.hasFamilyInGroup && !formData.familyMemberDetails?.trim()) {
    errors.familyMemberDetails = 'Indica el nombre y parentesco del familiar.';
  }
  if (formData.comesFromOtherGroup && !formData.originGroupDetails?.trim()) {
    errors.originGroupDetails = 'Indica el grupo de procedencia.';
  }

  return errors;
}

export function validateEnrollmentStep(step: number, data: CompleteEnrollmentPayload): string | null {
  if (step === 1) {
    if (data.childFirstName !== undefined && data.childFirstName.trim().length < 2) {
      return 'El nombre del educando debe tener al menos 2 letras.';
    }
    if (data.childLastName1 !== undefined && data.childLastName1.trim().length < 2) {
      return 'El primer apellido del educando es obligatorio.';
    }
    if (data.hasNoSecondLastName) {
      if ((data.noSecondLastNameJustification || '').trim().length < 5) {
        return 'Debes indicar la justificación de ausencia de segundo apellido.';
      }
    } else if (data.childLastName2 !== undefined && !data.childLastName2.trim()) {
      return 'El segundo apellido del educando es obligatorio salvo excepción marcada.';
    }

    if (data.gender !== 'MASCULINO' && data.gender !== 'FEMENINO') {
      return 'Selecciona el género del educando (Masculino o Femenino).';
    }

    if (!data.streetAddress?.trim() || data.streetAddress.trim().length < 3) {
      return 'Introduce la dirección principal completa.';
    }
    if (!REGEX.POSTAL_CODE.test((data.postalCode || '').trim())) {
      return 'Introduce un código postal español válido de 5 dígitos.';
    }
    if (!data.municipality?.trim() || data.municipality.trim().length < 2) {
      return 'La localidad es obligatoria.';
    }
    if (!data.province?.trim() || data.province.trim().length < 2) {
      return 'La provincia es obligatoria.';
    }

    if (data.parent1Phone !== undefined && !REGEX.PHONE.test(data.parent1Phone.replace(/\s+/g, ''))) {
      return 'El teléfono del tutor 1 debe tener 9 dígitos válidos.';
    }
    if (data.parent1Email !== undefined && !REGEX.EMAIL.test(data.parent1Email.trim())) {
      return 'El correo del tutor 1 no es válido.';
    }

    if (!REGEX.DNI.test((data.parent1Dni || '').trim())) {
      return 'Introduce un DNI/NIE válido para el Tutor 1 (ej. 12345678Z).';
    }
    if (
      data.custodyType === 'CUSTODIA_CONJUNTA' &&
      !REGEX.DNI.test((data.parent2Dni || '').trim())
    ) {
      return 'Con custodia conjunta, el DNI del segundo tutor es obligatorio.';
    }
    if (data.parent2Dni?.trim() && !REGEX.DNI.test(data.parent2Dni.trim())) {
      return 'El DNI/NIE del segundo tutor no tiene un formato válido.';
    }

    const cleanChildDni = (data.childDni || '').trim().toUpperCase();
    if (cleanChildDni) {
      if (!REGEX.DNI.test(cleanChildDni)) {
        return 'El formato del DNI/NIE del educando no es válido.';
      }
      const p1 = (data.parent1Dni || '').trim().toUpperCase();
      const p2 = (data.parent2Dni || '').trim().toUpperCase();
      if (cleanChildDni === p1 || (p2 && cleanChildDni === p2)) {
        return 'El DNI del educando no puede coincidir con el DNI de un progenitor o tutor.';
      }
    }
  }

  if (step === 2) {
    if (
      data.emergencyContactPhone?.trim() &&
      !REGEX.PHONE.test(data.emergencyContactPhone.replace(/\s+/g, ''))
    ) {
      return 'El teléfono de emergencia debe tener 9 dígitos válidos.';
    }
    if (!data.authorizesEmergency) {
      return 'Debes marcar la autorización médica de urgencia.';
    }
  }

  if (step === 3) {
    if (!data.accountHolderName.trim()) return 'Indica el titular de la cuenta.';
    if (!REGEX.DNI.test(data.accountHolderDni.trim())) return 'DNI del titular inválido.';
    const cleanChildDni = (data.childDni || '').trim().toUpperCase();
    if (cleanChildDni && cleanChildDni === data.accountHolderDni.trim().toUpperCase()) {
      return 'El DNI del educando no puede coincidir con el DNI del titular bancario.';
    }
    if (
      data.accountHolderPostalCode?.trim() &&
      !REGEX.POSTAL_CODE.test(data.accountHolderPostalCode.trim())
    ) {
      return 'El código postal del titular bancario debe tener 5 dígitos válidos.';
    }
    if (!REGEX.IBAN.test(data.iban.replace(/\s+/g, ''))) {
      return 'El IBAN debe tener 24 caracteres empezando por ES.';
    }
    if (!data.authorizesSepa) return 'Debes aceptar la orden de domiciliación SEPA.';
  }

  if (step === 4) {
    if (!data.acceptsDataStorage || !data.acceptsDataTransfer) {
      return 'Debes aceptar las casillas obligatorias de protección de datos.';
    }
    if (!data.signatureParent1) return 'Falta la firma del Tutor 1.';
    if (data.custodyType === 'CUSTODIA_CONJUNTA' && !data.signatureParent2) {
      return 'Falta la segunda firma obligatoria por Custodia Conjunta.';
    }
  }

  return null;
}
