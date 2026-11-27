export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const authFetch = (input: RequestInfo | URL, init: RequestInit = {}) =>
  fetch(input, { ...init, credentials: 'include' });

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const errorData = await response.json().catch(() => ({}));
  const msg = Array.isArray(errorData.message) ? errorData.message.join(' · ') : errorData.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
  fallbackError = 'No se pudo completar la operación',
): Promise<T> {
  let response: Response;
  try {
    response = await authFetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
  }
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallbackError));
  }
  return response.json();
}

export type ApplicationStatus =
  | 'PENDIENTE_REVISION'
  | 'LISTA_ESPERA'
  | 'PLAZA_OFERTADA'
  | 'INSCRIPCION_COMPLETADA'
  | 'CENSADO'
  | 'BAJA';

export type ClosureReason =
  | 'SOLICITUD_RETIRADA'
  | 'SOLICITUD_RECHAZADA'
  | 'OFERTA_RECHAZADA'
  | 'OFERTA_CADUCADA'
  | 'BAJA_VOLUNTARIA'
  | 'BAJA_DISCIPLINARIA'
  | 'BAJA_POR_EDAD'
  | 'DUPLICADO'
  | 'OTRO';

export const CLOSURE_REASON_LABELS: Record<ClosureReason, string> = {
  SOLICITUD_RETIRADA: 'Solicitud retirada por la familia',
  SOLICITUD_RECHAZADA: 'Solicitud rechazada por criterios de admisión',
  OFERTA_RECHAZADA: 'Oferta de plaza rechazada por la familia',
  OFERTA_CADUCADA: 'Oferta caducada sin respuesta',
  BAJA_VOLUNTARIA: 'Baja voluntaria del educando',
  BAJA_DISCIPLINARIA: 'Baja por decisión del Kraal / Consejo',
  BAJA_POR_EDAD: 'Baja por paso a Rutas / fin de etapa',
  DUPLICADO: 'Expediente duplicado',
  OTRO: 'Otro motivo especificado en notas',
};

export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface CreateApplicationPayload {
  childFirstName: string;
  childLastName1: string;
  childLastName2?: string;
  hasNoSecondLastName?: boolean;
  noSecondLastNameJustification?: string;
  childLastName?: string;
  childBirthDate: string;
  familyUnitId?: string;
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
  idempotencyKey?: string;
}

export interface CompleteEnrollmentPayload {
  // Revisión/corrección de datos iniciales de la solicitud
  childFirstName?: string;
  childLastName1?: string;
  childLastName2?: string;
  hasNoSecondLastName?: boolean;
  noSecondLastNameJustification?: string;
  childBirthDate?: string;
  gender: 'MASCULINO' | 'FEMENINO' | '';

  // Dirección postal completa (Fase 2 / Censo)
  streetAddress: string;
  streetNumber?: string;
  apartmentDoor?: string;
  ApartmentDoor?: string;
  postalCode: string;
  municipality: string;
  province: string;

  // Revisión de tutores y relación
  parent1FirstName?: string;
  parent1LastName?: string;
  parent1Phone?: string;
  parent1Email?: string;
  parent1Relationship?: string;
  parent2FirstName?: string;
  parent2LastName?: string;
  parent2Phone?: string;
  parent2Email?: string;
  parent2Relationship?: string;

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

  // Consentimientos trazables
  acceptsDataStorage: boolean;
  acceptsDataTransfer: boolean;
  authorizesImages: boolean;
  consentTextVersion?: string;

  // Hoja 2: Ficha Médica y contacto de emergencia
  bloodType?: string;
  chronicDiseases?: string;
  allergies?: string;
  medHeadache?: string;
  medFever?: string;
  medStomach?: string;
  medThroat?: string;
  medicalObservations?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  authorizesEmergency: boolean;

  // Hoja 3: SEPA / IBAN (titular independiente)
  accountHolderName: string;
  accountHolderDni: string;
  accountHolderAddress?: string;
  accountHolderMunicipality?: string;
  accountHolderPostalCode?: string;
  iban: string;
  authorizesSepa: boolean;

  // Firmas Base64
  signer1FullName?: string;
  signer1Dni?: string;
  signatureParent1: string;
  signer2FullName?: string;
  signer2Dni?: string;
  signatureParent2?: string;
}

export interface EnrollmentDetailsRecord extends Partial<CompleteEnrollmentPayload> {
  id: string;
  applicantId: string;
  createdAt: string;
  updatedAt?: string;
  legalStatus: 'MENOR' | 'MAYOR' | 'EMANCIPADO';
  circularPreference: 'EMAIL' | 'CORREO_POSTAL';
  custodyType: 'SIN_ESPECIFICAR' | 'TUTELA_LEGAL' | 'CUSTODIA_UNICA' | 'CUSTODIA_CONJUNTA';
  acceptsDataStorage: boolean;
  acceptsDataTransfer: boolean;
  authorizesImages: boolean;
  consentTextVersion?: string;
  authorizesEmergency: boolean;
  authorizesSepa: boolean;
  accountHolderName: string;
  ibanMasked?: string;
  ibanLast4?: string | null;
  sepaSignedAt?: string | null;
  hasChildDni?: boolean;
  childDniMasked?: string | null;
  hasMedicalInfo?: boolean;
  hasSignatureParent1?: boolean;
  hasSignatureParent2?: boolean;
  signer1FullName?: string | null;
  signedAtParent1: string;
  signer2FullName?: string | null;
  signedAtParent2?: string | null;
  medicalAccessRestricted?: boolean;
  bankAccessRestricted?: boolean;
}

export interface ApplicantRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  childFirstName: string;
  childLastName1: string;
  childLastName2?: string | null;
  hasNoSecondLastName: boolean;
  noSecondLastNameJustification?: string | null;
  childLastName: string;
  childBirthDate: string;
  gender?: Gender | null;
  streetAddress?: string | null;
  streetNumber?: string | null;
  apartmentDoor?: string | null;
  ApartmentDoor?: string | null;
  postalCode?: string | null;
  municipality?: string | null;
  province?: string | null;
  familyUnitId?: string | null;
  parent1FirstName: string;
  parent1LastName: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Relationship?: string | null;
  parent2FirstName?: string | null;
  parent2LastName?: string | null;
  parent2Phone?: string | null;
  parent2Email?: string | null;
  parent2Relationship?: string | null;
  motivation?: string | null;
  hasFamilyInGroup: boolean;
  familyMemberDetails?: string | null;
  comesFromOtherGroup: boolean;
  originGroupDetails?: string | null;
  socialInclusionPriority: boolean;
  kraalInternalNotes?: string | null;
  enrollmentToken?: string | null;
  tokenExpiresAt?: string | null;
  tokenUsedAt?: string | null;
  tokenExpired?: boolean;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  admittedAt?: string | null;
  admittedById?: string | null;
  censusSolarRound?: string | null;
  censusBranch?: string | null;
  closedAt?: string | null;
  closedById?: string | null;
  closureReason?: ClosureReason | null;
  closureNotes?: string | null;
  previousStatus?: ApplicationStatus | null;
  calculatedBranch: string;
  currentAge: number;
  solarRound?: string;
  priorityScore: number;
  isIncomplete?: boolean;
  missingFields?: string[];
  canAdmitToCensus?: boolean;
  missingForCensus?: string[];
  potentialDuplicateIds?: string[];
  familySiblings?: Array<{
    id: string;
    childFirstName: string;
    childLastName: string;
    status: ApplicationStatus;
    calculatedBranch: string;
  }>;
  enrollment?: EnrollmentDetailsRecord | null;
}

export interface MagicEnrollmentPublicView {
  id: string;
  status: ApplicationStatus;
  childFirstName: string;
  childLastName1: string;
  childLastName2?: string | null;
  hasNoSecondLastName: boolean;
  noSecondLastNameJustification?: string | null;
  childLastName: string;
  childBirthDate: string;
  gender?: Gender | null;
  streetAddress?: string | null;
  streetNumber?: string | null;
  apartmentDoor?: string | null;
  postalCode?: string | null;
  municipality?: string | null;
  province?: string | null;
  parent1FirstName: string;
  parent1LastName: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Relationship?: string | null;
  parent2FirstName?: string | null;
  parent2LastName?: string | null;
  parent2Phone?: string | null;
  parent2Email?: string | null;
  parent2Relationship?: string | null;
  calculatedBranch: string;
  currentAge: number;
  solarRound: string;
  tokenExpiresAt?: string | null;
}

export interface PaginatedApplicationsResponse {
  items: ApplicantRecord[];
  totalMatching: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sectionCounts: {
    INITIAL: number;
    WAITLIST: number;
    OFFERED: number;
    CENSUS: number;
    ARCHIVED: number;
  };
}

export interface AuditHistoryEvent {
  id: string;
  action: string;
  resource?: string | null;
  result: string;
  ipAddress?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  } | null;
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
  enrollmentSubStatus?: 'ALL' | 'PLAZA_OFERTADA' | 'INSCRIPCION_COMPLETADA';
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
  childFirstName?: string;
  childLastName1?: string;
  childLastName2?: string;
  hasNoSecondLastName?: boolean;
  noSecondLastNameJustification?: string;
  childBirthDate?: string;
  parent1FirstName?: string;
  parent1LastName?: string;
  parent1Phone?: string;
  parent1Email?: string;
  parent2FirstName?: string;
  parent2LastName?: string;
  parent2Phone?: string;
  parent2Email?: string;
  motivation?: string;
  hasFamilyInGroup?: boolean;
  familyMemberDetails?: string;
  comesFromOtherGroup?: boolean;
  originGroupDetails?: string;
  socialInclusionPriority?: boolean;
  kraalInternalNotes?: string;
}

export type DirectCensusPayload = CreateApplicationPayload & CompleteEnrollmentPayload;

export type UpdateCensusPayload = Partial<DirectCensusPayload> & {
  socialInclusionPriority?: boolean;
  kraalInternalNotes?: string;
};

function buildQueryString(params?: ApplicationsQueryParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.statuses?.length) searchParams.set('statuses', params.statuses.join(','));
  if (params.stage) searchParams.set('stage', params.stage);
  if (params.enrollmentSubStatus && params.enrollmentSubStatus !== 'ALL') {
    searchParams.set('enrollmentSubStatus', params.enrollmentSubStatus);
  }
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
  if (params.incompleteOnly !== undefined) {
    searchParams.set('incompleteOnly', String(params.incompleteOnly));
  }
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.pageSize !== undefined) searchParams.set('pageSize', String(params.pageSize));
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const applicationsApi = {
  async submitApplication(data: CreateApplicationPayload): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAll(params?: ApplicationsQueryParams): Promise<ApplicantRecord[]> {
    return apiJson<ApplicantRecord[]>(`/applications${buildQueryString(params)}`);
  },

  async getPaginated(params?: ApplicationsQueryParams): Promise<PaginatedApplicationsResponse> {
    return apiJson<PaginatedApplicationsResponse>(
      `/applications/paginated${buildQueryString(params)}`,
    );
  },

  async getById(id: string): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}`);
  },

  async getHistory(id: string): Promise<AuditHistoryEvent[]> {
    return apiJson<AuditHistoryEvent[]>(`/applications/${id}/history`);
  },

  async getAuroraPreview(id: string): Promise<Record<string, unknown>> {
    return apiJson<Record<string, unknown>>(`/applications/${id}/aurora-preview`);
  },

  async createDirectCensus(data: DirectCensusPayload): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>('/applications/census', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCensus(id: string, data: UpdateCensusPayload): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}/census`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateApplicationPayload): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async validate(id: string): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}/validate`, {
      method: 'PATCH',
    });
  },

  async offerSpot(id: string, daysValid = 7): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}/offer-spot`, {
      method: 'PATCH',
      body: JSON.stringify({ daysValid }),
    });
  },

  async renewToken(id: string, daysValid = 7): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}/renew-token`, {
      method: 'PATCH',
      body: JSON.stringify({ daysValid }),
    });
  },

  async returnToWaitlist(id: string, reason?: string): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}/return-waitlist`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async markReviewed(id: string): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}/mark-reviewed`, {
      method: 'PATCH',
    });
  },

  async admitCensus(id: string): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}/admit-census`, {
      method: 'PATCH',
    });
  },

  async deactivate(
    id: string,
    payload: { closureReason: ClosureReason; closureNotes?: string },
  ): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}/deactivate`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async reactivate(id: string, notes?: string): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/${id}/reactivate`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  },

  async remove(id: string): Promise<void> {
    const response = await authFetch(`${API_URL}/applications/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'Error al eliminar la solicitud.'));
    }
  },

  async getByMagicToken(token: string): Promise<MagicEnrollmentPublicView> {
    return apiJson<MagicEnrollmentPublicView>(`/applications/magic/${encodeURIComponent(token)}`);
  },

  async submitMagicEnrollment(
    token: string,
    data: CompleteEnrollmentPayload,
  ): Promise<ApplicantRecord> {
    return apiJson<ApplicantRecord>(`/applications/magic/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export type SpecialActionDefinition = {
  key: string;
  label: string;
  description?: string;
};

export type RegisteredModule = {
  id?: string;
  key: string;
  name: string;
  description?: string | null;
  route?: string | null;
  icon?: string | null;
  isImplemented?: boolean;
  isSystem?: boolean;
  displayOrder?: number;
  supportsRead: boolean;
  supportsCreate: boolean;
  supportsUpdate: boolean;
  supportsDelete: boolean;
  specialActions: SpecialActionDefinition[];
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  status: 'INVITED' | 'ACTIVE' | 'BLOCKED' | 'DISABLED';
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  mfaConfiguredAt?: string | null;
  roleId?: string | null;
  role?: { id: string; name: string; description?: string | null } | null;
  createdAt: string;
  updatedAt?: string;
};

export type PermissionRecord = {
  id: string;
  roleId: string;
  moduleId: string;
  canAccess: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  specialPermissions: string[];
  role?: { id?: string; name: string };
  module: RegisteredModule;
};

export type AdminRole = {
  id: string;
  name: string;
  description?: string | null;
  _count: { users: number };
  permissions: PermissionRecord[];
};

export type AdminAuditEvent = {
  id: string;
  actorId?: string | null;
  actor?: { id: string; name: string; email: string } | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  resource?: string | null;
  result: string;
  previousValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  createdAt: string;
};

export type RolePermissionUpdateItem = {
  moduleId: string;
  canAccess: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  specialPermissions: string[];
};

export const adminApi = {
  users: () => apiJson<AdminUser[]>('/admin/users'),
  roles: () => apiJson<AdminRole[]>('/admin/roles'),
  modules: () => apiJson<RegisteredModule[]>('/admin/modules'),
  permissions: () => apiJson<PermissionRecord[]>('/admin/permissions'),
  createUser: (data: { name: string; email: string; roleId?: string | null }) =>
    apiJson<{ user: AdminUser; temporaryPassword: string }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (
    id: string,
    data: {
      name?: string;
      email?: string;
      status?: 'ACTIVE' | 'BLOCKED' | 'DISABLED';
      roleId?: string | null;
    },
  ) =>
    apiJson<AdminUser>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  resetPassword: (id: string) =>
    apiJson<{ temporaryPassword: string }>(`/admin/users/${id}/reset-password`, {
      method: 'POST',
    }),
  resetMfa: (id: string) =>
    apiJson<{ ok: true }>(`/admin/users/${id}/reset-mfa`, { method: 'POST' }),
  deactivateUser: (id: string) =>
    apiJson<{ ok: true }>(`/admin/users/${id}/deactivate`, { method: 'POST' }),
  deleteUser: (id: string) =>
    apiJson<{ ok: true }>(`/admin/users/${id}`, { method: 'DELETE' }),
  createRole: (data: { name: string; description?: string | null }) =>
    apiJson<AdminRole>('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRole: (id: string, data: { name?: string; description?: string | null }) =>
    apiJson<AdminRole>(`/admin/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRole: (id: string) =>
    apiJson<{ ok: true }>(`/admin/roles/${id}`, { method: 'DELETE' }),
  updateRolePermissions: (roleId: string, permissions: RolePermissionUpdateItem[]) =>
    apiJson<AdminRole>(`/admin/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),
  createModule: (data: {
    key?: string;
    name: string;
    description?: string | null;
    isImplemented?: boolean;
    supportsRead?: boolean;
    supportsCreate?: boolean;
    supportsUpdate?: boolean;
    supportsDelete?: boolean;
    specialActions?: SpecialActionDefinition[];
  }) =>
    apiJson<RegisteredModule>('/admin/modules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateModule: (
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      isImplemented: boolean;
      displayOrder: number;
      supportsRead: boolean;
      supportsCreate: boolean;
      supportsUpdate: boolean;
      supportsDelete: boolean;
      specialActions: SpecialActionDefinition[];
    }>,
  ) =>
    apiJson<RegisteredModule>(`/admin/modules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updatePermission: (
    id: string,
    data: Partial<
      Pick<
        PermissionRecord,
        'canAccess' | 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete' | 'specialPermissions'
      >
    >,
  ) =>
    apiJson<PermissionRecord>(`/admin/permissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  audit: (params?: { action?: string; result?: 'ALLOWED' | 'DENIED'; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.result) qs.set('result', params.result);
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiJson<AdminAuditEvent[]>(`/admin/audit${suffix}`);
  },
};

export const profileApi = {
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => apiJson<{ ok: true }>('/auth/password', { method: 'POST', body: JSON.stringify(data) }),
  setInitialPassword: (data: { newPassword: string; confirmPassword: string }) => apiJson<{ ok: true }>('/auth/password/initial', { method: 'POST', body: JSON.stringify(data) }),
};
