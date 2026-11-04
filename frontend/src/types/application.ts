export type ScoutBranch = 'CASTOR' | 'LOBATO' | 'RANGER' | 'PIONERO' | 'RUTA';

export type ApplicationStatus = 'PENDING' | 'WAITLIST' | 'ADMITTED' | 'REJECTED';

export interface CreateApplicationPayload {
  requestedBranch: ScoutBranch;
  childName: string;
  childBirthDate: string;
  address: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motivation: string;
  hasFamilyInGroup: boolean;
  fromAnotherGroup: boolean;
  socialInclusion: boolean;
}

export interface ApplicationRecord extends CreateApplicationPayload {
  id: string;
  status: ApplicationStatus;
  requestDate: string;
  councilNotes?: string | null;
}