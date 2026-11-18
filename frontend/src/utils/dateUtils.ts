export interface LocalDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface CalendarCell {
  date: LocalDateParts;
  iso: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const MONTH_SHORT_NAMES_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export const WEEKDAY_SHORT_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export const WEEKDAY_FULL_ES = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  return new Date(year, month, 0).getDate();
}

export function isValidDateParts(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const maxDays = getDaysInMonth(year, month);
  return day >= 1 && day <= maxDays;
}

/**
 * Convierte una cadena ISO YYYY-MM-DD (o con sufijo T...) en partes locales { year, month, day }
 * sin usar new Date(string) en UTC para evitar desfases de un día por zona horaria.
 */
export function parseIsoDate(isoStr: string | null | undefined): LocalDateParts | null {
  if (!isoStr) return null;
  const clean = isoStr.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidDateParts(year, month, day)) return null;
  return { year, month, day };
}

export function toIsoDate(parts: LocalDateParts): string {
  return `${String(parts.year).padStart(4, '0')}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function getTodayLocalParts(): LocalDateParts {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export function getTodayIsoDate(): string {
  return toIsoDate(getTodayLocalParts());
}

/**
 * Formatea una fecha ISO YYYY-MM-DD a DD/MM/AAAA para mostrar en el input o chips.
 */
export function formatIsoToDisplay(isoStr: string | null | undefined): string {
  const parts = parseIsoDate(isoStr);
  if (!parts) return '';
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
}

/**
 * Formatea una fecha ISO YYYY-MM-DD a un texto legible en español (ej. "14 may 2015").
 */
export function formatIsoToHumanShort(isoStr: string | null | undefined): string {
  const parts = parseIsoDate(isoStr);
  if (!parts) return '';
  const monthShort = MONTH_SHORT_NAMES_ES[parts.month - 1]?.toLowerCase() ?? '';
  return `${pad2(parts.day)} ${monthShort} ${parts.year}`;
}

/**
 * Analiza texto introducido por el usuario en formato DD/MM/AAAA, D/M/AAAA, DD-MM-AAAA o YYYY-MM-DD
 * y devuelve la cadena ISO YYYY-MM-DD si la fecha es válida.
 */
export function parseDisplayInputToIso(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  // Soportar YYYY-MM-DD directo (p. ej. al pegar)
  const isoParts = parseIsoDate(trimmed);
  if (isoParts) {
    return toIsoDate(isoParts);
  }

  // Soportar DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY
  const dmyMatch = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (isValidDateParts(year, month, day)) {
      return toIsoDate({ year, month, day });
    }
  }

  return null;
}

/**
 * Aplica máscara automática DD/MM/AAAA mientras el usuario escribe dígitos.
 */
export function applyDateInputMask(raw: string): string {
  // Si el usuario está escribiendo o pegando formato ISO YYYY-MM-DD, respetarlo
  if (/^\d{4}-/.test(raw.trim())) {
    return raw.trim().slice(0, 10);
  }

  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/**
 * Comprueba si una fecha ISO está fuera de los límites min / max (en formato YYYY-MM-DD).
 */
export function isIsoDateOutOfRange(
  iso: string,
  minIso?: string,
  maxIso?: string,
): boolean {
  if (!iso) return false;
  const cleanMin = minIso ? minIso.slice(0, 10) : undefined;
  const cleanMax = maxIso ? maxIso.slice(0, 10) : undefined;
  if (cleanMin && parseIsoDate(cleanMin) && iso < cleanMin) return true;
  if (cleanMax && parseIsoDate(cleanMax) && iso > cleanMax) return true;
  return false;
}

/**
 * Comprueba si todo un mes (año, mes 1-12) queda completamente fuera del rango [minIso, maxIso].
 */
export function isMonthDisabled(
  year: number,
  month: number,
  minIso?: string,
  maxIso?: string,
): boolean {
  const firstDayIso = toIsoDate({ year, month, day: 1 });
  const lastDayIso = toIsoDate({ year, month, day: getDaysInMonth(year, month) });
  const cleanMin = minIso && parseIsoDate(minIso) ? minIso.slice(0, 10) : undefined;
  const cleanMax = maxIso && parseIsoDate(maxIso) ? maxIso.slice(0, 10) : undefined;

  if (cleanMin && lastDayIso < cleanMin) return true;
  if (cleanMax && firstDayIso > cleanMax) return true;
  return false;
}

/**
 * Suma o resta días a una fecha LocalDateParts de forma segura en calendario local.
 */
export function addDaysLocal(parts: LocalDateParts, deltaDays: number): LocalDateParts {
  const d = new Date(parts.year, parts.month - 1, parts.day + deltaDays);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

/**
 * Suma o resta meses a un par (year, month), ajustando el día al máximo del mes destino.
 */
export function addMonthsLocal(parts: LocalDateParts, deltaMonths: number): LocalDateParts {
  const totalMonths = parts.year * 12 + (parts.month - 1) + deltaMonths;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const maxDay = getDaysInMonth(targetYear, targetMonth);
  return {
    year: targetYear,
    month: targetMonth,
    day: Math.min(parts.day, maxDay),
  };
}

/**
 * Construye la cuadrícula de 42 celdas (6 semanas, lunes a domingo) para el mes indicado.
 */
export function buildCalendarGrid(
  viewYear: number,
  viewMonth: number,
  selectedIso: string | null | undefined,
  minIso?: string,
  maxIso?: string,
): CalendarCell[] {
  const todayIso = getTodayIsoDate();
  const normalizedSelected = selectedIso && parseIsoDate(selectedIso) ? selectedIso.slice(0, 10) : '';

  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1);
  // getDay(): 0 = Domingo ... 6 = Sábado -> convertir a 0 = Lunes ... 6 = Domingo
  const startWeekdayMondayFirst = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);

  const prevMonthDate = addMonthsLocal({ year: viewYear, month: viewMonth, day: 1 }, -1);
  const daysInPrevMonth = getDaysInMonth(prevMonthDate.year, prevMonthDate.month);

  const nextMonthDate = addMonthsLocal({ year: viewYear, month: viewMonth, day: 1 }, 1);

  const cells: CalendarCell[] = [];

  // Días del mes anterior
  for (let i = startWeekdayMondayFirst - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date: LocalDateParts = {
      year: prevMonthDate.year,
      month: prevMonthDate.month,
      day,
    };
    const iso = toIsoDate(date);
    cells.push({
      date,
      iso,
      isCurrentMonth: false,
      isToday: iso === todayIso,
      isSelected: iso === normalizedSelected,
      isDisabled: isIsoDateOutOfRange(iso, minIso, maxIso),
    });
  }

  // Días del mes actual
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const date: LocalDateParts = {
      year: viewYear,
      month: viewMonth,
      day,
    };
    const iso = toIsoDate(date);
    cells.push({
      date,
      iso,
      isCurrentMonth: true,
      isToday: iso === todayIso,
      isSelected: iso === normalizedSelected,
      isDisabled: isIsoDateOutOfRange(iso, minIso, maxIso),
    });
  }

  // Días del mes siguiente hasta completar 42 celdas (6 filas constantes para evitar saltos de altura)
  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const date: LocalDateParts = {
      year: nextMonthDate.year,
      month: nextMonthDate.month,
      day,
    };
    const iso = toIsoDate(date);
    cells.push({
      date,
      iso,
      isCurrentMonth: false,
      isToday: iso === todayIso,
      isSelected: iso === normalizedSelected,
      isDisabled: isIsoDateOutOfRange(iso, minIso, maxIso),
    });
  }

  return cells;
}
