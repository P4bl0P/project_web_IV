export const AUDIT_ACTION_LABELS: Record<string, string> = {
  // Autenticación, sesiones y MFA
  LOGIN_SUCCESS: 'Inicio de sesión',
  LOGIN_FAILED: 'Intento de acceso fallido',
  LOGIN_LOCKED: 'Cuenta bloqueada por intentos fallidos',
  LOGIN_DENIED_INACTIVE: 'Acceso denegado (cuenta inactiva)',
  LOGOUT: 'Cierre de sesión',
  MFA_SETUP_COMPLETED: 'Verificación en dos pasos activada',
  MFA_SETUP_FAILED: 'Configuración MFA fallida',
  MFA_FAILED: 'Código MFA incorrecto',
  MFA_RECONFIGURED: 'Verificación MFA actualizada',
  MFA_RECONFIGURE_DENIED: 'Reconfiguración MFA denegada',
  PASSWORD_CHANGED: 'Contraseña actualizada',
  INITIAL_PASSWORD_CHANGED: 'Contraseña inicial establecida',
  PASSWORD_RESET: 'Contraseña restablecida',
  INVITATION_ACCEPTED: 'Invitación aceptada',

  // Administración de usuarios, cargos, módulos y accesos
  USER_CREATED: 'Usuario creado',
  USER_UPDATED: 'Datos de usuario editados',
  USER_ROLE_CHANGED: 'Cambio de cargo de usuario',
  USER_STATUS_CHANGED: 'Cambio de estado de usuario',
  USER_PASSWORD_RESET: 'Contraseña restablecida',
  USER_MFA_RESET: 'MFA reiniciado',
  USER_DISABLED: 'Usuario desactivado',
  USER_DELETED: 'Usuario eliminado',
  ROLE_CREATED: 'Cargo creado',
  ROLE_UPDATED: 'Cargo editado',
  ROLE_DELETED: 'Cargo eliminado',
  ROLE_PERMISSIONS_UPDATED: 'Acceso a módulos del cargo actualizado',
  PERMISSION_CHANGED: 'Acceso al módulo actualizado',
  MODULE_CREATED: 'Módulo creado',
  MODULE_UPDATED: 'Módulo actualizado',
  ACCESS_DENIED: 'Acceso denegado',
  SUPERADMIN_BOOTSTRAPPED: 'Superadministrador inicial creado',
  SUPERADMIN_RECOVERY: 'Recuperación administrativa ejecutada',

  // Contenido público de la web (Consejo de Grupo)
  COUNCIL_MEMBER_CREATED: 'Consejo: integrante añadido',
  COUNCIL_MEMBER_UPDATED: 'Consejo: integrante editado',
  COUNCIL_MEMBERS_REORDERED: 'Consejo: orden actualizado',
  COUNCIL_MEMBER_DELETED: 'Consejo: integrante eliminado',

  // Secretaría, solicitudes, inscripciones y censo oficial
  APPLICATION_CREATED: 'Solicitud registrada',
  APPLICATION_UPDATED: 'Datos del expediente actualizados',
  APPLICATION_VALIDATED: 'Solicitud validada a Lista de espera',
  APPLICATION_SPOT_OFFERED: 'Plaza ofertada (enlace mágico generado)',
  APPLICATION_TOKEN_RENEWED: 'Enlace mágico renovado',
  APPLICATION_RETURNED_TO_WAITLIST: 'Expediente devuelto a Lista de espera',
  APPLICATION_ENROLLMENT_COMPLETED: 'Inscripción oficial completada por la familia',
  APPLICATION_REVIEWED: 'Inscripción marcada como revisada por Secretaría',
  APPLICATION_CENSUS_ADMITTED: 'Alta confirmada en el Censo Oficial',
  APPLICATION_DIRECT_CENSUS_CREATED: 'Alta directa registrada en el Censo Oficial',
  APPLICATION_CENSUS_UPDATED: 'Ficha del censo actualizada',
  APPLICATION_DEACTIVATED: 'Expediente dado de baja / cerrado',
  APPLICATION_REACTIVATED: 'Expediente reactivado desde baja',
  APPLICATION_DELETED: 'Expediente eliminado',
  APPLICATION_SENSITIVE_READ: 'Consulta de ficha confidencial',
  APPLICATION_AURORA_PAYLOAD_PREVIEW: 'Vista previa de mapeo para Aurora',
};

export function formatAuditActionLabel(action: string): string {
  if (AUDIT_ACTION_LABELS[action]) {
    return AUDIT_ACTION_LABELS[action];
  }
  const readable = action.trim().toLowerCase().replace(/_/g, ' ');
  return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : action;
}
