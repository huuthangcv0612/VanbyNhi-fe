import {
  Filter,
  Search,
  BookOpen,
} from 'lucide-react';
import type {
  ScheduleClass,
  ScheduleStatusFilter,
  ScheduleViewMode,
} from '../types/student-schedule.types';
import { cn } from '@/utils/cn';

export interface ScheduleFiltersProps {
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  statusFilter: ScheduleStatusFilter;
  onStatusFilterChange: (status: ScheduleStatusFilter) => void;
  classes: ScheduleClass[];
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function ScheduleFilters({
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  classes,
  selectedClassId,
  onSelectClassId,
  searchQuery,
  onSearchQueryChange,
}: ScheduleFiltersProps) {
  const statusOptions: Array<{ value: ScheduleStatusFilter; label: string }> = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'UPCOMING', label: 'Sắp diễn ra' },
    { value: 'COMPLETED', label: 'Đã hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <div className="flex flex-col gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* View Mode Toggle: Tháng / Tuần / Ngày */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 self-start sm:self-auto border border-slate-200/60">
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={cn(
              'px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer',
              viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Tháng
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={cn(
              'px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer',
              viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Tuần
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('day')}
            className={cn(
              'px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer',
              viewMode === 'day'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Ngày
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Tìm theo tên buổi, giáo viên..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Second row: Status Filters and Class Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Trạng thái:</span>
          </span>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusFilterChange(opt.value)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer',
                statusFilter === opt.value
                  ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-800',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Class Filter Dropdown (nếu có lớp học từ dữ liệu) */}
        {classes.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => onSelectClassId(e.target.value)}
              aria-label="Lọc theo lớp học"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            >
              <option value="">Tất cả lớp học ({classes.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
