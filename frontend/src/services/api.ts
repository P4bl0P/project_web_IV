const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const authFetch = (input: RequestInfo | URL, init: RequestInit = {}) =>
  fetch(input, { ...init, credentials: 'include' });
async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' · ') : data.message || 'No se pudo completar la operación');
  return data;
}

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

export interface EnrollmentDetailsRecord extends CompleteEnrollmentPayload {
  id: string;
  createdAt: string;
  signedAtParent1: string;
  signedAtParent2?: string | null;
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
  isIncomplete?: boolean;
  missingFields?: string[];
  enrollment?: EnrollmentDetailsRecord | null;
}

export type SortField =
  | 'priority'
  | 'childFirstName'
  | 'childLastName'
  | 'age'
  | 'childBirthDate'
  | 'admittedAt'
  | 'branch'
  | 'createdAt';

export type SortOrder = 'asc' | 'desc';

export type RecordStage = 'INITIAL' | 'WAITLIST' | 'PENDING_ENROLLMENT' | 'CENSUS' | 'ARCHIVED';

export interface ApplicationsQueryParams {
  status?: ApplicationStatus;
  statuses?: ApplicationStatus[];
  stage?: RecordStage;
  search?: string;
  branch?: string;
  gender?: Gender;
  minAge?: number;
  maxAge?: number;
  birthDateFrom?: string;
  birthDateTo?: string;
  tutorName?: string;
  email?: string;
  phone?: string;
  admittedFrom?: string;
  admittedTo?: string;
  incompleteOnly?: boolean;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}

export interface UpdateApplicationPayload {
  status?: ApplicationStatus;
  socialInclusionPriority?: boolean;
  kraalInternalNotes?: string;
}

export type DirectCensusPayload = CreateApplicationPayload & CompleteEnrollmentPayload;

export const applicationsApi = {
  // Fase 1: Enviar solicitud pública
  async submitApplication(data: CreateApplicationPayload): Promise<ApplicantRecord> {
    const response = await authFetch(`${API_URL}/applications`, {
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

  // Fase 4: Obtener todas las solicitudes y miembros (con soporte opcional de filtros y ordenación en servidor)
  async getAll(params?: ApplicationsQueryParams): Promise<ApplicantRecord[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.status) searchParams.set('status', params.status);
      if (params.statuses?.length) searchParams.set('statuses', params.statuses.join(','));
      if (params.stage) searchParams.set('stage', params.stage);
      if (params.search?.trim()) searchParams.set('search', params.search.trim());
      if (params.branch && params.branch !== 'Todas') searchParams.set('branch', params.branch);
      if (params.gender) searchParams.set('gender', params.gender);
      if (params.minAge !== undefined) searchParams.set('minAge', String(params.minAge));
      if (params.maxAge !== undefined) searchParams.set('maxAge', String(params.maxAge));
      if (params.birthDateFrom) searchParams.set('birthDateFrom', params.birthDateFrom);
      if (params.birthDateTo) searchParams.set('birthDateTo', params.birthDateTo);
      if (params.tutorName?.trim()) searchParams.set('tutorName', params.tutorName.trim());
      if (params.email?.trim()) searchParams.set('email', params.email.trim());
      if (params.phone?.trim()) searchParams.set('phone', params.phone.trim());
      if (params.admittedFrom) searchParams.set('admittedFrom', params.admittedFrom);
      if (params.admittedTo) searchParams.set('admittedTo', params.admittedTo);
      if (params.incompleteOnly !== undefined) searchParams.set('incompleteOnly', String(params.incompleteOnly));
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      if (params.page !== undefined) searchParams.set('page', String(params.page));
      if (params.pageSize !== undefined) searchParams.set('pageSize', String(params.pageSize));
    }
    const queryString = searchParams.toString();
    const response = await authFetch(`${API_URL}/applications${queryString ? `?${queryString}` : ''}`);
    if (!response.ok) {
      throw new Error('No se pudieron cargar las solicitudes del servidor.');
    }
    return response.json();
  },

  async createDirectCensus(data: DirectCensusPayload): Promise<ApplicantRecord> {
    const response = await authFetch(`${API_URL}/applications/census`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = Array.isArray(errorData.message)
        ? errorData.message.join(' · ')
        : errorData.message;
      throw new Error(msg || 'Error al crear el alta directa.');
    }
    return response.json();
  },

  async updateCensus(id: string, data: Partial<DirectCensusPayload>): Promise<ApplicantRecord> {
    const response = await authFetch(`${API_URL}/applications/${id}/census`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = Array.isArray(errorData.message)
        ? errorData.message.join(' · ')
        : errorData.message;
      throw new Error(msg || 'Error al actualizar la inscripción.');
    }
    return response.json();
  },

  // Fase 4: Actualizar estado, prioridad de inclusión o notas del Kraal
  async update(id: string, data: UpdateApplicationPayload): Promise<ApplicantRecord> {
    const response = await authFetch(`${API_URL}/applications/${id}`, {
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
    const response = await authFetch(`${API_URL}/applications/${id}/offer-spot`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error('Error al ofertar la plaza y generar el enlace mágico.');
    }
    return response.json();
  },

  // Fase 4: Eliminar registro
  async remove(id: string): Promise<void> {
    const response = await authFetch(`${API_URL}/applications/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar la solicitud.');
    }
  },

  // Fase 5: Obtener datos del enlace mágico (para padres)
  async getByMagicToken(token: string): Promise<ApplicantRecord> {
    const response = await authFetch(`${API_URL}/applications/magic/${token}`);
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
    const response = await authFetch(`${API_URL}/applications/magic/${token}`, {
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

export type AdminUser = { id: string; email: string; name: string; status: 'ACTIVE' | 'BLOCKED' | 'DISABLED'; createdAt: string; role?: { id: string; name: string } | null };
export type AdminRole = { id: string; name: string; _count: { users: number }; permissions: PermissionRecord[] };
export type PermissionRecord = { id: string; roleId: string; moduleId: string; canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean; role: { name: string }; module: { name: string } };

export const adminApi = {
  users: () => apiJson<AdminUser[]>('/admin/users'),
  roles: () => apiJson<AdminRole[]>('/admin/roles'),
  modules: () => apiJson<{ id: string; name: string }[]>('/admin/modules'),
  permissions: () => apiJson<PermissionRecord[]>('/admin/permissions'),
  createUser: (data: { name: string; email: string; roleId: string }) => apiJson<{ user: AdminUser; temporaryPassword: string }>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Partial<Pick<AdminUser, 'name' | 'email' | 'status'>> & { roleId?: string }) => apiJson<AdminUser>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  resetPassword: (id: string) => apiJson<{ temporaryPassword: string }>(`/admin/users/${id}/reset-password`, { method: 'POST' }),
  disableUser: (id: string) => apiJson<{ ok: true }>(`/admin/users/${id}`, { method: 'DELETE' }),
  createRole: (name: string) => apiJson<AdminRole>('/admin/roles', { method: 'POST', body: JSON.stringify({ name }) }),
  updateRole: (id: string, name: string) => apiJson<AdminRole>(`/admin/roles/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  updatePermission: (id: string, data: Partial<Pick<PermissionRecord, 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'>>) => apiJson<PermissionRecord>(`/admin/permissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const profileApi = {
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => apiJson<{ ok: true }>('/auth/password', { method: 'POST', body: JSON.stringify(data) }),
  setInitialPassword: (data: { newPassword: string; confirmPassword: string }) => apiJson<{ ok: true }>('/auth/password/initial', { method: 'POST', body: JSON.stringify(data) }),
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