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
  ChevronUp,
} from 'lucide-react';
import type { Gender, SortField, SortOrder } from '../../services/api';
import {
  SECRETARIA_SECTIONS,
  SECRETARIA_SORT_OPTIONS,
  getActiveFilterChips,
  type SecretariaFiltersState,
  type SecretariaTab,
} from '../../utils/secretariaSearchFilter';

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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-[0_8px_28px_rgba(15,23,42,.04)] space-y-3.5">
      {/* Fila superior: Buscador inteligente + Ordenación + Botón de filtros avanzados */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Buscador principal */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Buscar registros en Secretaría"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 outline-none transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleImmediateClearSearch}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Controles de ordenación y desplegable de filtros avanzados */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Selector de ordenación */}
          <div className="relative flex items-center flex-1 sm:flex-initial min-w-[225px]">
            <ArrowUpDown
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 pointer-events-none"
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
              className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 outline-none transition cursor-pointer"
            >
              {availableSortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  Ordenar: {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botón desplegable de filtros avanzados */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen((prev) => !prev)}
            aria-expanded={isAdvancedOpen}
            aria-controls="secretaria-advanced-filters"
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-[.98] shrink-0 ${
              isAdvancedOpen || advancedFilterCount > 0
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filtros avanzados</span>
            {advancedFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold">
                {advancedFilterCount}
              </span>
            )}
            {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Barra rápida de Sección Scout + Contador de resultados */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
        {capabilities.branch && (
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filtrar por sección scout">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1.5">
              Sección:
            </span>
            {BRANCHES.map((branchName) => (
              <button
                key={branchName}
                type="button"
                onClick={() => onChangeFilter('branch', branchName)}
                aria-pressed={filters.branch === branchName}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[.97] ${
                  filters.branch === branchName
                    ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {branchName}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
          <span>
            Mostrando <strong className="font-bold text-slate-800">{totalMatchingCount}</strong> de{' '}
            <strong className="font-semibold text-slate-700">{totalSectionCount}</strong>{' '}
            {totalSectionCount === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>

      {/* Panel desplegable de Filtros Avanzados adaptado a los datos del apartado */}
      {isAdvancedOpen && (
        <div
          id="secretaria-advanced-filters"
          className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4 space-y-4 animate-fadeIn"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Filtros avanzados · {sectionSchema.label}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{sectionSchema.description}</p>
            </div>
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={onClearAllFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition"
              >
                <RotateCcw size={12} /> Limpiar todos los filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Sección Scout en el panel avanzado */}
            {capabilities.branch && (
              <div>
                <label
                  htmlFor="filter-branch-select"
                  className="block text-[11px] font-bold text-slate-700 mb-1"
                >
                  Sección scout
                </label>
                <select
                  id="filter-branch-select"
                  value={filters.branch}
                  onChange={(e) => onChangeFilter('branch', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b === 'Todas' ? 'Todas las secciones' : b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sexo */}
            {capabilities.gender && (
              <div>
                <label
                  htmlFor="filter-gender-select"
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1"
                >
                  <Users size={12} className="text-slate-400" /> Sexo
                </label>
                <select
                  id="filter-gender-select"
                  value={filters.gender}
                  onChange={(e) => onChangeFilter('gender', e.target.value as Gender | '')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                >
                  <option value="">Todos</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            )}

            {/* Rango de edad */}
            {capabilities.ageAndBirthDate && (
              <div>
                <span className="block text-[11px] font-bold text-slate-700 mb-1">
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
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    max={99}
                    placeholder="Máx."
                    aria-label="Edad máxima"
                    value={filters.maxAge}
                    onChange={(e) => onChangeFilter('maxAge', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Subestado de inscripción cuando estamos en Inscripciones Pendientes */}
            {activeTab === 'OFFERED' && (
              <div>
                <label
                  htmlFor="filter-enrollment-substatus"
                  className="block text-[11px] font-bold text-slate-700 mb-1"
                >
                  Fase de la inscripción
                </label>
                <select
                  id="filter-enrollment-substatus"
                  value={filters.enrollmentSubStatus}
                  onChange={(e) =>
                    onChangeFilter(
                      'enrollmentSubStatus',
                      e.target.value as SecretariaFiltersState['enrollmentSubStatus'],
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                >
                  <option value="ALL">Todas (enlace enviado + rellenadas)</option>
                  <option value="PLAZA_OFERTADA">Plaza ofertada (pendiente de familias)</option>
                  <option value="INSCRIPCION_COMPLETADA">
                    Inscripción completada (lista para censar)
                  </option>
                </select>
              </div>
            )}

            {/* Nombre de tutor */}
            {capabilities.tutorData && (
              <div>
                <label
                  htmlFor="filter-tutor-input"
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1"
                >
                  <User size={12} className="text-slate-400" /> Nombre o apellidos de tutor
                </label>
                <input
                  id="filter-tutor-input"
                  type="text"
                  placeholder="Ej. María Gómez..."
                  value={filters.tutorName}
                  onChange={(e) => onChangeFilter('tutorName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            {/* Correo electrónico */}
            {capabilities.email && (
              <div>
                <label
                  htmlFor="filter-email-input"
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1"
                >
                  <Mail size={12} className="text-slate-400" /> Correo electrónico
                </label>
                <input
                  id="filter-email-input"
                  type="text"
                  placeholder="Ej. familia@correo.es..."
                  value={filters.email}
                  onChange={(e) => onChangeFilter('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            {/* Teléfono */}
            {capabilities.phone && (
              <div>
                <label
                  htmlFor="filter-phone-input"
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1"
                >
                  <Phone size={12} className="text-slate-400" /> Teléfono
                </label>
                <input
                  id="filter-phone-input"
                  type="text"
                  placeholder="Ej. 600112233..."
                  value={filters.phone}
                  onChange={(e) => onChangeFilter('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            {/* Fecha de nacimiento (desde / hasta) */}
            {capabilities.ageAndBirthDate && (
              <div className="sm:col-span-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                  <Calendar size={12} className="text-slate-400" /> Fecha de nacimiento (desde /
                  hasta)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    aria-label="Fecha de nacimiento desde"
                    value={filters.birthDateFrom}
                    onChange={(e) => onChangeFilter('birthDateFrom', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="date"
                    aria-label="Fecha de nacimiento hasta"
                    value={filters.birthDateTo}
                    onChange={(e) => onChangeFilter('birthDateTo', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Fecha de alta en el censo (SOLO en apartados donde exista ese dato, p. ej. Censo) */}
            {capabilities.admittedAt && (
              <div className="sm:col-span-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                  <Calendar size={12} className="text-indigo-500" /> Fecha de alta en el censo
                  (desde / hasta)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    aria-label="Fecha de alta en el censo desde"
                    value={filters.admittedFrom}
                    onChange={(e) => onChangeFilter('admittedFrom', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="date"
                    aria-label="Fecha de alta en el censo hasta"
                    value={filters.admittedTo}
                    onChange={(e) => onChangeFilter('admittedTo', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filtro de Datos Incompletos adaptado a la fase del registro */}
          {capabilities.incompleteCheck && (
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.incompleteOnly}
                  onChange={(e) => onChangeFilter('incompleteOnly', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
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
          <span className="text-[11px] font-bold text-slate-500 mr-1">Filtros activos:</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200/80 text-xs font-semibold"
            >
              <span className="text-indigo-600/90 font-bold">{chip.label}:</span>
              <span>{chip.valueLabel}</span>
              <button
                type="button"
                onClick={() => onClearFilter(chip.key)}
                aria-label={`Quitar filtro ${chip.label}`}
                className="p-0.5 rounded-full hover:bg-indigo-200/70 text-indigo-700 transition"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAllFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline px-2 py-0.5 transition"
          >
            Limpiar todos
          </button>
        </div>
      )}
    </div>
  );
}
