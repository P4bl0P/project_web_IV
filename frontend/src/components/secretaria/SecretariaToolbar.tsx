import { useState, useEffect, useRef } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RotateCcw,
  AlertTriangle,
  Calendar,
  User,
  Mail,
  Phone,
  Users,
  ChevronDown,
} from 'lucide-react';
import type { Gender, SortField, SortOrder } from '../../services/api';
import { getTodayIsoDate } from '../../utils/dateUtils';
import {
  SECRETARIA_SECTIONS,
  SECRETARIA_SORT_OPTIONS,
  getActiveFilterChips,
  type SecretariaFiltersState,
  type SecretariaTab,
} from '../../utils/secretariaSearchFilter';
import DatePicker from '../shared/forms/DatePicker';
import { formCheckboxClass } from '../shared/forms/formStyles';
import {
  SecButton,
  SecFilterSelect,
} from './secretariaTheme';
import {
  getBranchVisualConfig,
  secFilterControlClass,
  secTokens,
} from './secretariaTokens';

const BRANCHES = ['Todas', 'Castores', 'Lobatos', 'Rangers', 'Pioneros', 'Rutas'];

interface Props {
  activeTab: SecretariaTab;
  filters: SecretariaFiltersState;
  sortBy: SortField;
  sortOrder: SortOrder;
  totalMatchingCount: number;
  totalSectionCount: number;
  onChangeFilter: <K extends keyof SecretariaFiltersState>(
    key: K,
    value: SecretariaFiltersState[K],
  ) => void;
  onClearFilter: (key: keyof SecretariaFiltersState) => void;
  onClearAllFilters: () => void;
  onChangeSort: (sortBy: SortField, sortOrder: SortOrder) => void;
}

export default function SecretariaToolbar({
  activeTab,
  filters,
  sortBy,
  sortOrder,
  totalMatchingCount,
  totalSectionCount,
  onChangeFilter,
  onClearFilter,
  onClearAllFilters,
  onChangeSort,
}: Props) {
  const sectionSchema = SECRETARIA_SECTIONS[activeTab];
  const { capabilities } = sectionSchema;

  // Input local para debounce del buscador principal
  const [searchInput, setSearchInput] = useState(filters.search);
  const [prevSearchFilter, setPrevSearchFilter] = useState(filters.search);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);

  // Sincronizar si el padre limpia o cambia filters.search externamente
  if (filters.search !== prevSearchFilter) {
    setPrevSearchFilter(filters.search);
    setSearchInput(filters.search);
  }

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      onChangeFilter('search', value);
    }, 220);
  };

  const handleImmediateClearSearch = () => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    setSearchInput('');
    onChangeFilter('search', '');
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const availableSortOptions = SECRETARIA_SORT_OPTIONS.filter(
    (option) => !option.requiresAdmittedAt || capabilities.admittedAt,
  );

  const currentSortValue = `${sortBy}:${sortOrder}`;
  const activeChips = getActiveFilterChips(filters, activeTab);
  const advancedFilterCount = activeChips.filter(
    (chip) => chip.key !== 'search' && chip.key !== 'branch',
  ).length;

  const searchPlaceholder =
    activeTab === 'INITIAL'
      ? 'Buscar en solicitudes por nombre, apellidos, tutor, correo o teléfono...'
      : activeTab === 'CENSUS'
        ? 'Buscar en el censo por educando, tutores, correo o teléfono...'
        : 'Buscar por nombre, apellidos (en cualquier orden), tutor, correo o teléfono...';

  const incompleteLabel =
    activeTab === 'INITIAL'
      ? 'Solo solicitudes con datos iniciales obligatorios incompletos'
      : activeTab === 'CENSUS'
        ? 'Solo censados con datos censales o inscripción incompleta'
        : 'Solo registros con datos obligatorios de inscripción incompletos';

  return (
    <div className={`${secTokens.surface} p-4 sm:p-5 space-y-3.5`}>
      {/* Fila superior: Buscador inteligente + Ordenación + Botón de filtros avanzados */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Buscador principal con estilo Spotlight */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Buscar registros en Secretaría"
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200/95 bg-[#f8f9fc] hover:border-slate-300 focus:bg-white text-xs sm:text-[13px] font-medium text-[#0c1933] placeholder:text-slate-400 focus:border-[#01317b] focus:ring-3 focus:ring-[#01317b]/12 outline-none transition-all duration-150"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleImmediateClearSearch}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Controles de ordenación y desplegable de filtros avanzados */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Selector de ordenación */}
          <div className="relative flex items-center flex-1 sm:flex-initial min-w-[235px]">
            <ArrowUpDown
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#01317b] pointer-events-none"
            />
            <select
              aria-label="Ordenar registros por"
              value={currentSortValue}
              onChange={(e) => {
                const [nextSortBy, nextSortOrder] = e.target.value.split(':') as [
                  SortField,
                  SortOrder,
                ];
                onChangeSort(nextSortBy, nextSortOrder);
              }}
              className="w-full h-10 pl-8 pr-8 rounded-xl border border-slate-200/95 bg-white hover:border-slate-300 text-xs font-semibold text-slate-700 focus:border-[#01317b] focus:ring-3 focus:ring-[#01317b]/12 outline-none transition-all duration-150 cursor-pointer"
            >
              {availableSortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  Ordenar: {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botón desplegable de filtros avanzados */}
          <SecButton
            variant={isAdvancedOpen || advancedFilterCount > 0 ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => setIsAdvancedOpen((prev) => !prev)}
            aria-expanded={isAdvancedOpen}
            aria-controls="secretaria-advanced-filters"
            className="shrink-0"
          >
            <SlidersHorizontal size={14} />
            <span>Filtros avanzados</span>
            {advancedFilterCount > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold ${
                  isAdvancedOpen || advancedFilterCount > 0
                    ? 'bg-white/20 text-white'
                    : 'bg-[#01317b] text-white'
                }`}
              >
                {advancedFilterCount}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`}
            />
          </SecButton>
        </div>
      </div>

      {/* Barra rápida de Sección Scout + Contador de resultados */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
        {capabilities.branch && (
          <div
            className="flex flex-wrap items-center gap-1"
            role="group"
            aria-label="Filtrar por sección scout"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1.5">
              Sección:
            </span>
            {BRANCHES.map((branchName) => {
              const isSelected = filters.branch === branchName;
              const branchConfig =
                branchName !== 'Todas' ? getBranchVisualConfig(branchName) : null;
              return (
                <button
                  key={branchName}
                  type="button"
                  onClick={() => onChangeFilter('branch', branchName)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                    isSelected
                      ? 'bg-[#01317b] text-white shadow-[0_2px_6px_rgba(1,49,123,0.18)]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {branchConfig && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : branchConfig.dotColor
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span>{branchName}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
          <span>
            Mostrando <strong className="font-bold text-[#0c1933]">{totalMatchingCount}</strong> de{' '}
            <strong className="font-semibold text-slate-700">{totalSectionCount}</strong>{' '}
            {totalSectionCount === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>

      {/* Panel desplegable de Filtros Avanzados adaptado a los datos del apartado */}
      {isAdvancedOpen && (
        <div
          id="secretaria-advanced-filters"
          className={`${secTokens.surfaceSubtle} p-4 space-y-4 animate-sec-expand`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
                Filtros avanzados · {sectionSchema.label}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{sectionSchema.description}</p>
            </div>
            {activeChips.length > 0 && (
              <SecButton variant="destructive" size="sm" onClick={onClearAllFilters}>
                <RotateCcw size={12} /> Limpiar todos los filtros
              </SecButton>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Sección Scout en el panel avanzado */}
            {capabilities.branch && (
              <div>
                <label
                  htmlFor="filter-branch-select"
                  className="block text-[11px] font-semibold text-slate-700 mb-1.5"
                >
                  Sección scout
                </label>
                <SecFilterSelect
                  id="filter-branch-select"
                  value={filters.branch}
                  onChange={(e) => onChangeFilter('branch', e.target.value)}
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b === 'Todas' ? 'Todas las secciones' : b}
                    </option>
                  ))}
                </SecFilterSelect>
              </div>
            )}

            {/* Sexo */}
            {capabilities.gender && (
              <div>
                <label
                  htmlFor="filter-gender-select"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1.5"
                >
                  <Users size={12} className="text-slate-400" /> Sexo
                </label>
                <SecFilterSelect
                  id="filter-gender-select"
                  value={filters.gender}
                  onChange={(e) => onChangeFilter('gender', e.target.value as Gender | '')}
                >
                  <option value="">Todos</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="OTRO">Otro</option>
                </SecFilterSelect>
              </div>
            )}

            {/* Rango de edad */}
            {capabilities.ageAndBirthDate && (
              <div>
                <span className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Edad (años en ronda solar)
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    placeholder="Mín."
                    aria-label="Edad mínima"
                    value={filters.minAge}
                    onChange={(e) => onChangeFilter('minAge', e.target.value)}
                    className={secFilterControlClass()}
                  />
                  <input
                    type="number"
                    min={0}
                    max={99}
                    placeholder="Máx."
                    aria-label="Edad máxima"
                    value={filters.maxAge}
                    onChange={(e) => onChangeFilter('maxAge', e.target.value)}
                    className={secFilterControlClass()}
                  />
                </div>
              </div>
            )}

            {/* Subestado de inscripción cuando estamos en Inscripciones Pendientes */}
            {activeTab === 'OFFERED' && (
              <div>
                <label
                  htmlFor="filter-enrollment-substatus"
                  className="block text-[11px] font-semibold text-slate-700 mb-1.5"
                >
                  Fase de la inscripción
                </label>
                <SecFilterSelect
                  id="filter-enrollment-substatus"
                  value={filters.enrollmentSubStatus}
                  onChange={(e) =>
                    onChangeFilter(
                      'enrollmentSubStatus',
                      e.target.value as SecretariaFiltersState['enrollmentSubStatus'],
                    )
                  }
                >
                  <option value="ALL">Todas (enlace enviado + rellenadas)</option>
                  <option value="PLAZA_OFERTADA">Plaza ofertada (pendiente de familias)</option>
                  <option value="INSCRIPCION_COMPLETADA">
                    Inscripción completada (lista para censar)
                  </option>
                </SecFilterSelect>
              </div>
            )}

            {/* Nombre de tutor */}
            {capabilities.tutorData && (
              <div>
                <label
                  htmlFor="filter-tutor-input"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1.5"
                >
                  <User size={12} className="text-slate-400" /> Nombre o apellidos de tutor
                </label>
                <input
                  id="filter-tutor-input"
                  type="text"
                  placeholder="Ej. María Gómez..."
                  value={filters.tutorName}
                  onChange={(e) => onChangeFilter('tutorName', e.target.value)}
                  className={secFilterControlClass()}
                />
              </div>
            )}

            {/* Correo electrónico */}
            {capabilities.email && (
              <div>
                <label
                  htmlFor="filter-email-input"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1.5"
                >
                  <Mail size={12} className="text-slate-400" /> Correo electrónico
                </label>
                <input
                  id="filter-email-input"
                  type="text"
                  placeholder="Ej. familia@correo.es..."
                  value={filters.email}
                  onChange={(e) => onChangeFilter('email', e.target.value)}
                  className={secFilterControlClass()}
                />
              </div>
            )}

            {/* Teléfono */}
            {capabilities.phone && (
              <div>
                <label
                  htmlFor="filter-phone-input"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1.5"
                >
                  <Phone size={12} className="text-slate-400" /> Teléfono
                </label>
                <input
                  id="filter-phone-input"
                  type="text"
                  placeholder="Ej. 600112233..."
                  value={filters.phone}
                  onChange={(e) => onChangeFilter('phone', e.target.value)}
                  className={secFilterControlClass()}
                />
              </div>
            )}

            {/* Fecha de nacimiento (desde / hasta) */}
            {capabilities.ageAndBirthDate && (
              <div className="sm:col-span-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1.5">
                  <Calendar size={12} className="text-slate-400" /> Fecha de nacimiento (desde /
                  hasta)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    aria-label="Fecha de nacimiento desde"
                    placeholder="Desde (dd/mm/aaaa)"
                    size="sm"
                    value={filters.birthDateFrom}
                    max={filters.birthDateTo || getTodayIsoDate()}
                    defaultViewYear={new Date().getFullYear() - 10}
                    onValueChange={(iso) => onChangeFilter('birthDateFrom', iso)}
                  />
                  <DatePicker
                    aria-label="Fecha de nacimiento hasta"
                    placeholder="Hasta (dd/mm/aaaa)"
                    size="sm"
                    value={filters.birthDateTo}
                    min={filters.birthDateFrom || undefined}
                    max={getTodayIsoDate()}
                    defaultViewYear={new Date().getFullYear() - 10}
                    onValueChange={(iso) => onChangeFilter('birthDateTo', iso)}
                  />
                </div>
              </div>
            )}

            {/* Fecha de alta en el censo (SOLO en apartados donde exista ese dato, p. ej. Censo) */}
            {capabilities.admittedAt && (
              <div className="sm:col-span-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1.5">
                  <Calendar size={12} className="text-[#01317b]" /> Fecha de alta en el censo
                  (desde / hasta)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    aria-label="Fecha de alta en el censo desde"
                    placeholder="Desde (dd/mm/aaaa)"
                    size="sm"
                    value={filters.admittedFrom}
                    max={filters.admittedTo || getTodayIsoDate()}
                    onValueChange={(iso) => onChangeFilter('admittedFrom', iso)}
                  />
                  <DatePicker
                    aria-label="Fecha de alta en el censo hasta"
                    placeholder="Hasta (dd/mm/aaaa)"
                    size="sm"
                    value={filters.admittedTo}
                    min={filters.admittedFrom || undefined}
                    max={getTodayIsoDate()}
                    onValueChange={(iso) => onChangeFilter('admittedTo', iso)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filtro de Datos Incompletos adaptado a la fase del registro */}
          {capabilities.incompleteCheck && (
            <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.incompleteOnly}
                  onChange={(e) => onChangeFilter('incompleteOnly', e.target.checked)}
                  className={formCheckboxClass}
                />
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <AlertTriangle size={14} className="text-amber-600" />
                  {incompleteLabel}
                </span>
              </label>
              <span className="text-[11px] text-slate-500">
                {activeTab === 'INITIAL'
                  ? 'Evalúa únicamente los campos solicitados en el formulario inicial de contacto.'
                  : activeTab === 'CENSUS'
                    ? 'Evalúa los datos obligatorios censales, legales, médicos, SEPA y firmas.'
                    : 'Evalúa los campos obligatorios de la hoja de inscripción completa.'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Indicadores visuales de filtros activos (Chips) */}
      {activeChips.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1.5 pt-1"
          aria-label="Filtros activos aplicados"
        >
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Filtros activos:</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-full bg-[#01317b]/[0.07] text-[#000254] border border-[#01317b]/20 text-xs font-medium"
            >
              <span className="text-[#01317b] font-semibold">{chip.label}:</span>
              <span>{chip.valueLabel}</span>
              <button
                type="button"
                onClick={() => onClearFilter(chip.key)}
                aria-label={`Quitar filtro ${chip.label}`}
                className="p-0.5 rounded-full hover:bg-[#01317b]/15 text-[#01317b] transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAllFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline px-2 py-0.5 transition-colors cursor-pointer"
          >
            Limpiar todos
          </button>
        </div>
      )}
    </div>
  );
}
