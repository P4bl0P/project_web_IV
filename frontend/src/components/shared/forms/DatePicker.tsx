import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useId,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  MONTH_NAMES_ES,
  MONTH_SHORT_NAMES_ES,
  WEEKDAY_SHORT_ES,
  WEEKDAY_FULL_ES,
  applyDateInputMask,
  buildCalendarGrid,
  formatIsoToDisplay,
  getTodayIsoDate,
  getTodayLocalParts,
  isIsoDateOutOfRange,
  isMonthDisabled,
  parseDisplayInputToIso,
  parseIsoDate,
  toIsoDate,
  addDaysLocal,
  addMonthsLocal,
  type LocalDateParts,
} from '../../../utils/dateUtils';
import { formInputClass } from './formStyles';

export interface DatePickerProps {
  id?: string;
  name?: string;
  value: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (isoDate: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'aria-label'?: string;
  size?: 'md' | 'sm';
  clearable?: boolean;
  defaultViewYear?: number;
  className?: string;
}

type PickerMode = 'days' | 'monthYear';

function createSyntheticDateEvent(name: string, value: string): ChangeEvent<HTMLInputElement> {
  const target = {
    name,
    value,
    type: 'date',
  } as HTMLInputElement;

  return {
    target,
    currentTarget: target,
  } as ChangeEvent<HTMLInputElement>;
}

export default function DatePicker({
  id,
  name = '',
  value,
  onChange,
  onValueChange,
  placeholder = 'dd/mm/aaaa',
  min,
  max,
  required = false,
  disabled = false,
  hasError = false,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  size = 'md',
  clearable = true,
  defaultViewYear,
  className,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id || `datepicker-${generatedId}`;
  const popoverId = `datepicker-popover-${generatedId}`;

  const normalizedValue = useMemo(() => {
    const parsed = parseIsoDate(value);
    return parsed ? toIsoDate(parsed) : '';
  }, [value]);

  const [inputText, setInputText] = useState<string>(() => formatIsoToDisplay(normalizedValue));
  const [prevNormalizedValue, setPrevNormalizedValue] = useState<string>(normalizedValue);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>('days');
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Sincronizar texto cuando cambia la prop value desde fuera
  if (normalizedValue !== prevNormalizedValue) {
    setPrevNormalizedValue(normalizedValue);
    setInputText(formatIsoToDisplay(normalizedValue));
  }

  const initialParts = useMemo((): LocalDateParts => {
    const parsed = parseIsoDate(normalizedValue);
    if (parsed) return parsed;
    const today = getTodayLocalParts();
    if (defaultViewYear && defaultViewYear >= 1900 && defaultViewYear <= 2100) {
      return { year: defaultViewYear, month: today.month, day: 1 };
    }
    const maxParts = parseIsoDate(max);
    if (maxParts && toIsoDate(today) > toIsoDate(maxParts)) {
      return maxParts;
    }
    const minParts = parseIsoDate(min);
    if (minParts && toIsoDate(today) < toIsoDate(minParts)) {
      return minParts;
    }
    return today;
  }, [normalizedValue, defaultViewYear, max, min]);

  const [viewYear, setViewYear] = useState<number>(initialParts.year);
  const [viewMonth, setViewMonth] = useState<number>(initialParts.month);
  const [focusedParts, setFocusedParts] = useState<LocalDateParts>(initialParts);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  const [popoverCoords, setPopoverCoords] = useState<{
    top: number;
    left: number;
    placement: 'bottom' | 'top';
  }>({ top: 0, left: 0, placement: 'bottom' });

  const emitChange = (nextIso: string) => {
    onValueChange?.(nextIso);
    onChange?.(createSyntheticDateEvent(name, nextIso));
  };

  // Detectar viewport móvil
  useEffect(() => {
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < 640);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Calcular posición del popover en escritorio/tablet
  const updatePosition = useCallback(() => {
    if (!containerRef.current || isMobileViewport) return;
    const rect = containerRef.current.getBoundingClientRect();
    const popoverWidth = 304;
    const popoverHeight = 356;
    const margin = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: 'bottom' | 'top' =
      spaceBelow < popoverHeight + margin && spaceAbove > spaceBelow ? 'top' : 'bottom';

    const top =
      placement === 'bottom'
        ? Math.min(window.innerHeight - popoverHeight - margin, rect.bottom + 6)
        : Math.max(margin, rect.top - popoverHeight - 6);

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - popoverWidth - margin);
    }

    setPopoverCoords({ top: Math.max(margin, top), left, placement });
  }, [isMobileViewport]);

  const openPicker = () => {
    if (disabled) return;
    const target = parseIsoDate(normalizedValue) ?? initialParts;
    setViewYear(target.year);
    setViewMonth(target.month);
    setFocusedParts(target);
    setMode('days');
    setIsOpen(true);
  };

  const closePicker = () => {
    setIsOpen(false);
    setMode('days');
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Cerrar al hacer clic fuera o pulsar Escape (capturando Escape para no cerrar modales padre)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        containerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      closePicker();
    };

    const handleKeyDownCapture = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        closePicker();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDownCapture, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDownCapture, true);
    };
  }, [isOpen]);

  // Al abrir el selector rápido de año, hacer scroll suave al año activo
  useEffect(() => {
    if (isOpen && mode === 'monthYear' && yearListRef.current) {
      const activeYearBtn = yearListRef.current.querySelector<HTMLButtonElement>(
        '[data-active-year="true"]',
      );
      if (activeYearBtn) {
        activeYearBtn.scrollIntoView({ block: 'center' });
      }
    }
  }, [isOpen, mode]);

  const minYear = useMemo(() => {
    const parsed = parseIsoDate(min);
    return parsed ? parsed.year : 1930;
  }, [min]);

  const maxYear = useMemo(() => {
    const parsed = parseIsoDate(max);
    return parsed ? parsed.year : new Date().getFullYear() + 10;
  }, [max]);

  const yearsList = useMemo(() => {
    const list: number[] = [];
    const start = Math.min(minYear, maxYear);
    const end = Math.max(minYear, maxYear);
    for (let y = end; y >= start; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  const calendarCells = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth, normalizedValue, min, max),
    [viewYear, viewMonth, normalizedValue, min, max],
  );

  const handleManualInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw.trim()) {
      setInputText('');
      if (normalizedValue !== '') {
        emitChange('');
      }
      return;
    }

    const masked = applyDateInputMask(raw);
    setInputText(masked);

    // Si ha completado DD/MM/AAAA o YYYY-MM-DD (10 caracteres), validar y emitir
    if (masked.length === 10) {
      const candidateIso = parseDisplayInputToIso(masked);
      if (candidateIso) {
        const parts = parseIsoDate(candidateIso)!;
        setViewYear(parts.year);
        setViewMonth(parts.month);
        setFocusedParts(parts);
        if (candidateIso !== normalizedValue) {
          emitChange(candidateIso);
        }
      }
    }
  };

  const handleInputBlur = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setInputText('');
      if (normalizedValue !== '') {
        emitChange('');
      }
      return;
    }

    const candidateIso = parseDisplayInputToIso(trimmed);
    if (candidateIso) {
      setInputText(formatIsoToDisplay(candidateIso));
      if (candidateIso !== normalizedValue) {
        emitChange(candidateIso);
      }
    } else {
      // Revertir al último valor válido confirmado si el formato escrito no es una fecha real
      setInputText(formatIsoToDisplay(normalizedValue));
    }
  };

  const handleSelectDate = (parts: LocalDateParts) => {
    const iso = toIsoDate(parts);
    if (isIsoDateOutOfRange(iso, min, max)) return;
    setInputText(formatIsoToDisplay(iso));
    setViewYear(parts.year);
    setViewMonth(parts.month);
    setFocusedParts(parts);
    emitChange(iso);
    closePicker();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setInputText('');
    emitChange('');
    inputRef.current?.focus();
  };

  const handleStepMonth = (delta: number) => {
    const next = addMonthsLocal({ year: viewYear, month: viewMonth, day: 1 }, delta);
    if (next.year < minYear || next.year > maxYear) return;
    setViewYear(next.year);
    setViewMonth(next.month);
    setFocusedParts((prev) => ({
      year: next.year,
      month: next.month,
      day: Math.min(prev.day, 28),
    }));
  };

  const handleTodayClick = () => {
    const today = getTodayLocalParts();
    const todayIso = toIsoDate(today);
    if (isIsoDateOutOfRange(todayIso, min, max)) {
      setViewYear(today.year);
      setViewMonth(today.month);
      setMode('days');
      return;
    }
    handleSelectDate(today);
  };

  const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      openPicker();
      return;
    }
    if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      const candidateIso = parseDisplayInputToIso(inputText);
      if (candidateIso && !isIsoDateOutOfRange(candidateIso, min, max)) {
        const parts = parseIsoDate(candidateIso)!;
        handleSelectDate(parts);
      } else {
        closePicker();
      }
    }
  };

  const handleCalendarKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (mode !== 'days') return;

    let nextFocus: LocalDateParts | null = null;
    if (e.key === 'ArrowLeft') {
      nextFocus = addDaysLocal(focusedParts, -1);
    } else if (e.key === 'ArrowRight') {
      nextFocus = addDaysLocal(focusedParts, 1);
    } else if (e.key === 'ArrowUp') {
      nextFocus = addDaysLocal(focusedParts, -7);
    } else if (e.key === 'ArrowDown') {
      nextFocus = addDaysLocal(focusedParts, 7);
    } else if (e.key === 'PageUp') {
      nextFocus = addMonthsLocal(focusedParts, -1);
    } else if (e.key === 'PageDown') {
      nextFocus = addMonthsLocal(focusedParts, 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectDate(focusedParts);
      return;
    }

    if (nextFocus) {
      e.preventDefault();
      setFocusedParts(nextFocus);
      setViewYear(nextFocus.year);
      setViewMonth(nextFocus.month);
    }
  };

  const isInvalid = Boolean(hasError || ariaInvalid);
  const todayIso = getTodayIsoDate();
  const isTodayAllowed = !isIsoDateOutOfRange(todayIso, min, max);
  const focusedIso = toIsoDate(focusedParts);

  const baseInputClasses =
    className ??
    (size === 'sm'
      ? `w-full h-9 rounded-xl border bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#01317b] focus:ring-3 focus:ring-[#01317b]/12 outline-none transition-all duration-150`
      : formInputClass(isInvalid));

  const showClearButton = clearable && Boolean(inputText) && !disabled && !required;

  const calendarContent = (
    <div
      ref={popoverRef}
      id={popoverId}
      role="dialog"
      aria-modal={isMobileViewport ? 'true' : 'false'}
      aria-label={ariaLabel ? `Calendario: ${ariaLabel}` : 'Selector de fecha'}
      onKeyDown={handleCalendarKeyDown}
      tabIndex={-1}
      style={
        isMobileViewport
          ? undefined
          : {
              position: 'fixed',
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              width: '304px',
              zIndex: 9999,
            }
      }
      className={
        isMobileViewport
          ? 'relative w-full max-w-[340px] rounded-[24px] bg-white/98 backdrop-blur-xl border border-slate-200/90 p-4 shadow-[0_24px_64px_-12px_rgba(0,2,84,0.28),0_4px_16px_rgba(12,25,51,0.1)] animate-sec-modal select-none outline-none'
          : 'rounded-2xl bg-white/98 backdrop-blur-xl border border-slate-200/90 p-3.5 shadow-[0_20px_48px_-10px_rgba(0,2,84,0.18),0_4px_14px_rgba(12,25,51,0.07)] animate-sec-expand select-none outline-none'
      }
    >
      {/* Cabecera: selector rápido de mes/año + flechas de navegación */}
      <div className="flex items-center justify-between gap-1.5 pb-2.5 mb-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setMode((prev) => (prev === 'days' ? 'monthYear' : 'days'))}
          aria-expanded={mode === 'monthYear'}
          className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold tracking-tight text-[#000254] hover:bg-[#01317b]/[0.07] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>
            {MONTH_NAMES_ES[viewMonth - 1]} {viewYear}
          </span>
          <ChevronDown
            size={14}
            className={`text-[#01317b] transition-transform duration-200 ${
              mode === 'monthYear' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {mode === 'days' ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleStepMonth(-1)}
              aria-label="Mes anterior"
              className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-600 hover:text-[#000254] hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleStepMonth(1)}
              aria-label="Mes siguiente"
              className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-600 hover:text-[#000254] hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMode('days')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#01317b] bg-[#01317b]/10 hover:bg-[#01317b]/15 transition-colors cursor-pointer"
          >
            Ver días
          </button>
        )}
      </div>

      {/* Cuerpo: Cuadrícula de días o Selector rápido de Mes y Año */}
      {mode === 'days' ? (
        <div>
          {/* Cabecera de días de la semana (L a D) */}
          <div className="grid grid-cols-7 gap-0.5 mb-1" role="row">
            {WEEKDAY_SHORT_ES.map((dayShort, idx) => (
              <span
                key={dayShort}
                title={WEEKDAY_FULL_ES[idx]}
                className="h-7 flex items-center justify-center text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                {dayShort}
              </span>
            ))}
          </div>

          {/* Cuadrícula de 42 días */}
          <div className="grid grid-cols-7 gap-0.5" role="grid" aria-label={`${MONTH_NAMES_ES[viewMonth - 1]} ${viewYear}`}>
            {calendarCells.map((cell) => {
              const isFocused = cell.iso === focusedIso;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={cell.isDisabled}
                  onClick={() => handleSelectDate(cell.date)}
                  aria-label={`${cell.date.day} de ${MONTH_NAMES_ES[cell.date.month - 1]} de ${cell.date.year}`}
                  aria-pressed={cell.isSelected}
                  aria-current={cell.isToday ? 'date' : undefined}
                  className={[
                    'relative h-9 w-full rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center outline-none',
                    cell.isDisabled
                      ? 'opacity-30 cursor-not-allowed text-slate-300'
                      : 'cursor-pointer active:scale-95',
                    cell.isSelected
                      ? 'bg-[#01317b] text-white font-bold shadow-[0_3px_10px_rgba(1,49,123,0.28)]'
                      : cell.isToday
                        ? 'bg-[#01317b]/[0.08] text-[#01317b] font-bold ring-1 ring-[#01317b]/30 hover:bg-[#01317b]/15'
                        : cell.isCurrentMonth
                          ? 'text-[#0c1933] hover:bg-slate-100/90'
                          : 'text-slate-400/80 hover:bg-slate-100/60 hover:text-slate-600',
                    isFocused && !cell.isSelected ? 'ring-2 ring-[#01317b]/35' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span>{cell.date.day}</span>
                  {cell.isToday && (
                    <span
                      className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                        cell.isSelected ? 'bg-white' : 'bg-[#01317b]'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3 py-1">
          {/* Selección rápida de mes */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
              Mes
            </p>
            <div className="grid grid-cols-4 gap-1">
              {MONTH_SHORT_NAMES_ES.map((mName, idx) => {
                const monthNumber = idx + 1;
                const isSelectedMonth = viewMonth === monthNumber;
                const disabledMonth = isMonthDisabled(viewYear, monthNumber, min, max);
                return (
                  <button
                    key={mName}
                    type="button"
                    disabled={disabledMonth}
                    onClick={() => {
                      setViewMonth(monthNumber);
                      setMode('days');
                    }}
                    className={`h-8 rounded-lg text-xs font-semibold transition-all ${
                      disabledMonth
                        ? 'opacity-30 cursor-not-allowed text-slate-300'
                        : isSelectedMonth
                          ? 'bg-[#01317b] text-white shadow-xs cursor-pointer'
                          : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    {mName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selección rápida de año */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
              Año
            </p>
            <div
              ref={yearListRef}
              className="grid grid-cols-4 gap-1 max-h-36 overflow-y-auto pr-1"
            >
              {yearsList.map((yr) => {
                const isSelectedYear = viewYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    data-active-year={isSelectedYear ? 'true' : undefined}
                    onClick={() => {
                      setViewYear(yr);
                    }}
                    className={`h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelectedYear
                        ? 'bg-[#000254] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pie del calendario: botones rápidos */}
      <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {isTodayAllowed && (
            <button
              type="button"
              onClick={handleTodayClick}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#01317b] hover:bg-[#01317b]/[0.08] transition-colors cursor-pointer"
            >
              Hoy
            </button>
          )}
          {normalizedValue && !required && (
            <button
              type="button"
              onClick={(e) => {
                handleClear(e);
                closePicker();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>Borrar</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={closePicker}
          className="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={inputText}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={isInvalid}
          aria-describedby={ariaDescribedby}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls={isOpen ? popoverId : undefined}
          onChange={handleManualInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onClick={() => {
            if (!isOpen) openPicker();
          }}
          className={`${baseInputClasses} ${
            size === 'sm'
              ? showClearButton
                ? 'pl-3 pr-14'
                : 'pl-3 pr-9'
              : showClearButton
                ? 'pl-3.5 pr-16'
                : 'pl-3.5 pr-10'
          } ${isOpen ? 'border-[#01317b] ring-3 ring-[#01317b]/12 bg-white' : ''}`}
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {showClearButton && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              aria-label="Limpiar fecha"
              className="h-6 w-6 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => (isOpen ? closePicker() : openPicker())}
            aria-label={isOpen ? 'Cerrar calendario' : 'Abrir calendario'}
            className={`inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'
            } ${
              isOpen
                ? 'bg-[#01317b]/10 text-[#01317b]'
                : 'text-slate-400 hover:text-[#01317b] hover:bg-slate-100'
            }`}
          >
            <CalendarIcon size={size === 'sm' ? 13 : 15} />
          </button>
        </div>
      </div>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          isMobileViewport ? (
            <div
              className="fixed inset-0 z-[9999] bg-[#0c1933]/35 backdrop-blur-[2px] flex items-center justify-center p-4 animate-sec-backdrop"
              onClick={(e) => {
                if (e.target === e.currentTarget) closePicker();
              }}
            >
              {calendarContent}
            </div>
          ) : (
            calendarContent
          ),
          document.body,
        )}
    </div>
  );
}
