import type {
  ApplicantRecord,
  ApplicationStatus,
  Gender,
  SortField,
  SortOrder,
} from '../services/api';
import { formatIsoToDisplay } from './dateUtils';
import { validateSolicitudForm } from './scoutValidators';

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

const SOLICITUD_FIELD_LABELS: Record<string, string> = {
  childFirstName: 'Nombre del educando',
  childLastName1: 'Primer apellido del educando',
  childLastName2: 'Segundo apellido del educando',
  noSecondLastNameJustification: 'Justificación de ausencia de segundo apellido',
  childBirthDate: 'Fecha de nacimiento',
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
 * Evalúa la completitud usando el resultado autoritativo del backend cuando está presente,
 * con respaldo en `validateSolicitudForm` si se invoca sobre un objeto parcial en UI.
 */
export function evaluateRecordCompleteness(
  record: ApplicantRecord,
): { isIncomplete: boolean; missingFields: string[] } {
  if (typeof record.isIncomplete === 'boolean' && Array.isArray(record.missingFields)) {
    return {
      isIncomplete: record.isIncomplete,
      missingFields: record.missingFields,
    };
  }

  const showSecondParent = Boolean(
    record.parent2FirstName?.trim() ||
      record.parent2LastName?.trim() ||
      record.parent2Phone?.trim() ||
      record.parent2Email?.trim(),
  );

  const solicitudErrors = validateSolicitudForm(
    {
      childFirstName: record.childFirstName,
      childLastName1: record.childLastName1,
      childLastName2: record.childLastName2 ?? undefined,
      hasNoSecondLastName: record.hasNoSecondLastName,
      noSecondLastNameJustification: record.noSecondLastNameJustification ?? undefined,
      childBirthDate: record.childBirthDate,
      parent1FirstName: record.parent1FirstName,
      parent1LastName: record.parent1LastName,
      parent1Phone: record.parent1Phone,
      parent1Email: record.parent1Email,
      parent2FirstName: record.parent2FirstName ?? undefined,
      parent2LastName: record.parent2LastName ?? undefined,
      parent2Phone: record.parent2Phone ?? undefined,
      parent2Email: record.parent2Email ?? undefined,
      motivation: record.motivation ?? undefined,
      hasFamilyInGroup: record.hasFamilyInGroup,
      familyMemberDetails: record.familyMemberDetails ?? undefined,
      comesFromOtherGroup: record.comesFromOtherGroup,
      originGroupDetails: record.originGroupDetails ?? undefined,
    },
    showSecondParent,
    { allowAdultResponsables: true },
  );
  const missingFields: string[] = Object.keys(solicitudErrors).map(
    (key) => SOLICITUD_FIELD_LABELS[key] || key,
  );

  return {
    isIncomplete: missingFields.length > 0,
    missingFields,
  };
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
