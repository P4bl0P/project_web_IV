import { BadRequestException } from '@nestjs/common';
import { ApplicationStatus, ClosureReason } from '@prisma/client';

export const ALLOWED_STATE_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.PENDIENTE_REVISION]: [
    ApplicationStatus.LISTA_ESPERA,
    ApplicationStatus.PLAZA_OFERTADA,
    ApplicationStatus.BAJA,
  ],
  [ApplicationStatus.LISTA_ESPERA]: [
    ApplicationStatus.PLAZA_OFERTADA,
    ApplicationStatus.BAJA,
  ],
  [ApplicationStatus.PLAZA_OFERTADA]: [
    ApplicationStatus.INSCRIPCION_COMPLETADA,
    ApplicationStatus.LISTA_ESPERA,
    ApplicationStatus.BAJA,
  ],
  [ApplicationStatus.INSCRIPCION_COMPLETADA]: [
    ApplicationStatus.CENSADO,
    ApplicationStatus.PLAZA_OFERTADA,
    ApplicationStatus.BAJA,
  ],
  [ApplicationStatus.CENSADO]: [ApplicationStatus.BAJA],
  [ApplicationStatus.BAJA]: [
    ApplicationStatus.PENDIENTE_REVISION,
    ApplicationStatus.LISTA_ESPERA,
    ApplicationStatus.INSCRIPCION_COMPLETADA,
    ApplicationStatus.CENSADO,
  ],
};

export const STATUS_LABELS_ES: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDIENTE_REVISION]: 'Pendiente de revisión',
  [ApplicationStatus.LISTA_ESPERA]: 'Lista de espera',
  [ApplicationStatus.PLAZA_OFERTADA]: 'Plaza ofertada',
  [ApplicationStatus.INSCRIPCION_COMPLETADA]: 'Inscripción completada',
  [ApplicationStatus.CENSADO]: 'Censado',
  [ApplicationStatus.BAJA]: 'Baja / Cerrado',
};

export const CLOSURE_REASON_LABELS: Record<ClosureReason, string> = {
  [ClosureReason.SOLICITUD_RETIRADA]: 'Solicitud retirada por la familia',
  [ClosureReason.SOLICITUD_RECHAZADA]: 'Solicitud rechazada por criterios de admisión',
  [ClosureReason.OFERTA_RECHAZADA]: 'Oferta de plaza rechazada por la familia',
  [ClosureReason.OFERTA_CADUCADA]: 'Oferta caducada sin respuesta',
  [ClosureReason.BAJA_VOLUNTARIA]: 'Baja voluntaria del educando',
  [ClosureReason.BAJA_DISCIPLINARIA]: 'Baja por decisión del Kraal / Consejo',
  [ClosureReason.BAJA_POR_EDAD]: 'Baja por paso a Rutas / fin de etapa',
  [ClosureReason.DUPLICADO]: 'Expediente duplicado',
  [ClosureReason.OTRO]: 'Otro motivo especificado en notas',
};

export const EDITABLE_PHASE1_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.PENDIENTE_REVISION,
  ApplicationStatus.LISTA_ESPERA,
  ApplicationStatus.PLAZA_OFERTADA,
]);

export function assertTransitionAllowed(
  from: ApplicationStatus,
  to: ApplicationStatus,
  operationLabel: string,
): void {
  const allowed = ALLOWED_STATE_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Transición no permitida para "${operationLabel}": no se puede pasar de "${STATUS_LABELS_ES[from]}" a "${STATUS_LABELS_ES[to]}".`,
    );
  }
}

export function resolveReactivationTargetStatus(
  previousStatus: ApplicationStatus | null,
  hasCompletedEnrollment: boolean,
  isEnrollmentComplete: boolean,
): ApplicationStatus {
  if (previousStatus === ApplicationStatus.CENSADO && hasCompletedEnrollment && isEnrollmentComplete) {
    return ApplicationStatus.CENSADO;
  }
  if (hasCompletedEnrollment) {
    return ApplicationStatus.INSCRIPCION_COMPLETADA;
  }
  if (
    previousStatus === ApplicationStatus.LISTA_ESPERA ||
    previousStatus === ApplicationStatus.PLAZA_OFERTADA
  ) {
    return ApplicationStatus.LISTA_ESPERA;
  }
  return ApplicationStatus.PENDIENTE_REVISION;
}
