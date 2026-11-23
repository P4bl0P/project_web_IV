export interface SolarRoundInfo {
  startYear: number;
  endYear: number;
  label: string;
  startDate: string; // YYYY-MM-DD (01/09/startYear)
  endDate: string; // YYYY-MM-DD (31/08/endYear)
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
  isEligibleAsYouth: boolean; // Castores, Lobatos, Rangers, Pioneros (6..17)
  isManagedByGroup: boolean; // True para 6..17 y Responsables (>= 21); False para < 6 y Rutas (18..20)
  isExternalRutas: boolean; // 18..20 pertenece a Agrupación de Rutas
  isAdultLeader: boolean; // >= 21 Responsables
}

export interface DateParts {
  year: number;
  month: number; // 1 - 12
  day: number; // 1 - 31
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

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= maxDay;
}

/**
 * Construye una Ronda Solar a partir del año de inicio (empieza el 1 de septiembre de startYear
 * y termina el 31 de agosto de startYear + 1).
 */
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

/**
 * Determina la Ronda Solar correspondiente a una fecha dada.
 * - Septiembre a diciembre -> ronda que empieza ese año (YYYY / YYYY+1).
 * - Enero a agosto -> ronda que empezó el año anterior (YYYY-1 / YYYY).
 */
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

/**
 * Parsea una referencia explícita de ronda solar:
 * - Número (año de inicio, ej. 2026)
 * - Cadena "2026/2027"
 * - Objeto SolarRoundInfo o { startYear }
 * - Date (calcula la ronda solar que contiene esa fecha)
 */
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

/**
 * Calcula la edad que el educando cumple durante la ronda solar indicada.
 * Equivale a la edad cumplida al cierre de la ronda (31 de agosto de endYear).
 */
export function calculateAgeInSolarRound(
  birthDate: Date | string,
  solarRound?: SolarRoundInfo | { startYear: number } | string | number | Date,
): { age: number; solarRound: SolarRoundInfo } {
  const round = resolveSolarRound(solarRound);
  const birth = extractDateParts(birthDate);
  if (!birth) {
    throw new Error('Fecha de nacimiento no válida para calcular la ronda solar.');
  }

  // Fecha de fin de ronda: 31 de agosto de round.endYear (mes 8, día 31)
  let age = round.endYear - birth.year;
  if (birth.month > 8) {
    age -= 1;
  }

  return { age, solarRound: round };
}

/**
 * Calcula la rama oficial del Grupo IV según la edad cumplida durante la Ronda Solar:
 * - < 6 años: Menor de 6 años (fuera de edad mínima)
 * - 6, 7, 8 años: Castores
 * - 9, 10, 11 años: Lobatos
 * - 12, 13, 14 años: Rangers
 * - 15, 16, 17 años: Pioneros
 * - 18, 19, 20 años: Rutas (pertenece a la Agrupación de Rutas, fuera del ámbito del grupo)
 * - >= 21 años: Responsables (categoría del grupo)
 */
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
