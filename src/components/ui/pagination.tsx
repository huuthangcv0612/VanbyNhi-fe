import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-1">
      {typeof totalItems === 'number' && (
        <div className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
          Tổng cộng <span className="font-semibold text-slate-800">{totalItems}</span> bản ghi
          {totalPages > 1 && ` • Trang ${currentPage} / ${totalPages}`}
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:ml-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          className="min-h-[40px] sm:min-h-[34px] px-2 sm:px-3"
        >
          <span className="hidden sm:inline">Trước</span>
        </Button>

        <span className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl min-h-[36px] flex items-center justify-center font-mono">
          {currentPage} / {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang kế tiếp"
          rightIcon={<ChevronRight className="w-4 h-4" />}
          className="min-h-[40px] sm:min-h-[34px] px-2 sm:px-3"
        >
          <span className="hidden sm:inline">Sau</span>
        </Button>
      </div>
    </div>
  );
}
