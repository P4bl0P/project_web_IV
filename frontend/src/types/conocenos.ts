export type CouncilRole = 'Jefatura' | 'Secretaría' | 'Tesorería';

export interface CouncilMember {
  id: string;
  fullName: string;
  role: CouncilRole;
  personalBio: string | null;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouncilResponse {
  members: CouncilMember[];
  roleDescriptions: Record<CouncilRole, string>;
  availableRoles: CouncilRole[];
}

export interface CreateCouncilMemberPayload {
  fullName: string;
  role: CouncilRole;
  personalBio?: string;
  displayOrder?: number;
}

export interface UpdateCouncilMemberPayload {
  fullName?: string;
  role?: CouncilRole;
  personalBio?: string | null;
  displayOrder?: number;
}

export interface ChapterNavItem {
  id: string;
  label: string;
}

export type HistoryMilestoneId =
  | 'origen-1979'
  | 'consolidacion-1997'
  | 'asamblea-2013'
  | 'aniversario-2024';

export interface HistoryMilestone {
  id: HistoryMilestoneId;
  period: string;
  tag: string;
  title: string;
  summary: string;
  detail: string;
  photoAlt?: string;
  photoEra?: 'historica' | 'actual';
  photoOrientation?: 'landscape' | 'portrait';
}

export interface ValueItem {
  id: string;
  number: string;
  title: string;
  lead: string;
  description: string;
  iconName: 'users' | 'heartHandshake' | 'trees' | 'shieldCheck' | 'sprout' | 'flame';
  emphasis: 'featured' | 'dark' | 'soft' | 'standard';
}

export interface MethodologyStep {
  id: string;
  step: string;
  title: string;
  summary: string;
  example: string;
  iconName: 'hammer' | 'users' | 'compass' | 'handshake' | 'heart' | 'trees' | 'sparkles';
}

export type ScoutSectionId =
  | 'castores'
  | 'lobatos'
  | 'rangers'
  | 'pioneros'
  | 'rutas';

export interface ScoutSectionItem {
  id: ScoutSectionId;
  name: string;
  ages: string;
  stageLabel: string;
  shortDesc: string;
  whatTheyDo: string[];
  motto: string;
  photoAlt: string;
  photoOrientation: 'landscape' | 'portrait';
  accentBg: string;
  accentBorder: string;
  accentText: string;
  badgeClass: string;
  dotClass: string;
}
