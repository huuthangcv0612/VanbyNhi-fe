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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2">
      {typeof totalItems === 'number' && (
        <div className="text-xs sm:text-sm text-slate-500">
          Tổng cộng <span className="font-semibold text-slate-800">{totalItems}</span> bản ghi
          {totalPages > 1 && ` • Trang ${currentPage} / ${totalPages}`}
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Trước
        </Button>

        <span className="px-3 py-1 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 rounded-lg">
          {currentPage} / {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang kế tiếp"
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
