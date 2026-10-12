import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Tag,
  Search,
  Loader2,
} from 'lucide-react';
import type { CalendarLabel, CalendarViewMode } from '../types/teacher-calendar.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface CalendarToolbarProps {
  viewMode: CalendarViewMode;
  onChangeViewMode: (mode: CalendarViewMode) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreateEvent: () => void;
  onOpenLabelManager: () => void;
  labels: CalendarLabel[];
  selectedLabelId: string;
  onSelectLabelId: (id: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  isFetching?: boolean;
}

export function CalendarToolbar({
  viewMode,
  onChangeViewMode,
  title,
  onPrev,
  onNext,
  onToday,
  onCreateEvent,
  onOpenLabelManager,
  labels,
  selectedLabelId,
  onSelectLabelId,
  searchQuery,
  onSearchQueryChange,
  isFetching = false,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Top row: Date navigation & Primary actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Today, Prev/Next, Month/Week Range Title */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
              aria-label="Thời gian trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              aria-label="Thời gian kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-serif">
              {title}
            </h2>
            {isFetching && (
              <span title="Đang đồng bộ...">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
              </span>
            )}
          </div>
        </div>

        {/* Right: Segmented Control & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View mode segmented control */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onChangeViewMode('month')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('week')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Tuần
            </button>
          </div>

          {/* Manage labels */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenLabelManager}
            leftIcon={<Tag className="w-3.5 h-3.5 text-amber-700" />}
            className="text-xs border-slate-300"
          >
            Nhãn màu
          </Button>

          {/* Create event button */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onCreateEvent}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-amber-700 hover:bg-amber-800 text-white shadow-xs"
          >
            + Tạo lịch
          </Button>
        </div>
      </div>

      {/* Bottom row: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Tìm kiếm ca dạy, địa chỉ..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>

        {/* Filter by label */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Lọc theo nhãn:
          </label>
          <select
            value={selectedLabelId}
            onChange={(e) => onSelectLabelId(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-[200px]"
          >
            <option value="">Tất cả nhãn</option>
            {labels.map((lbl) => (
              <option key={lbl.id} value={lbl.id}>
                {lbl.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
