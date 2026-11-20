export const COUNCIL_ROLES = ['Jefatura', 'Secretaría', 'Tesorería'] as const;

export type CouncilRole = (typeof COUNCIL_ROLES)[number];

export const COUNCIL_ROLE_DESCRIPTIONS: Record<CouncilRole, string> = {
  Jefatura:
    'Coordina la labor educativa y pastoral del grupo, acompaña al equipo de responsables (Kraal) y vela por los valores y la metodología scout en todas las secciones.',
  Secretaría:
    'Gestiona la administración oficial del grupo, el censo, el proceso de admisión y solicitudes, la custodia documental y la comunicación formal con las familias.',
  Tesorería:
    'Administra con transparencia los recursos económicos, presupuestos, cuotas y logística financiera para hacer posibles las actividades y campamentos del grupo.',
};
