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

export interface HistoryMilestone {
  id: string;
  period: string;
  tag: string;
  title: string;
  summary: string;
  detail: string;
  photoSrc?: string;
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

export interface ScoutSectionItem {
  id: 'castores' | 'lobatos' | 'rangers' | 'pioneros' | 'rutas';
  name: string;
  ages: string;
  stageLabel: string;
  shortDesc: string;
  whatTheyDo: string[];
  motto: string;
  photoSrc: string | null;
  photoAlt: string;
  photoOrientation: 'landscape' | 'portrait';
  accentBg: string;
  accentBorder: string;
  accentText: string;
  badgeClass: string;
  dotClass: string;
}
