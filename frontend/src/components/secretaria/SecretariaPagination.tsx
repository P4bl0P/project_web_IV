import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SecButton } from './secretariaTheme';
import { secTokens } from './secretariaTokens';

interface SecretariaPaginationProps {
  pageOffset: number;
  pageSize: number;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSizeOptions: number[];
  onPageSizeChange: (nextSize: number) => void;
  onPageChange: (nextPage: number) => void;
}

export default function SecretariaPagination({
  pageOffset,
  pageSize,
  totalCount,
  currentPage,
  totalPages,
  pageSizeOptions,
  onPageSizeChange,
  onPageChange,
}: SecretariaPaginationProps) {
  return (
    <div className={`${secTokens.surface} flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5`}>
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
        <span>
          Mostrando{' '}
          <strong className="font-bold text-[#0c1933]">{pageOffset + 1}</strong> -{' '}
          <strong className="font-bold text-[#0c1933]">
            {Math.min(pageOffset + pageSize, totalCount)}
          </strong>{' '}
          de <strong className="font-bold text-[#0c1933]">{totalCount}</strong>
        </span>
        <span className="text-slate-300" aria-hidden="true">|</span>
        <label className="inline-flex items-center gap-1.5">
          <span>Por página:</span>
          <select
            aria-label="Registros por página"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 px-2.5 rounded-lg border border-slate-200/95 bg-[#f8f9fc] hover:border-slate-300 text-xs font-semibold text-slate-700 focus:border-[#01317b] outline-none cursor-pointer transition-colors"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <SecButton
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            <ChevronLeft size={14} /> Anterior
          </SecButton>
          <span className="text-xs font-medium text-slate-600 px-2">
            Página <strong className="font-bold text-[#0c1933]">{currentPage}</strong> de{' '}
            <strong className="font-bold text-[#0c1933]">{totalPages}</strong>
          </span>
          <SecButton
            variant="secondary"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          >
            Siguiente <ChevronRight size={14} />
          </SecButton>
        </div>
      )}
    </div>
  );
}
