export interface SolarRoundInfo {
  startYear: number;
  endYear: number;
  label: string;
  startDate: string;
  endDate: string;
}

export type ScoutBranchName =
  | 'Menor de 6 años'
  | 'Castores'
  | 'Lobatos'
  | 'Rangers'
  | 'Pioneros'
  | 'Rutas'
  | 'Responsables';

export interface ScoutBranchCalculation {
  branch: ScoutBranchName;
  age: number;
  solarRound: SolarRoundInfo;
  isEligibleAsYouth: boolean;
  isManagedByGroup: boolean;
  isExternalRutas: boolean;
  isAdultLeader: boolean;
}

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= maxDay;
}

export function extractDateParts(input: Date | string): DateParts | null {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]);
      const day = Number(isoMatch[3]);
      if (isValidCalendarDate(year, month, day)) {
        return { year, month, day };
      }
      return null;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return {
      year: parsed.getUTCFullYear(),
      month: parsed.getUTCMonth() + 1,
      day: parsed.getUTCDate(),
    };
  }

  if (Number.isNaN(input.getTime())) return null;

  const isUtcMidnight =
    input.getUTCHours() === 0 &&
    input.getUTCMinutes() === 0 &&
    input.getUTCSeconds() === 0 &&
    input.getUTCMilliseconds() === 0;

  if (isUtcMidnight) {
    return {
      year: input.getUTCFullYear(),
      month: input.getUTCMonth() + 1,
      day: input.getUTCDate(),
    };
  }

  return {
    year: input.getFullYear(),
    month: input.getMonth() + 1,
    day: input.getDate(),
  };
}

export function buildSolarRound(startYear: number): SolarRoundInfo {
  const endYear = startYear + 1;
  return {
    startYear,
    endYear,
    label: `${startYear}/${endYear}`,
    startDate: `${startYear}-09-01`,
    endDate: `${endYear}-08-31`,
  };
}

export function getSolarRoundForDate(referenceDate: Date | string = new Date()): SolarRoundInfo {
  const parts = extractDateParts(referenceDate);
  if (!parts) {
    const now = new Date();
    const m = now.getMonth() + 1;
    return buildSolarRound(m >= 9 ? now.getFullYear() : now.getFullYear() - 1);
  }
  const startYear = parts.month >= 9 ? parts.year : parts.year - 1;
  return buildSolarRound(startYear);
}

export function resolveSolarRound(
  solarRound?: SolarRoundInfo | { startYear: number } | string | number | Date,
): SolarRoundInfo {
  if (solarRound === undefined) {
    return getSolarRoundForDate(new Date());
  }
  if (typeof solarRound === 'number') {
    return buildSolarRound(solarRound);
  }
  if (typeof solarRound === 'string') {
    const match = /^(\d{4})\s*[/-]\s*(\d{4})$/.exec(solarRound.trim());
    if (match) {
      return buildSolarRound(Number(match[1]));
    }
    return getSolarRoundForDate(solarRound);
  }
  if (solarRound instanceof Date) {
    return getSolarRoundForDate(solarRound);
  }
  return buildSolarRound(solarRound.startYear);
}

export function calculateAgeInSolarRound(
  birthDate: Date | string,
  solarRound?: SolarRoundInfo | { startYear: number } | string | number | Date,
): { age: number; solarRound: SolarRoundInfo } {
  const round = resolveSolarRound(solarRound);
  const birth = extractDateParts(birthDate);
  if (!birth) {
    throw new Error('Fecha de nacimiento no válida para calcular la ronda solar.');
  }

  let age = round.endYear - birth.year;
  if (birth.month > 8) {
    age -= 1;
  }

  return { age, solarRound: round };
}

export function calculateScoutBranchForRound(
  birthDate: Date | string,
  solarRound?: SolarRoundInfo | { startYear: number } | string | number | Date,
): ScoutBranchCalculation {
  const { age, solarRound: round } = calculateAgeInSolarRound(birthDate, solarRound);

  if (age < 6) {
    return {
      branch: 'Menor de 6 años',
      age,
      solarRound: round,
      isEligibleAsYouth: false,
      isManagedByGroup: false,
      isExternalRutas: false,
      isAdultLeader: false,
    };
  }
  if (age <= 8) {
    return {
      branch: 'Castores',
      age,
      solarRound: round,
      isEligibleAsYouth: true,
      isManagedByGroup: true,
      isExternalRutas: false,
      isAdultLeader: false,
    };
  }
  if (age <= 11) {
    return {
      branch: 'Lobatos',
      age,
      solarRound: round,
      isEligibleAsYouth: true,
      isManagedByGroup: true,
      isExternalRutas: false,
      isAdultLeader: false,
    };
  }
  if (age <= 14) {
    return {
      branch: 'Rangers',
      age,
      solarRound: round,
      isEligibleAsYouth: true,
      isManagedByGroup: true,
      isExternalRutas: false,
      isAdultLeader: false,
    };
  }
  if (age <= 17) {
    return {
      branch: 'Pioneros',
      age,
      solarRound: round,
      isEligibleAsYouth: true,
      isManagedByGroup: true,
      isExternalRutas: false,
      isAdultLeader: false,
    };
  }
  if (age <= 20) {
    return {
      branch: 'Rutas',
      age,
      solarRound: round,
      isEligibleAsYouth: false,
      isManagedByGroup: false,
      isExternalRutas: true,
      isAdultLeader: false,
    };
  }
  return {
    branch: 'Responsables',
    age,
    solarRound: round,
    isEligibleAsYouth: false,
    isManagedByGroup: true,
    isExternalRutas: false,
    isAdultLeader: true,
  };
}
