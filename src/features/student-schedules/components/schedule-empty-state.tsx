import { Calendar, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ScheduleEmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
  onGoToday?: () => void;
}

export function ScheduleEmptyState({
  title = 'Không có lịch học nào',
  description = 'Hiện tại bạn không có buổi học nào trong khoảng thời gian này.',
  onResetFilters,
  onGoToday,
}: ScheduleEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-2xl border border-dashed border-slate-200 bg-white/70">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4 shadow-2xs border border-amber-100">
        <Calendar className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1.5">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-5 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-3">
        {onGoToday && (
          <Button variant="outline" size="sm" onClick={onGoToday}>
            Xem lịch hôm nay
          </Button>
        )}
        {onResetFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Đặt lại bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
