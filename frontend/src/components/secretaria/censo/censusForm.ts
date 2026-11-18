import type { ChangeEvent } from 'react';
import type { ApplicantRecord, DirectCensusPayload } from '../../../services/api';
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
  childLastName: '',
  childBirthDate: '',
  gender: 'MASCULINO',
  streetAddress: '',
  streetNumber: '',
  ApartmentDoor: '',
  postalCode: '41089',
  municipality: 'Dos Hermanas',
  province: 'Sevilla',
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
  bloodType: '',
  chronicDiseases: 'Ninguna',
  allergies: 'Ninguna',
  medHeadache: '',
  medFever: '',
  medStomach: '',
  medThroat: '',
  medicalObservations: '',
  authorizesEmergency: true,
  accountHolderName: '',
  accountHolderDni: '',
  iban: 'ES',
  authorizesSepa: true,
  signatureParent1: '',
  signatureParent2: '',
};

export const CENSUS_FIELD_LABELS: Record<string, string> = {
  childFirstName: 'nombre del educando',
  childLastName: 'apellidos del educando',
  childBirthDate: 'fecha de nacimiento',
  streetAddress: 'dirección',
  postalCode: 'código postal',
  municipality: 'municipio',
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
  authorizesEmergency: 'autorización médica de urgencia',
  accountHolderName: 'titular de la cuenta',
  accountHolderDni: 'DNI del titular',
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
    const solicitudErrors = validateSolicitudForm(formData, hasSecondParent) as CensusFieldErrors;
    const fieldErrors: CensusFieldErrors = { ...solicitudErrors };

    if (!formData.streetAddress?.trim() && !fieldErrors.streetAddress) {
      fieldErrors.streetAddress = 'Introduce la calle o avenida.';
    }
    if (!formData.postalCode?.trim() && !fieldErrors.postalCode) {
      fieldErrors.postalCode = 'CP inválido (5 dígitos).';
    }
    if (!REGEX.DNI.test(formData.parent1Dni.trim())) {
      fieldErrors.parent1Dni = 'Introduce un DNI/NIE válido para el Tutor 1 (ej. 12345678A).';
    }
    if (
      formData.custodyType === 'CUSTODIA_CONJUNTA' &&
      !REGEX.DNI.test((formData.parent2Dni || '').trim())
    ) {
      fieldErrors.parent2Dni = 'Con custodia conjunta, el DNI del segundo tutor es obligatorio.';
    }
    if (formData.childDni?.trim() && !REGEX.DNI.test(formData.childDni.trim())) {
      fieldErrors.childDni = 'El formato del DNI del menor no es válido.';
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

export function formFromRecord(record?: ApplicantRecord | null): DirectCensusPayload {
  if (!record) return { ...EMPTY_CENSUS_FORM };
  const enrollment = record.enrollment;

  return {
    ...EMPTY_CENSUS_FORM,
    childFirstName: record.childFirstName,
    childLastName: record.childLastName,
    childBirthDate: record.childBirthDate.slice(0, 10),
    gender: record.gender,
    streetAddress: record.streetAddress,
    streetNumber: record.streetNumber || '',
    ApartmentDoor: record.ApartmentDoor || '',
    postalCode: record.postalCode,
    municipality: record.municipality,
    province: record.province,
    parent1FirstName: record.parent1FirstName,
    parent1LastName: record.parent1LastName,
    parent1Phone: record.parent1Phone,
    parent1Email: record.parent1Email,
    parent2FirstName: record.parent2FirstName || '',
    parent2LastName: record.parent2LastName || '',
    parent2Phone: record.parent2Phone || '',
    parent2Email: record.parent2Email || '',
    motivation: record.motivation || '',
    hasFamilyInGroup: record.hasFamilyInGroup,
    familyMemberDetails: record.familyMemberDetails || '',
    comesFromOtherGroup: record.comesFromOtherGroup,
    originGroupDetails: record.originGroupDetails || '',
    childDni: enrollment?.childDni || '',
    childPhone: enrollment?.childPhone || '',
    childEmail: enrollment?.childEmail || '',
    legalStatus: enrollment?.legalStatus || 'MENOR',
    circularPreference: enrollment?.circularPreference || 'EMAIL',
    parent1Dni: enrollment?.parent1Dni || '',
    parent2Dni: enrollment?.parent2Dni || '',
    parentsMaritalStatus: enrollment?.parentsMaritalStatus || '',
    custodyType: enrollment?.custodyType || 'SIN_ESPECIFICAR',
    acceptsDataStorage: enrollment?.acceptsDataStorage ?? true,
    acceptsDataTransfer: enrollment?.acceptsDataTransfer ?? true,
    authorizesImages: enrollment?.authorizesImages ?? true,
    bloodType: enrollment?.bloodType || '',
    chronicDiseases: enrollment?.chronicDiseases || '',
    allergies: enrollment?.allergies || '',
    medHeadache: enrollment?.medHeadache || '',
    medFever: enrollment?.medFever || '',
    medStomach: enrollment?.medStomach || '',
    medThroat: enrollment?.medThroat || '',
    medicalObservations: enrollment?.medicalObservations || '',
    authorizesEmergency: enrollment?.authorizesEmergency ?? true,
    accountHolderName: enrollment?.accountHolderName || '',
    accountHolderDni: enrollment?.accountHolderDni || '',
    iban: enrollment?.iban || 'ES',
    authorizesSepa: enrollment?.authorizesSepa ?? true,
    signatureParent1: enrollment?.signatureParent1 || '',
    signatureParent2: enrollment?.signatureParent2 || '',
  };
}

export function buildCensusPayload(formData: DirectCensusPayload): DirectCensusPayload {
  return {
    childFirstName: formData.childFirstName.trim(),
    childLastName: formData.childLastName.trim(),
    childBirthDate: formData.childBirthDate,
    gender: formData.gender,
    streetAddress: formData.streetAddress.trim(),
    streetNumber: formData.streetNumber?.trim() || undefined,
    ApartmentDoor: formData.ApartmentDoor?.trim() || undefined,
    postalCode: formData.postalCode.trim(),
    municipality: formData.municipality.trim(),
    province: formData.province.trim(),
    parent1FirstName: formData.parent1FirstName.trim(),
    parent1LastName: formData.parent1LastName.trim(),
    parent1Phone: formData.parent1Phone.replace(/\s+/g, ''),
    parent1Email: formData.parent1Email.trim(),
    parent2FirstName: formData.parent2FirstName?.trim() || undefined,
    parent2LastName: formData.parent2LastName?.trim() || undefined,
    parent2Phone: formData.parent2Phone?.replace(/\s+/g, '') || undefined,
    parent2Email: formData.parent2Email?.trim() || undefined,
    motivation: formData.motivation?.trim() || undefined,
    hasFamilyInGroup: formData.hasFamilyInGroup,
    familyMemberDetails: formData.hasFamilyInGroup ? formData.familyMemberDetails?.trim() : undefined,
    comesFromOtherGroup: formData.comesFromOtherGroup,
    originGroupDetails: formData.comesFromOtherGroup ? formData.originGroupDetails?.trim() : undefined,
    childEmail: formData.childEmail?.trim() || undefined,
    childDni: formData.childDni?.trim().toUpperCase() || undefined,
    childPhone: formData.childPhone?.trim() || undefined,
    legalStatus: formData.legalStatus,
    circularPreference: formData.circularPreference,
    parent1Dni: formData.parent1Dni.trim().toUpperCase(),
    parent2Dni: formData.parent2Dni?.trim().toUpperCase() || undefined,
    parentsMaritalStatus: formData.parentsMaritalStatus?.trim() || undefined,
    custodyType: formData.custodyType,
    acceptsDataStorage: formData.acceptsDataStorage,
    acceptsDataTransfer: formData.acceptsDataTransfer,
    authorizesImages: formData.authorizesImages,
    bloodType: formData.bloodType?.trim() || undefined,
    chronicDiseases: formData.chronicDiseases?.trim() || undefined,
    allergies: formData.allergies?.trim() || undefined,
    medHeadache: formData.medHeadache?.trim() || undefined,
    medFever: formData.medFever?.trim() || undefined,
    medStomach: formData.medStomach?.trim() || undefined,
    medThroat: formData.medThroat?.trim() || undefined,
    medicalObservations: formData.medicalObservations?.trim() || undefined,
    authorizesEmergency: formData.authorizesEmergency,
    accountHolderName: formData.accountHolderName.trim(),
    accountHolderDni: formData.accountHolderDni.trim().toUpperCase(),
    iban: formData.iban.replace(/\s+/g, '').toUpperCase(),
    authorizesSepa: formData.authorizesSepa,
    signatureParent1: formData.signatureParent1,
    signatureParent2: formData.signatureParent2 || undefined,
  };
}
