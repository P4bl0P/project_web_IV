import type { ChangeEvent } from 'react';
import type { DirectCensusPayload } from '../../../services/api';
import {
  REGEX,
  validateEnrollmentStep,
  validateSolicitudForm,
} from '../../../utils/scoutValidators';

export type CensusChangeHandler = (
  event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
) => void;

export type CensusFieldErrors = Record<string, string>;

export const CENSUS_STEP_NUMBERS = [1, 2, 3, 4] as const;
export type CensusStepNumber = (typeof CENSUS_STEP_NUMBERS)[number];

export interface CensusStepValidationResult {
  step: CensusStepNumber;
  message: string | null;
  fieldErrors: CensusFieldErrors;
  isValid: boolean;
}

export const EMPTY_CENSUS_FORM: DirectCensusPayload = {
  childFirstName: '',
  childLastName1: '',
  childLastName2: '',
  hasNoSecondLastName: false,
  noSecondLastNameJustification: '',
  childBirthDate: '',
  gender: '',
  streetAddress: '',
  streetNumber: '',
  apartmentDoor: '',
  postalCode: '',
  municipality: '',
  province: '',
  parent1FirstName: '',
  parent1LastName: '',
  parent1Phone: '',
  parent1Email: '',
  parent1Relationship: '',
  parent2FirstName: '',
  parent2LastName: '',
  parent2Phone: '',
  parent2Email: '',
  parent2Relationship: '',
  motivation: '',
  hasFamilyInGroup: false,
  familyMemberDetails: '',
  comesFromOtherGroup: false,
  originGroupDetails: '',
  childDni: '',
  childPhone: '',
  childEmail: '',
  legalStatus: 'MENOR',
  circularPreference: 'EMAIL',
  parent1Dni: '',
  parent2Dni: '',
  parentsMaritalStatus: '',
  custodyType: 'SIN_ESPECIFICAR',
  acceptsDataStorage: true,
  acceptsDataTransfer: true,
  authorizesImages: true,
  consentTextVersion: '2026.1',
  bloodType: '',
  chronicDiseases: '',
  allergies: '',
  medHeadache: '',
  medFever: '',
  medStomach: '',
  medThroat: '',
  medicalObservations: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  authorizesEmergency: true,
  accountHolderName: '',
  accountHolderDni: '',
  accountHolderAddress: '',
  accountHolderMunicipality: '',
  accountHolderPostalCode: '',
  iban: '',
  authorizesSepa: true,
  signatureParent1: '',
  signatureParent2: '',
};

export const CENSUS_FIELD_LABELS: Record<string, string> = {
  childFirstName: 'nombre del educando',
  childLastName1: 'primer apellido',
  childLastName2: 'segundo apellido',
  noSecondLastNameJustification: 'justificación de segundo apellido',
  childBirthDate: 'fecha de nacimiento',
  gender: 'género',
  streetAddress: 'dirección',
  postalCode: 'código postal',
  municipality: 'localidad',
  province: 'provincia',
  parent1FirstName: 'nombre del tutor 1',
  parent1LastName: 'apellidos del tutor 1',
  parent1Phone: 'teléfono del tutor 1',
  parent1Email: 'email del tutor 1',
  parent2Phone: 'teléfono del tutor 2',
  parent2Email: 'email del tutor 2',
  familyMemberDetails: 'familiar en el grupo',
  originGroupDetails: 'grupo de procedencia',
  parent1Dni: 'DNI del tutor 1',
  parent2Dni: 'DNI del tutor 2',
  childDni: 'DNI del educando',
  emergencyContactPhone: 'teléfono de emergencia',
  authorizesEmergency: 'autorización médica de urgencia',
  accountHolderName: 'titular de la cuenta',
  accountHolderDni: 'DNI del titular',
  accountHolderPostalCode: 'código postal del titular',
  iban: 'IBAN',
  authorizesSepa: 'autorización de domiciliación SEPA',
  acceptsDataStorage: 'consentimiento de protección de datos',
  acceptsDataTransfer: 'cesión federativa a MSC',
  signatureParent1: 'firma del tutor 1',
  signatureParent2: 'firma del tutor 2',
};

export function validateCensusStep(
  step: CensusStepNumber,
  formData: DirectCensusPayload,
  showSecondParent?: boolean,
): CensusStepValidationResult {
  const hasSecondParent =
    showSecondParent ??
    Boolean(formData.parent2FirstName || formData.parent2Phone || formData.parent2Email);

  if (step === 1) {
    const solicitudErrors = validateSolicitudForm(formData, hasSecondParent, {
      allowAdultResponsables: true,
    }) as CensusFieldErrors;
    const fieldErrors: CensusFieldErrors = { ...solicitudErrors };

    if (formData.gender !== 'MASCULINO' && formData.gender !== 'FEMENINO') {
      fieldErrors.gender = 'Selecciona Masculino o Femenino.';
    }
    if (!formData.streetAddress?.trim() || formData.streetAddress.trim().length < 3) {
      fieldErrors.streetAddress = 'Introduce la calle o avenida.';
    }
    if (!REGEX.POSTAL_CODE.test((formData.postalCode || '').trim())) {
      fieldErrors.postalCode = 'CP inválido (5 dígitos).';
    }
    if (!formData.municipality?.trim()) {
      fieldErrors.municipality = 'Localidad obligatoria.';
    }
    if (!formData.province?.trim()) {
      fieldErrors.province = 'Provincia obligatoria.';
    }
    if (!REGEX.DNI.test((formData.parent1Dni || '').trim())) {
      fieldErrors.parent1Dni = 'Introduce un DNI/NIE válido para el Tutor 1 (ej. 12345678Z).';
    }
    if (
      formData.custodyType === 'CUSTODIA_CONJUNTA' &&
      !REGEX.DNI.test((formData.parent2Dni || '').trim())
    ) {
      fieldErrors.parent2Dni = 'Con custodia conjunta, el DNI del segundo tutor es obligatorio.';
    }
    if (formData.childDni?.trim()) {
      if (!REGEX.DNI.test(formData.childDni.trim())) {
        fieldErrors.childDni = 'El formato del DNI del educando no es válido.';
      } else if (
        formData.childDni.trim().toUpperCase() === formData.parent1Dni.trim().toUpperCase() ||
        (formData.parent2Dni &&
          formData.childDni.trim().toUpperCase() === formData.parent2Dni.trim().toUpperCase())
      ) {
        fieldErrors.childDni = 'El DNI del educando no puede coincidir con el de un tutor.';
      }
    }

    const enrollmentError = validateEnrollmentStep(1, formData);
    const message =
      Object.keys(solicitudErrors).length > 0
        ? 'Revisa los datos personales y de contacto.'
        : enrollmentError;

    return {
      step: 1,
      message,
      fieldErrors,
      isValid: message === null && Object.keys(fieldErrors).length === 0,
    };
  }

  if (step === 2) {
    const fieldErrors: CensusFieldErrors = {};
    const enrollmentError = validateEnrollmentStep(2, formData);
    if (
      formData.emergencyContactPhone?.trim() &&
      !REGEX.PHONE.test(formData.emergencyContactPhone.replace(/\s+/g, ''))
    ) {
      fieldErrors.emergencyContactPhone = 'Teléfono de emergencia inválido (9 dígitos).';
    }
    if (!formData.authorizesEmergency) {
      fieldErrors.authorizesEmergency = 'Debes marcar la autorización médica de urgencia.';
    }
    return {
      step: 2,
      message: enrollmentError,
      fieldErrors,
      isValid: enrollmentError === null && Object.keys(fieldErrors).length === 0,
    };
  }

  if (step === 3) {
    const fieldErrors: CensusFieldErrors = {};
    const enrollmentError = validateEnrollmentStep(3, formData);
    if (!formData.accountHolderName.trim()) {
      fieldErrors.accountHolderName = 'Indica el titular de la cuenta.';
    }
    if (!REGEX.DNI.test(formData.accountHolderDni.trim())) {
      fieldErrors.accountHolderDni = 'DNI del titular inválido.';
    }
    if (
      formData.accountHolderPostalCode?.trim() &&
      !REGEX.POSTAL_CODE.test(formData.accountHolderPostalCode.trim())
    ) {
      fieldErrors.accountHolderPostalCode = 'CP inválido (5 dígitos).';
    }
    if (!REGEX.IBAN.test(formData.iban.replace(/\s+/g, ''))) {
      fieldErrors.iban = 'El IBAN debe tener 24 caracteres empezando por ES.';
    }
    if (!formData.authorizesSepa) {
      fieldErrors.authorizesSepa = 'Debes aceptar la orden de domiciliación SEPA.';
    }
    return {
      step: 3,
      message: enrollmentError,
      fieldErrors,
      isValid: enrollmentError === null && Object.keys(fieldErrors).length === 0,
    };
  }

  const fieldErrors: CensusFieldErrors = {};
  const enrollmentError = validateEnrollmentStep(4, formData);
  if (!formData.acceptsDataStorage) {
    fieldErrors.acceptsDataStorage = 'Debes aceptar el tratamiento de datos personales.';
  }
  if (!formData.acceptsDataTransfer) {
    fieldErrors.acceptsDataTransfer = 'Debes aceptar la cesión federativa a MSC.';
  }
  if (!formData.signatureParent1) {
    fieldErrors.signatureParent1 = 'Falta la firma del Tutor 1.';
  }
  if (formData.custodyType === 'CUSTODIA_CONJUNTA' && !formData.signatureParent2) {
    fieldErrors.signatureParent2 = 'Falta la segunda firma obligatoria por Custodia Conjunta.';
  }
  return {
    step: 4,
    message: enrollmentError,
    fieldErrors,
    isValid: enrollmentError === null && Object.keys(fieldErrors).length === 0,
  };
}

export function validateAllCensusSteps(
  formData: DirectCensusPayload,
  showSecondParent?: boolean,
): Record<CensusStepNumber, CensusStepValidationResult> {
  return {
    1: validateCensusStep(1, formData, showSecondParent),
    2: validateCensusStep(2, formData, showSecondParent),
    3: validateCensusStep(3, formData, showSecondParent),
    4: validateCensusStep(4, formData, showSecondParent),
  };
}

export function findFirstInvalidCensusStep(
  validations: Record<CensusStepNumber, CensusStepValidationResult>,
): CensusStepValidationResult | null {
  for (const stepNumber of CENSUS_STEP_NUMBERS) {
    if (!validations[stepNumber].isValid) {
      return validations[stepNumber];
    }
  }
  return null;
}

export function buildCensusPayload(formData: DirectCensusPayload): DirectCensusPayload {
  return {
    childFirstName: formData.childFirstName.trim(),
    childLastName1: formData.childLastName1.trim(),
    childLastName2: formData.hasNoSecondLastName
      ? undefined
      : formData.childLastName2?.trim() || undefined,
    hasNoSecondLastName: Boolean(formData.hasNoSecondLastName),
    noSecondLastNameJustification: formData.hasNoSecondLastName
      ? formData.noSecondLastNameJustification?.trim() || undefined
      : undefined,
    childBirthDate: formData.childBirthDate,
    gender: formData.gender as 'MASCULINO' | 'FEMENINO',
    streetAddress: formData.streetAddress.trim(),
    streetNumber: formData.streetNumber?.trim() || undefined,
    apartmentDoor: formData.apartmentDoor?.trim() || undefined,
    postalCode: formData.postalCode.trim(),
    municipality: formData.municipality.trim(),
    province: formData.province.trim(),
    parent1FirstName: formData.parent1FirstName.trim(),
    parent1LastName: formData.parent1LastName.trim(),
    parent1Phone: formData.parent1Phone.replace(/\s+/g, ''),
    parent1Email: formData.parent1Email.trim(),
    parent1Relationship: formData.parent1Relationship?.trim() || undefined,
    parent2FirstName: formData.parent2FirstName?.trim() || undefined,
    parent2LastName: formData.parent2LastName?.trim() || undefined,
    parent2Phone: formData.parent2Phone?.replace(/\s+/g, '') || undefined,
    parent2Email: formData.parent2Email?.trim() || undefined,
    parent2Relationship: formData.parent2Relationship?.trim() || undefined,
    motivation: formData.motivation?.trim() || undefined,
    hasFamilyInGroup: formData.hasFamilyInGroup,
    familyMemberDetails: formData.hasFamilyInGroup
      ? formData.familyMemberDetails?.trim()
      : undefined,
    comesFromOtherGroup: formData.comesFromOtherGroup,
    originGroupDetails: formData.comesFromOtherGroup
      ? formData.originGroupDetails?.trim()
      : undefined,
    childEmail: formData.childEmail?.trim() || undefined,
    childDni: formData.childDni?.trim().toUpperCase() || undefined,
    childPhone: formData.childPhone?.replace(/\s+/g, '') || undefined,
    legalStatus: formData.legalStatus,
    circularPreference: formData.circularPreference,
    parent1Dni: formData.parent1Dni.trim().toUpperCase(),
    parent2Dni: formData.parent2Dni?.trim().toUpperCase() || undefined,
    parentsMaritalStatus: formData.parentsMaritalStatus?.trim() || undefined,
    custodyType: formData.custodyType,
    acceptsDataStorage: formData.acceptsDataStorage,
    acceptsDataTransfer: formData.acceptsDataTransfer,
    authorizesImages: formData.authorizesImages,
    consentTextVersion: formData.consentTextVersion || '2026.1',
    bloodType: formData.bloodType?.trim() || undefined,
    chronicDiseases: formData.chronicDiseases?.trim() || undefined,
    allergies: formData.allergies?.trim() || undefined,
    medHeadache: formData.medHeadache?.trim() || undefined,
    medFever: formData.medFever?.trim() || undefined,
    medStomach: formData.medStomach?.trim() || undefined,
    medThroat: formData.medThroat?.trim() || undefined,
    medicalObservations: formData.medicalObservations?.trim() || undefined,
    emergencyContactName: formData.emergencyContactName?.trim() || undefined,
    emergencyContactPhone: formData.emergencyContactPhone?.replace(/\s+/g, '') || undefined,
    emergencyContactRelationship: formData.emergencyContactRelationship?.trim() || undefined,
    authorizesEmergency: formData.authorizesEmergency,
    accountHolderName: formData.accountHolderName.trim(),
    accountHolderDni: formData.accountHolderDni.trim().toUpperCase(),
    accountHolderAddress: formData.accountHolderAddress?.trim() || undefined,
    accountHolderMunicipality: formData.accountHolderMunicipality?.trim() || undefined,
    accountHolderPostalCode: formData.accountHolderPostalCode?.trim() || undefined,
    iban: formData.iban.replace(/\s+/g, '').toUpperCase(),
    authorizesSepa: formData.authorizesSepa,
    signatureParent1: formData.signatureParent1,
    signatureParent2: formData.signatureParent2 || undefined,
  };
}
