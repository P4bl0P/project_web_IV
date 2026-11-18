import type {
  ApplicantRecord,
  ApplicationStatus,
  Gender,
  SortField,
  SortOrder,
} from '../services/api';
import { formatIsoToDisplay } from './dateUtils';
import { validateEnrollmentStep, validateSolicitudForm } from './scoutValidators';

export type SecretariaTab =
  | 'INITIAL'
  | 'WAITLIST'
  | 'OFFERED'
  | 'CENSUS'
  | 'ARCHIVED';

export interface SecretariaSectionSchema {
  id: SecretariaTab;
  label: string;
  shortLabel: string;
  description: string;
  statuses: ApplicationStatus[];
  /** Campos disponibles en los registros de este apartado */
  capabilities: {
    branch: boolean;
    ageAndBirthDate: boolean;
    gender: boolean;
    tutorData: boolean;
    email: boolean;
    phone: boolean;
    admittedAt: boolean;
    incompleteCheck: boolean;
    enrollmentExtendedContact: boolean;
  };
  defaultSort: {
    sortBy: SortField;
    sortOrder: SortOrder;
  };
}

export const SECRETARIA_SECTIONS: Record<SecretariaTab, SecretariaSectionSchema> = {
  INITIAL: {
    id: 'INITIAL',
    label: 'Solicitudes Iniciales',
    shortLabel: 'Solicitudes',
    description:
      'Formularios iniciales de contacto pendientes de validar por el Kraal (solo datos de Fase 1).',
    statuses: ['PENDIENTE_REVISION'],
    capabilities: {
      branch: true,
      ageAndBirthDate: true,
      gender: true,
      tutorData: true,
      email: true,
      phone: true,
      admittedAt: false, // Las solicitudes iniciales aún no están censadas
      incompleteCheck: true,
      enrollmentExtendedContact: false, // No consultar datos propios de Fase 2
    },
    defaultSort: {
      sortBy: 'priority',
      sortOrder: 'asc',
    },
  },
  WAITLIST: {
    id: 'WAITLIST',
    label: 'Lista de Espera',
    shortLabel: 'Lista de Espera',
    description:
      'Solicitudes validadas esperando plaza disponible en su sección scout correspondiente.',
    statuses: ['LISTA_ESPERA'],
    capabilities: {
      branch: true,
      ageAndBirthDate: true,
      gender: true,
      tutorData: true,
      email: true,
      phone: true,
      admittedAt: false, // Aún no dados de alta en el censo
      incompleteCheck: true,
      enrollmentExtendedContact: true,
    },
    defaultSort: {
      sortBy: 'priority',
      sortOrder: 'asc',
    },
  },
  OFFERED: {
    id: 'OFFERED',
    label: 'Inscripciones Pendientes',
    shortLabel: 'Inscripciones',
    description:
      'Plazas ofertadas con enlace mágico activo e inscripciones completadas pendientes de alta en censo.',
    statuses: ['PLAZA_OFERTADA', 'INSCRIPCION_COMPLETADA'],
    capabilities: {
      branch: true,
      ageAndBirthDate: true,
      gender: true,
      tutorData: true,
      email: true,
      phone: true,
      admittedAt: false,
      incompleteCheck: true,
      enrollmentExtendedContact: true,
    },
    defaultSort: {
      sortBy: 'priority',
      sortOrder: 'asc',
    },
  },
  CENSUS: {
    id: 'CENSUS',
    label: 'Censo Oficial',
    shortLabel: 'Censo',
    description:
      'Educandos dados de alta oficialmente en el censo del Grupo IV con su documentación e inscripción completa.',
    statuses: ['CENSADO'],
    capabilities: {
      branch: true,
      ageAndBirthDate: true,
      gender: true,
      tutorData: true,
      email: true,
      phone: true,
      admittedAt: true, // Solo donde existe y tiene sentido la fecha de alta en el censo
      incompleteCheck: true,
      enrollmentExtendedContact: true,
    },
    defaultSort: {
      sortBy: 'childLastName',
      sortOrder: 'asc',
    },
  },
  ARCHIVED: {
    id: 'ARCHIVED',
    label: 'Bajas',
    shortLabel: 'Bajas',
    description: 'Histórico de registros dados de baja o solicitudes archivadas.',
    statuses: ['BAJA'],
    capabilities: {
      branch: true,
      ageAndBirthDate: true,
      gender: true,
      tutorData: true,
      email: true,
      phone: true,
      admittedAt: false,
      incompleteCheck: true,
      enrollmentExtendedContact: true,
    },
    defaultSort: {
      sortBy: 'childLastName',
      sortOrder: 'asc',
    },
  },
};

export interface SecretariaFiltersState {
  search: string;
  branch: string;
  gender: Gender | '';
  minAge: string;
  maxAge: string;
  birthDateFrom: string;
  birthDateTo: string;
  tutorName: string;
  email: string;
  phone: string;
  admittedFrom: string;
  admittedTo: string;
  incompleteOnly: boolean;
  /** Subfiltro opcional en Inscripciones Pendientes */
  enrollmentSubStatus: 'ALL' | 'PLAZA_OFERTADA' | 'INSCRIPCION_COMPLETADA';
}

export const INITIAL_SECRETARIA_FILTERS: SecretariaFiltersState = {
  search: '',
  branch: 'Todas',
  gender: '',
  minAge: '',
  maxAge: '',
  birthDateFrom: '',
  birthDateTo: '',
  tutorName: '',
  email: '',
  phone: '',
  admittedFrom: '',
  admittedTo: '',
  incompleteOnly: false,
  enrollmentSubStatus: 'ALL',
};

export interface SortOptionConfig {
  id: string;
  label: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  requiresAdmittedAt?: boolean;
}

export const SECRETARIA_SORT_OPTIONS: SortOptionConfig[] = [
  {
    id: 'priority:asc',
    label: 'Prioridad y orden de llegada',
    sortBy: 'priority',
    sortOrder: 'asc',
  },
  {
    id: 'childFirstName:asc',
    label: 'Nombre: A - Z',
    sortBy: 'childFirstName',
    sortOrder: 'asc',
  },
  {
    id: 'childFirstName:desc',
    label: 'Nombre: Z - A',
    sortBy: 'childFirstName',
    sortOrder: 'desc',
  },
  {
    id: 'childLastName:asc',
    label: 'Apellidos: A - Z',
    sortBy: 'childLastName',
    sortOrder: 'asc',
  },
  {
    id: 'childLastName:desc',
    label: 'Apellidos: Z - A',
    sortBy: 'childLastName',
    sortOrder: 'desc',
  },
  {
    id: 'age:desc',
    label: 'Edad: mayor a menor',
    sortBy: 'age',
    sortOrder: 'desc',
  },
  {
    id: 'age:asc',
    label: 'Edad: menor a mayor',
    sortBy: 'age',
    sortOrder: 'asc',
  },
  {
    id: 'childBirthDate:desc',
    label: 'Fecha de nacimiento: más reciente',
    sortBy: 'childBirthDate',
    sortOrder: 'desc',
  },
  {
    id: 'childBirthDate:asc',
    label: 'Fecha de nacimiento: más antigua',
    sortBy: 'childBirthDate',
    sortOrder: 'asc',
  },
  {
    id: 'admittedAt:desc',
    label: 'Fecha de alta en el censo: más reciente',
    sortBy: 'admittedAt',
    sortOrder: 'desc',
    requiresAdmittedAt: true,
  },
  {
    id: 'admittedAt:asc',
    label: 'Fecha de alta en el censo: más antigua',
    sortBy: 'admittedAt',
    sortOrder: 'asc',
    requiresAdmittedAt: true,
  },
  {
    id: 'branch:asc',
    label: 'Sección scout (Castores a Rutas)',
    sortBy: 'branch',
    sortOrder: 'asc',
  },
  {
    id: 'branch:desc',
    label: 'Sección scout (Rutas a Castores)',
    sortBy: 'branch',
    sortOrder: 'desc',
  },
];

const BRANCH_ORDER: Record<string, number> = {
  'Pre-Castor (< 6 años)': 0,
  Castores: 1,
  Lobatos: 2,
  Rangers: 3,
  Pioneros: 4,
  Rutas: 5,
  'Fuera de rango': 6,
};

/**
 * Normaliza texto eliminando tildes/diacríticos, pasando a minúsculas y colapsando espacios.
 */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizePhoneDigits(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

const SOLICITUD_FIELD_LABELS: Record<string, string> = {
  childFirstName: 'Nombre del educando',
  childLastName: 'Apellidos del educando',
  childBirthDate: 'Fecha de nacimiento',
  gender: 'Sexo',
  streetAddress: 'Dirección',
  postalCode: 'Código postal',
  municipality: 'Municipio',
  province: 'Provincia',
  parent1FirstName: 'Nombre del tutor 1',
  parent1LastName: 'Apellidos del tutor 1',
  parent1Phone: 'Teléfono del tutor 1',
  parent1Email: 'Correo del tutor 1',
  parent2Phone: 'Teléfono del tutor 2',
  parent2Email: 'Correo del tutor 2',
  familyMemberDetails: 'Detalles del familiar en el grupo',
  originGroupDetails: 'Grupo de procedencia',
};

/**
 * Evalúa si un registro tiene datos incompletos reutilizando las validaciones del proyecto
 * (`validateSolicitudForm` y `validateEnrollmentStep`) y respetando estrictamente la fase del registro:
 * - Solicitudes iniciales (`PENDIENTE_REVISION`): SOLO comprueba los campos obligatorios de Fase 1.
 *   Nunca marca como incompleta una solicitud inicial por carecer de datos de inscripción (Fase 2).
 * - Lista de espera (`LISTA_ESPERA`), Inscripciones pendientes (`PLAZA_OFERTADA`, `INSCRIPCION_COMPLETADA`)
 *   y Censo (`CENSADO`): comprueba los criterios obligatorios de la inscripción completa (y en Censo, fecha de alta).
 */
export function evaluateRecordCompleteness(
  record: ApplicantRecord,
  activeTab?: SecretariaTab,
): { isIncomplete: boolean; missingFields: string[] } {
  const showSecondParent = Boolean(
    record.parent2FirstName?.trim() ||
      record.parent2LastName?.trim() ||
      record.parent2Phone?.trim() ||
      record.parent2Email?.trim(),
  );

  const solicitudErrors = validateSolicitudForm(record, showSecondParent);
  const missingFields: string[] = Object.keys(solicitudErrors).map(
    (key) => SOLICITUD_FIELD_LABELS[key] || key,
  );

  if (!record.gender) {
    missingFields.push('Sexo');
  }

  // En Solicitudes Iniciales (PENDIENTE_REVISION) jamás exigimos campos de inscripción posterior
  const isInitialRequest =
    activeTab === 'INITIAL' || record.status === 'PENDIENTE_REVISION';

  if (isInitialRequest) {
    return {
      isIncomplete: missingFields.length > 0,
      missingFields,
    };
  }

  // Para Lista de Espera, Inscripciones Pendientes, Censo (o Bajas con inscripción),
  // comprobamos las reglas de obligatoriedad de la inscripción completa reutilizando validateEnrollmentStep
  const requiresFullEnrollment =
    activeTab === 'WAITLIST' ||
    activeTab === 'OFFERED' ||
    activeTab === 'CENSUS' ||
    record.status === 'LISTA_ESPERA' ||
    record.status === 'PLAZA_OFERTADA' ||
    record.status === 'INSCRIPCION_COMPLETADA' ||
    record.status === 'CENSADO' ||
    Boolean(record.enrollment);

  if (!requiresFullEnrollment) {
    return {
      isIncomplete: missingFields.length > 0,
      missingFields,
    };
  }

  if (!record.enrollment) {
    missingFields.push('Ficha de inscripción completa (DNI, ficha médica, SEPA y firmas)');
    return {
      isIncomplete: true,
      missingFields,
    };
  }

  const enrollmentPayload = {
    ...record.enrollment,
    streetAddress: record.streetAddress,
    streetNumber: record.streetNumber,
    ApartmentDoor: record.ApartmentDoor,
    postalCode: record.postalCode,
    municipality: record.municipality,
    province: record.province,
    parent1Phone: record.parent1Phone,
    parent1Email: record.parent1Email,
    parent2Phone: record.parent2Phone,
    parent2Email: record.parent2Email,
  };

  const stepLabels: Record<number, string> = {
    1: 'Datos legales y DNI',
    2: 'Ficha médica y autorización de urgencia',
    3: 'Domiciliación bancaria (SEPA / IBAN)',
    4: 'Consentimientos y firmas',
  };

  for (const step of [1, 2, 3, 4]) {
    const stepError = validateEnrollmentStep(step, enrollmentPayload);
    if (stepError) {
      missingFields.push(`${stepLabels[step]}: ${stepError}`);
    }
  }

  if ((activeTab === 'CENSUS' || record.status === 'CENSADO') && !record.admittedAt) {
    missingFields.push('Fecha de alta en el censo');
  }

  return {
    isIncomplete: missingFields.length > 0,
    missingFields,
  };
}

/**
 * Comprueba si un registro coincide con la búsqueda inteligente adaptada a los campos disponibles en el apartado.
 */
export function matchesSmartSearch(
  record: ApplicantRecord,
  searchQuery: string,
  sectionSchema: SecretariaSectionSchema,
): boolean {
  const normalizedQuery = normalizeText(searchQuery);
  if (!normalizedQuery) return true;

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (tokens.length === 0) return true;

  const { capabilities } = sectionSchema;

  const textParts: Array<string | undefined | null> = [
    record.childFirstName,
    record.childLastName,
  ];

  if (capabilities.tutorData) {
    textParts.push(
      record.parent1FirstName,
      record.parent1LastName,
      record.parent2FirstName,
      record.parent2LastName,
    );
  }

  if (capabilities.email) {
    textParts.push(record.parent1Email, record.parent2Email);
    if (capabilities.enrollmentExtendedContact && record.enrollment?.childEmail) {
      textParts.push(record.enrollment.childEmail);
    }
  }

  const phoneParts: Array<string | undefined | null> = [];
  if (capabilities.phone) {
    phoneParts.push(record.parent1Phone, record.parent2Phone);
    if (capabilities.enrollmentExtendedContact && record.enrollment?.childPhone) {
      phoneParts.push(record.enrollment.childPhone);
    }
    textParts.push(...phoneParts);
  }

  const searchableText = normalizeText(textParts.filter(Boolean).join(' '));
  const searchableDigits = normalizePhoneDigits(phoneParts.filter(Boolean).join(' '));

  return tokens.every((token) => {
    if (searchableText.includes(token)) return true;
    const tokenDigits = normalizePhoneDigits(token);
    if (tokenDigits.length >= 2 && searchableDigits.includes(tokenDigits)) return true;
    return false;
  });
}

/**
 * Filtra y ordena los registros de un apartado de Secretaría respetando las capacidades de su esquema.
 */
export function filterAndSortSecretariaRecords(
  records: ApplicantRecord[],
  activeTab: SecretariaTab,
  filters: SecretariaFiltersState,
  sortBy: SortField,
  sortOrder: SortOrder,
): ApplicantRecord[] {
  const sectionSchema = SECRETARIA_SECTIONS[activeTab];
  const { capabilities, statuses } = sectionSchema;
  const allowedStatuses = new Set<ApplicationStatus>(statuses);

  const filtered = records.filter((record) => {
    // 1. Estado del apartado
    if (!allowedStatuses.has(record.status)) return false;

    // Subfiltro opcional en Inscripciones Pendientes
    if (
      activeTab === 'OFFERED' &&
      filters.enrollmentSubStatus !== 'ALL' &&
      record.status !== filters.enrollmentSubStatus
    ) {
      return false;
    }

    // 2. Buscador inteligente
    if (filters.search && !matchesSmartSearch(record, filters.search, sectionSchema)) {
      return false;
    }

    // 3. Sección scout
    if (capabilities.branch && filters.branch && filters.branch !== 'Todas') {
      const normalizedBranch = normalizeText(filters.branch);
      if (!normalizeText(record.calculatedBranch).startsWith(normalizedBranch)) {
        return false;
      }
    }

    // 4. Sexo
    if (capabilities.gender && filters.gender) {
      if (record.gender !== filters.gender) return false;
    }

    // 5. Edad y Fecha de nacimiento
    if (capabilities.ageAndBirthDate) {
      if (filters.minAge !== '') {
        const min = Number(filters.minAge);
        if (!Number.isNaN(min) && record.currentAge < min) return false;
      }
      if (filters.maxAge !== '') {
        const max = Number(filters.maxAge);
        if (!Number.isNaN(max) && record.currentAge > max) return false;
      }
      if (filters.birthDateFrom) {
        const recordBirthIso = record.childBirthDate.slice(0, 10);
        if (recordBirthIso < filters.birthDateFrom.slice(0, 10)) return false;
      }
      if (filters.birthDateTo) {
        const recordBirthIso = record.childBirthDate.slice(0, 10);
        if (recordBirthIso > filters.birthDateTo.slice(0, 10)) return false;
      }
    }

    // 6. Nombre de tutor (admite fragmentos y distinto orden de nombre y apellidos)
    if (capabilities.tutorData && filters.tutorName.trim()) {
      const tutorTokens = normalizeText(filters.tutorName).split(' ').filter(Boolean);
      const tutorHaystack = normalizeText(
        [
          record.parent1FirstName,
          record.parent1LastName,
          record.parent2FirstName,
          record.parent2LastName,
        ]
          .filter(Boolean)
          .join(' '),
      );
      if (!tutorTokens.every((token) => tutorHaystack.includes(token))) {
        return false;
      }
    }

    // 7. Correo electrónico
    if (capabilities.email && filters.email.trim()) {
      const emailNeedle = normalizeText(filters.email);
      const emails = [
        record.parent1Email,
        record.parent2Email,
        capabilities.enrollmentExtendedContact ? record.enrollment?.childEmail : undefined,
      ]
        .filter(Boolean)
        .map((e) => normalizeText(e));
      if (!emails.some((email) => email.includes(emailNeedle))) {
        return false;
      }
    }

    // 8. Teléfono
    if (capabilities.phone && filters.phone.trim()) {
      const phoneNeedle = normalizeText(filters.phone);
      const phoneDigits = normalizePhoneDigits(filters.phone);
      const phones = [
        record.parent1Phone,
        record.parent2Phone,
        capabilities.enrollmentExtendedContact ? record.enrollment?.childPhone : undefined,
      ].filter(Boolean) as string[];

      const matchesPhone = phones.some((phone) => {
        if (phoneDigits && normalizePhoneDigits(phone).includes(phoneDigits)) return true;
        return normalizeText(phone).includes(phoneNeedle);
      });
      if (!matchesPhone) return false;
    }

    // 9. Fecha de alta en el censo (solo cuando admittedAt está disponible en el apartado)
    if (capabilities.admittedAt) {
      if (filters.admittedFrom) {
        if (!record.admittedAt) return false;
        const recordAdmittedIso = record.admittedAt.slice(0, 10);
        if (recordAdmittedIso < filters.admittedFrom.slice(0, 10)) {
          return false;
        }
      }
      if (filters.admittedTo) {
        if (!record.admittedAt) return false;
        const recordAdmittedIso = record.admittedAt.slice(0, 10);
        if (recordAdmittedIso > filters.admittedTo.slice(0, 10)) {
          return false;
        }
      }
    }

    // 10. Datos incompletos (según las reglas propias del apartado/tipo de registro)
    if (capabilities.incompleteCheck && filters.incompleteOnly) {
      const { isIncomplete } = evaluateRecordCompleteness(record, activeTab);
      if (!isIncomplete) return false;
    }

    return true;
  });

  // Ordenación
  const effectiveSortBy: SortField =
    sortBy === 'admittedAt' && !capabilities.admittedAt
      ? sectionSchema.defaultSort.sortBy
      : sortBy;
  const direction = sortOrder === 'desc' ? -1 : 1;

  return [...filtered].sort((a, b) => {
    if (effectiveSortBy === 'childFirstName') {
      const cmp = a.childFirstName.localeCompare(b.childFirstName, 'es', {
        sensitivity: 'base',
      });
      if (cmp !== 0) return cmp * direction;
      return (
        a.childLastName.localeCompare(b.childLastName, 'es', { sensitivity: 'base' }) *
        direction
      );
    }

    if (effectiveSortBy === 'childLastName') {
      const cmp = a.childLastName.localeCompare(b.childLastName, 'es', {
        sensitivity: 'base',
      });
      if (cmp !== 0) return cmp * direction;
      return (
        a.childFirstName.localeCompare(b.childFirstName, 'es', { sensitivity: 'base' }) *
        direction
      );
    }

    if (effectiveSortBy === 'age') {
      const ageDiff = a.currentAge - b.currentAge;
      if (ageDiff !== 0) return ageDiff * direction;
      // Si tienen la misma edad de ronda solar, desempatar por fecha de nacimiento
      const birthDiff =
        new Date(b.childBirthDate).getTime() - new Date(a.childBirthDate).getTime();
      return birthDiff * direction;
    }

    if (effectiveSortBy === 'childBirthDate') {
      const diff =
        new Date(a.childBirthDate).getTime() - new Date(b.childBirthDate).getTime();
      if (diff !== 0) return diff * direction;
    }

    if (effectiveSortBy === 'admittedAt') {
      const aTime = a.admittedAt ? new Date(a.admittedAt).getTime() : 0;
      const bTime = b.admittedAt ? new Date(b.admittedAt).getTime() : 0;
      if (aTime !== bTime) return (aTime - bTime) * direction;
    }

    if (effectiveSortBy === 'branch') {
      const aOrder = BRANCH_ORDER[a.calculatedBranch] ?? 99;
      const bOrder = BRANCH_ORDER[b.calculatedBranch] ?? 99;
      if (aOrder !== bOrder) return (aOrder - bOrder) * direction;
      return a.childLastName.localeCompare(b.childLastName, 'es', { sensitivity: 'base' });
    }

    if (effectiveSortBy === 'createdAt') {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (diff !== 0) return diff * direction;
    }

    // Orden por prioridad y antigüedad de solicitud
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export interface ActiveFilterChip {
  key: keyof SecretariaFiltersState;
  label: string;
  valueLabel: string;
}

const GENDER_LABELS: Record<Gender, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
};

/**
 * Construye la lista de indicadores visuales (chips) para los filtros activos en el apartado actual.
 */
export function getActiveFilterChips(
  filters: SecretariaFiltersState,
  activeTab: SecretariaTab,
): ActiveFilterChip[] {
  const { capabilities } = SECRETARIA_SECTIONS[activeTab];
  const chips: ActiveFilterChip[] = [];

  if (filters.search.trim()) {
    chips.push({
      key: 'search',
      label: 'Búsqueda',
      valueLabel: `"${filters.search.trim()}"`,
    });
  }

  if (capabilities.branch && filters.branch && filters.branch !== 'Todas') {
    chips.push({
      key: 'branch',
      label: 'Sección',
      valueLabel: filters.branch,
    });
  }

  if (activeTab === 'OFFERED' && filters.enrollmentSubStatus !== 'ALL') {
    chips.push({
      key: 'enrollmentSubStatus',
      label: 'Estado inscripción',
      valueLabel:
        filters.enrollmentSubStatus === 'PLAZA_OFERTADA'
          ? 'Enlace enviado'
          : 'Inscripción rellenada',
    });
  }

  if (capabilities.gender && filters.gender) {
    chips.push({
      key: 'gender',
      label: 'Sexo',
      valueLabel: GENDER_LABELS[filters.gender] || filters.gender,
    });
  }

  if (capabilities.ageAndBirthDate) {
    if (filters.minAge !== '') {
      chips.push({
        key: 'minAge',
        label: 'Edad mín.',
        valueLabel: `${filters.minAge} años`,
      });
    }
    if (filters.maxAge !== '') {
      chips.push({
        key: 'maxAge',
        label: 'Edad máx.',
        valueLabel: `${filters.maxAge} años`,
      });
    }
    if (filters.birthDateFrom) {
      chips.push({
        key: 'birthDateFrom',
        label: 'Nacido desde',
        valueLabel: formatIsoToDisplay(filters.birthDateFrom) || filters.birthDateFrom,
      });
    }
    if (filters.birthDateTo) {
      chips.push({
        key: 'birthDateTo',
        label: 'Nacido hasta',
        valueLabel: formatIsoToDisplay(filters.birthDateTo) || filters.birthDateTo,
      });
    }
  }

  if (capabilities.tutorData && filters.tutorName.trim()) {
    chips.push({
      key: 'tutorName',
      label: 'Tutor',
      valueLabel: filters.tutorName.trim(),
    });
  }

  if (capabilities.email && filters.email.trim()) {
    chips.push({
      key: 'email',
      label: 'Correo',
      valueLabel: filters.email.trim(),
    });
  }

  if (capabilities.phone && filters.phone.trim()) {
    chips.push({
      key: 'phone',
      label: 'Teléfono',
      valueLabel: filters.phone.trim(),
    });
  }

  if (capabilities.admittedAt) {
    if (filters.admittedFrom) {
      chips.push({
        key: 'admittedFrom',
        label: 'Alta censo desde',
        valueLabel: formatIsoToDisplay(filters.admittedFrom) || filters.admittedFrom,
      });
    }
    if (filters.admittedTo) {
      chips.push({
        key: 'admittedTo',
        label: 'Alta censo hasta',
        valueLabel: formatIsoToDisplay(filters.admittedTo) || filters.admittedTo,
      });
    }
  }

  if (capabilities.incompleteCheck && filters.incompleteOnly) {
    chips.push({
      key: 'incompleteOnly',
      label: 'Integridad',
      valueLabel:
        activeTab === 'INITIAL'
          ? 'Datos de solicitud incompletos'
          : activeTab === 'CENSUS'
            ? 'Datos censales incompletos'
            : 'Inscripción incompleta',
    });
  }

  return chips;
}
