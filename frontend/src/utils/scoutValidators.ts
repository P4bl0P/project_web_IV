import type { CreateApplicationPayload, CompleteEnrollmentPayload } from '../services/api';

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[6789]\d{8}$/,
  POSTAL_CODE: /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/,
  DNI: /^[XYZxyz]?\d{7,8}[A-Za-z]$/,
  IBAN: /^ES\d{22}$/i,
};

export type SolicitudFieldErrors = Partial<Record<keyof CreateApplicationPayload, string>>;

export function calculatePreviewBranch(birthDateStr: string): { branch: string; age: number } | null {
  if (!birthDateStr) return null;
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const solarRoundStartYear = currentMonth >= 9 ? currentYear : currentYear - 1;
  const age = solarRoundStartYear - birthDate.getFullYear();

  if (age < 6) return { branch: 'Pre-Castor (< 6 años)', age };
  if (age >= 6 && age <= 7) return { branch: 'Castores (Colonia)', age };
  if (age >= 8 && age <= 10) return { branch: 'Lobatos (Manada)', age };
  if (age >= 11 && age <= 13) return { branch: 'Rangers (Tropa)', age };
  if (age >= 14 && age <= 16) return { branch: 'Pioneros (Escultas)', age };
  if (age >= 17 && age <= 19) return { branch: 'Rutas (Clan)', age };
  return { branch: 'Fuera de rango (> 19 años)', age };
}

export function validateSolicitudForm(
  formData: CreateApplicationPayload,
  showSecondParent: boolean,
): SolicitudFieldErrors {
  const errors: SolicitudFieldErrors = {};

  if (formData.childFirstName.trim().length < 2) errors.childFirstName = 'Mínimo 2 letras.';
  if (formData.childLastName.trim().length < 2) errors.childLastName = 'Introduce los apellidos.';
  if (!formData.childBirthDate) {
    errors.childBirthDate = 'Selecciona la fecha de nacimiento.';
  } else {
    const birth = new Date(formData.childBirthDate);
    const now = new Date();
    if (birth > now) errors.childBirthDate = 'No puede ser una fecha futura.';
    else if (now.getFullYear() - birth.getFullYear() > 22) errors.childBirthDate = 'Supera la edad máxima.';
  }

  if (formData.streetAddress.trim().length < 3) errors.streetAddress = 'Introduce la calle o avenida.';
  if (!REGEX.POSTAL_CODE.test(formData.postalCode.trim())) errors.postalCode = 'CP inválido (5 dígitos).';
  if (!formData.municipality?.trim()) errors.municipality = 'Municipio obligatorio.';
  if (!formData.province?.trim()) errors.province = 'Provincia obligatoria.';

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
    errors.familyMemberDetails = 'Indica el nombre del familiar.';
  }
  if (formData.comesFromOtherGroup && !formData.originGroupDetails?.trim()) {
    errors.originGroupDetails = 'Indica el grupo de procedencia.';
  }

  return errors;
}

export function validateEnrollmentStep(step: number, data: CompleteEnrollmentPayload): string | null {
  if (step === 1) {
    if (!data.streetAddress?.trim() || !data.postalCode?.trim()) {
      return 'Confirma la dirección y el código postal.';
    }
    if (!REGEX.DNI.test(data.parent1Dni.trim())) {
      return 'Introduce un DNI/NIE válido para el Tutor 1 (ej. 12345678A).';
    }
    if (data.custodyType === 'CUSTODIA_CONJUNTA' && !REGEX.DNI.test((data.parent2Dni || '').trim())) {
      return 'Con custodia conjunta, el DNI del segundo tutor es obligatorio.';
    }
    if (data.childDni?.trim() && !REGEX.DNI.test(data.childDni.trim())) {
      return 'El formato del DNI del menor no es válido.';
    }
  }
  if (step === 2 && !data.authorizesEmergency) {
    return 'Debes marcar la autorización médica de urgencia.';
  }
  if (step === 3) {
    if (!data.accountHolderName.trim()) return 'Indica el titular de la cuenta.';
    if (!REGEX.DNI.test(data.accountHolderDni.trim())) return 'DNI del titular inválido.';
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