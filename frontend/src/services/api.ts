const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type ApplicationStatus =
  | 'PENDIENTE_REVISION'
  | 'LISTA_ESPERA'
  | 'PLAZA_OFERTADA'
  | 'INSCRIPCION_COMPLETADA'
  | 'CENSADO'
  | 'BAJA';

export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface CreateApplicationPayload {
  childFirstName: string;
  childLastName: string;
  childBirthDate: string;
  gender: Gender;
  streetAddress: string;
  streetNumber?: string;
  ApartmentDoor?: string;
  postalCode: string;
  municipality: string;
  province: string;
  parent1FirstName: string;
  parent1LastName: string;
  parent1Phone: string;
  parent1Email: string;
  parent2FirstName?: string;
  parent2LastName?: string;
  parent2Phone?: string;
  parent2Email?: string;
  motivation?: string;
  hasFamilyInGroup: boolean;
  familyMemberDetails?: string;
  comesFromOtherGroup: boolean;
  originGroupDetails?: string;
}

export interface ApplicantRecord extends CreateApplicationPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  socialInclusionPriority: boolean;
  kraalInternalNotes?: string | null;
  enrollmentToken?: string | null;
  tokenExpiresAt?: string | null;
  admittedAt?: string | null;
  calculatedBranch: string;
  currentAge: number;
  priorityScore: number;
  enrollment?: Record<string, unknown> | null;
}

export interface UpdateApplicationPayload {
  status?: ApplicationStatus;
  socialInclusionPriority?: boolean;
  kraalInternalNotes?: string;
}

export const applicationsApi = {
  // Fase 1: Enviar solicitud pública
  async submitApplication(data: CreateApplicationPayload): Promise<ApplicantRecord> {
    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = Array.isArray(errorData.message)
        ? errorData.message.join(' · ')
        : errorData.message;
      throw new Error(msg || 'Error al enviar la solicitud. Revisa los datos.');
    }

    return response.json();
  },

  // Fase 4: Obtener todas las solicitudes y miembros
  async getAll(): Promise<ApplicantRecord[]> {
    const response = await fetch(`${API_URL}/applications`);
    if (!response.ok) {
      throw new Error('No se pudieron cargar las solicitudes del servidor.');
    }
    return response.json();
  },

  // Fase 4: Actualizar estado, prioridad de inclusión o notas del Kraal
  async update(id: string, data: UpdateApplicationPayload): Promise<ApplicantRecord> {
    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar el registro.');
    }
    return response.json();
  },

  // Fase 4: Ofertar plaza y generar enlace mágico (+7 días)
  async offerSpot(id: string): Promise<ApplicantRecord> {
    const response = await fetch(`${API_URL}/applications/${id}/offer-spot`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error('Error al ofertar la plaza y generar el enlace mágico.');
    }
    return response.json();
  },

  // Fase 4: Eliminar registro
  async remove(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar la solicitud.');
    }
  },

  // Fase 5: Obtener datos del enlace mágico (para padres)
  async getByMagicToken(token: string): Promise<ApplicantRecord> {
    const response = await fetch(`${API_URL}/applications/magic/${token}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 'El enlace de inscripción no es válido o ha caducado.',
      );
    }
    return response.json();
  },

  // Fase 5: Enviar inscripción definitiva desde el enlace mágico
  async submitMagicEnrollment(
    token: string,
    data: CompleteEnrollmentPayload,
  ): Promise<ApplicantRecord> {
    const response = await fetch(`${API_URL}/applications/magic/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = Array.isArray(errorData.message)
        ? errorData.message.join(' · ')
        : errorData.message;
      throw new Error(msg || 'Error al guardar la inscripción.');
    }
    return response.json();
  },
};

export interface CompleteEnrollmentPayload {
  // Posibles correcciones de Fase 1
  streetAddress?: string;
  streetNumber?: string;
  ApartmentDoor?: string;
  postalCode?: string;
  municipality?: string;
  province?: string;
  parent1Phone?: string;
  parent1Email?: string;
  parent2Phone?: string;
  parent2Email?: string;

  // Hoja 1: Datos legales y DNI
  childDni?: string;
  childPhone?: string;
  childEmail?: string;
  legalStatus: 'MENOR' | 'MAYOR' | 'EMANCIPADO';
  circularPreference: 'EMAIL' | 'CORREO_POSTAL';
  parent1Dni: string;
  parent2Dni?: string;
  parentsMaritalStatus?: string;
  custodyType: 'SIN_ESPECIFICAR' | 'TUTELA_LEGAL' | 'CUSTODIA_UNICA' | 'CUSTODIA_CONJUNTA';

  // Consentimientos
  acceptsDataStorage: boolean;
  acceptsDataTransfer: boolean;
  authorizesImages: boolean;

  // Hoja 2: Ficha Médica
  bloodType?: string;
  chronicDiseases?: string;
  allergies?: string;
  medHeadache?: string;
  medFever?: string;
  medStomach?: string;
  medThroat?: string;
  medicalObservations?: string;
  authorizesEmergency: boolean;

  // Hoja 3: SEPA / IBAN
  accountHolderName: string;
  accountHolderDni: string;
  iban: string;
  authorizesSepa: boolean;

  // Firmas Base64
  signatureParent1: string;
  signatureParent2?: string;
}