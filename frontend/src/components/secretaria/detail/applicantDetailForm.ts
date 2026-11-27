import type { ApplicantRecord, ApplicationStatus } from '../../../services/api';

export type DetailTab = 'expediente' | 'inscripcion' | 'historial';

export type LifecycleActionType =
  | 'VALIDATE'
  | 'OFFER_SPOT'
  | 'RENEW_TOKEN'
  | 'RETURN_WAITLIST'
  | 'MARK_REVIEWED'
  | 'ADMIT_CENSUS'
  | 'DEACTIVATE'
  | 'REACTIVATE'
  | 'DELETE';

export const EDITABLE_PHASE1_STATUSES = new Set<ApplicationStatus>([
  'PENDIENTE_REVISION',
  'LISTA_ESPERA',
  'PLAZA_OFERTADA',
]);

export const WORKFLOW_STEPS: { status: ApplicationStatus; label: string }[] = [
  { status: 'PENDIENTE_REVISION', label: '1. Solicitud' },
  { status: 'LISTA_ESPERA', label: '2. Lista espera' },
  { status: 'PLAZA_OFERTADA', label: '3. Plaza ofertada' },
  { status: 'INSCRIPCION_COMPLETADA', label: '4. Inscripción' },
  { status: 'CENSADO', label: '5. Censo oficial' },
];

export const RELATIONSHIP_OPTIONS = [
  'Madre',
  'Padre',
  'Tutor/a legal',
  'Representante legal',
  'Otro familiar autorizado',
];

export interface UnifiedFormState {
  childFirstName: string;
  childLastName1: string;
  childLastName2: string;
  hasNoSecondLastName: boolean;
  noSecondLastNameJustification: string;
  childBirthDate: string;
  gender: 'MASCULINO' | 'FEMENINO' | '';
  streetAddress: string;
  streetNumber: string;
  apartmentDoor: string;
  postalCode: string;
  municipality: string;
  province: string;
  parent1FirstName: string;
  parent1LastName: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Relationship: string;
  parent2FirstName: string;
  parent2LastName: string;
  parent2Phone: string;
  parent2Email: string;
  parent2Relationship: string;
  motivation: string;
  hasFamilyInGroup: boolean;
  familyMemberDetails: string;
  comesFromOtherGroup: boolean;
  originGroupDetails: string;
  socialInclusionPriority: boolean;
  kraalInternalNotes: string;
  childDni: string;
  childPhone: string;
  childEmail: string;
  legalStatus: 'MENOR' | 'MAYOR' | 'EMANCIPADO';
  circularPreference: 'EMAIL' | 'CORREO_POSTAL';
  parent1Dni: string;
  parent2Dni: string;
  parentsMaritalStatus: string;
  custodyType: 'SIN_ESPECIFICAR' | 'TUTELA_LEGAL' | 'CUSTODIA_UNICA' | 'CUSTODIA_CONJUNTA';
  bloodType: string;
  chronicDiseases: string;
  allergies: string;
  medHeadache: string;
  medFever: string;
  medStomach: string;
  medThroat: string;
  medicalObservations: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  authorizesEmergency: boolean;
  accountHolderName: string;
  accountHolderDni: string;
  accountHolderAddress: string;
  accountHolderMunicipality: string;
  accountHolderPostalCode: string;
  iban: string;
  authorizesSepa: boolean;
}

export function buildInitialForm(loaded: ApplicantRecord): UnifiedFormState {
  const enr = loaded.enrollment;
  return {
    childFirstName: loaded.childFirstName || '',
    childLastName1: loaded.childLastName1 || '',
    childLastName2: loaded.childLastName2 || '',
    hasNoSecondLastName: Boolean(loaded.hasNoSecondLastName),
    noSecondLastNameJustification: loaded.noSecondLastNameJustification || '',
    childBirthDate: loaded.childBirthDate ? loaded.childBirthDate.slice(0, 10) : '',
    gender:
      loaded.gender === 'MASCULINO' || loaded.gender === 'FEMENINO' ? loaded.gender : '',
    streetAddress: loaded.streetAddress || '',
    streetNumber: loaded.streetNumber || '',
    apartmentDoor: loaded.apartmentDoor ?? loaded.ApartmentDoor ?? '',
    postalCode: loaded.postalCode || '',
    municipality: loaded.municipality || '',
    province: loaded.province || '',
    parent1FirstName: loaded.parent1FirstName || '',
    parent1LastName: loaded.parent1LastName || '',
    parent1Phone: loaded.parent1Phone || '',
    parent1Email: loaded.parent1Email || '',
    parent1Relationship: loaded.parent1Relationship || '',
    parent2FirstName: loaded.parent2FirstName || '',
    parent2LastName: loaded.parent2LastName || '',
    parent2Phone: loaded.parent2Phone || '',
    parent2Email: loaded.parent2Email || '',
    parent2Relationship: loaded.parent2Relationship || '',
    motivation: loaded.motivation || '',
    hasFamilyInGroup: Boolean(loaded.hasFamilyInGroup),
    familyMemberDetails: loaded.familyMemberDetails || '',
    comesFromOtherGroup: Boolean(loaded.comesFromOtherGroup),
    originGroupDetails: loaded.originGroupDetails || '',
    socialInclusionPriority: Boolean(loaded.socialInclusionPriority),
    kraalInternalNotes: loaded.kraalInternalNotes || '',
    childDni: enr?.childDni || '',
    childPhone: enr?.childPhone || '',
    childEmail: enr?.childEmail || '',
    legalStatus: enr?.legalStatus || 'MENOR',
    circularPreference: enr?.circularPreference || 'EMAIL',
    parent1Dni: enr?.parent1Dni || '',
    parent2Dni: enr?.parent2Dni || '',
    parentsMaritalStatus: enr?.parentsMaritalStatus || '',
    custodyType: enr?.custodyType || 'SIN_ESPECIFICAR',
    bloodType: enr?.bloodType || '',
    chronicDiseases: enr?.chronicDiseases || '',
    allergies: enr?.allergies || '',
    medHeadache: enr?.medHeadache || '',
    medFever: enr?.medFever || '',
    medStomach: enr?.medStomach || '',
    medThroat: enr?.medThroat || '',
    medicalObservations: enr?.medicalObservations || '',
    emergencyContactName: enr?.emergencyContactName || '',
    emergencyContactPhone: enr?.emergencyContactPhone || '',
    emergencyContactRelationship: enr?.emergencyContactRelationship || '',
    authorizesEmergency: enr?.authorizesEmergency ?? true,
    accountHolderName: enr?.accountHolderName || '',
    accountHolderDni: enr?.accountHolderDni || '',
    accountHolderAddress: enr?.accountHolderAddress || '',
    accountHolderMunicipality: enr?.accountHolderMunicipality || '',
    accountHolderPostalCode: enr?.accountHolderPostalCode || '',
    iban: enr?.iban || '',
    authorizesSepa: enr?.authorizesSepa ?? true,
  };
}

export function optionalOrNull(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
