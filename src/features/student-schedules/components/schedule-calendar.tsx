import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type {
  ScheduleViewMode,
  StudentSchedule,
} from '../types/student-schedule.types';
import {
  formatFullDateVN,
  formatMonthTitleVN,
  formatWeekRangeVN,
} from '../utils/schedule-date.utils';
import { Button } from '@/components/ui/button';
import { ScheduleMonthView } from './schedule-month-view';
import { ScheduleWeekView } from './schedule-week-view';
import { ScheduleDayView } from './schedule-day-view';
import { Skeleton } from '@/components/ui/skeleton';

export interface ScheduleCalendarProps {
  viewMode: ScheduleViewMode;
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  schedules: StudentSchedule[];
  onSelectSchedule: (schedule: StudentSchedule) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

export function ScheduleCalendar({
  viewMode,
  currentDate,
  onPrev,
  onNext,
  onToday,
  schedules,
  onSelectSchedule,
  isLoading = false,
  isFetching = false,
}: ScheduleCalendarProps) {
  // Tiêu đề khoảng thời gian hiển thị
  const getRangeTitle = () => {
    switch (viewMode) {
      case 'month':
        return formatMonthTitleVN(currentDate);
      case 'week':
        return formatWeekRangeVN(currentDate);
      case 'day':
        return formatFullDateVN(currentDate);
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToday}
            className="font-medium text-slate-700 hover:text-slate-900 border-slate-300"
          >
            Hôm nay
          </Button>

          <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5">
            <button
              type="button"
              onClick={onPrev}
              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              aria-label="Khoảng thời gian trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              aria-label="Khoảng thời gian kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-amber-600 hidden sm:block" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif tracking-tight">
              {getRangeTitle()}
            </h2>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
          {isFetching && (
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang đồng bộ...</span>
            </div>
          )}
          <span className="text-slate-400">
            Tổng cộng: <strong className="text-slate-700">{schedules.length}</strong> buổi học
          </span>
        </div>
      </div>

      {/* View Content */}
      {isLoading ? (
        <div className="space-y-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-7 gap-2 pt-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 sm:h-28 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'month' && (
            <ScheduleMonthView
              currentDate={currentDate}
              schedules={schedules}
              onSelectSchedule={onSelectSchedule}
            />
          )}

          {viewMode === 'week' && (
            <ScheduleWeekView
              currentDate={currentDate}
              schedules={schedules}
              onSelectSchedule={onSelectSchedule}
            />
          )}

          {viewMode === 'day' && (
            <ScheduleDayView
              currentDate={currentDate}
              schedules={schedules}
              onSelectSchedule={onSelectSchedule}
              onGoToday={onToday}
            />
          )}
        </>
      )}
    </div>
  );
}
