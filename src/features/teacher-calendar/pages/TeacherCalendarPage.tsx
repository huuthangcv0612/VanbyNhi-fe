import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CalendarToolbar } from '../components/CalendarToolbar';
import { MonthView } from '../components/MonthView';
import { WeekView } from '../components/WeekView';
import { EventDetailModal } from '../components/EventDetailModal';
import { EventFormModal } from '../components/EventFormModal';
import { LabelManagerModal } from '../components/LabelManagerModal';
import { useTeacherEvents } from '../hooks/useTeacherEvents';
import { useTeacherLabels } from '../hooks/useTeacherLabels';
import type {
  CalendarEvent,
  CalendarViewMode,
} from '../types/teacher-calendar.types';
import {
  formatMonthTitleVN,
  formatWeekRangeVN,
  getMonthGrid,
  getStartOfWeek,
  getEndOfWeek,
} from '../utils/date-utils';
import { getApiErrorMessage } from '@/lib/api-client';

export function TeacherCalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedLabelId, setSelectedLabelId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [formInitialDate, setFormInitialDate] = useState<Date | undefined>(undefined);
  const [formInitialHour, setFormInitialHour] = useState<number | undefined>(undefined);

  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(
    null,
  );
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);

  // Tính toán khoảng thời gian truy vấn theo viewMode
  const queryRange = useMemo(() => {
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const grid = getMonthGrid(year, month);
      const gridStart = new Date(grid[0]);
      gridStart.setHours(0, 0, 0, 0);

      const gridEnd = new Date(grid[grid.length - 1]);
      gridEnd.setHours(23, 59, 59, 999);

      return {
        from: gridStart.toISOString(),
        to: gridEnd.toISOString(),
      };
    } else {
      const start = getStartOfWeek(currentDate);
      const end = getEndOfWeek(currentDate);
      return {
        from: start.toISOString(),
        to: end.toISOString(),
      };
    }
  }, [viewMode, currentDate]);

  // Labels query
  const { data: labels = [] } = useTeacherLabels();

  // Events query
  const {
    data: rawEvents = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useTeacherEvents({
    from: queryRange.from,
    to: queryRange.to,
    labelId: selectedLabelId || undefined,
  });

  // Client-side search and label filter
  const filteredEvents = useMemo(() => {
    let result = rawEvents;

    if (selectedLabelId) {
      result = result.filter(
        (ev) => ev.labelId === selectedLabelId || ev.label?.id === selectedLabelId,
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((ev) => {
        const titleMatch = ev.title?.toLowerCase().includes(q);
        const addressMatch = (ev.address || ev.location || '')
          .toLowerCase()
          .includes(q);
        const notesMatch = (ev.notes || ev.description || '')
          .toLowerCase()
          .includes(q);
        return titleMatch || addressMatch || notesMatch;
      });
    }

    return result;
  }, [rawEvents, selectedLabelId, searchQuery]);

  // Điều hướng thời gian
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Mở form tạo mới từ toolbar
  const handleOpenCreateForm = () => {
    setEventToEdit(null);
    setFormInitialDate(currentDate);
    setFormInitialHour(8);
    setIsFormOpen(true);
  };

  // Mở form tạo mới từ click vào ngày
  const handleCreateOnDate = (date: Date) => {
    setEventToEdit(null);
    setFormInitialDate(date);
    setFormInitialHour(8);
    setIsFormOpen(true);
  };

  // Mở form tạo mới từ click vào giờ trong WeekView
  const handleCreateOnDateTime = (date: Date, hour: number) => {
    setEventToEdit(null);
    setFormInitialDate(date);
    setFormInitialHour(hour);
    setIsFormOpen(true);
  };

  // Xem chi tiết sự kiện
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEventForDetail(event);
  };

  // Bấm sửa sự kiện từ detail
  const handleEditFromDetail = (event: CalendarEvent) => {
    setEventToEdit(event);
    setFormInitialDate(undefined);
    setFormInitialHour(undefined);
    setIsFormOpen(true);
  };

  // Tiêu đề thanh công cụ
  const toolbarTitle =
    viewMode === 'month'
      ? formatMonthTitleVN(currentDate)
      : formatWeekRangeVN(currentDate);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Lịch giảng dạy"
        description="Quản lý lịch trình giảng dạy, các ca dạy văn, phòng học trực tuyến và học sinh tham gia"
        action={
          <Button
            type="button"
            variant="primary"
            onClick={handleOpenCreateForm}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-amber-700 hover:bg-amber-800 text-white shadow-xs"
          >
            Tạo lịch
          </Button>
        }
      />

      {/* Calendar Toolbar */}
      <CalendarToolbar
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        title={toolbarTitle}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onCreateEvent={handleOpenCreateForm}
        onOpenLabelManager={() => setIsLabelManagerOpen(true)}
        labels={labels}
        selectedLabelId={selectedLabelId}
        onSelectLabelId={setSelectedLabelId}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        isFetching={isFetching}
      />

      {/* Main Calendar Views */}
      {isError ? (
        <ErrorState
          title="Không thể tải lịch giảng dạy"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-700">Đang đồng bộ lịch giảng dạy...</p>
        </div>
      ) : (
        <div>
          {viewMode === 'month' ? (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onCreateEventOnDate={handleCreateOnDate}
            />
          ) : (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onCreateEventOnDateTime={handleCreateOnDateTime}
            />
          )}
        </div>
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={Boolean(selectedEventForDetail)}
        onClose={() => setSelectedEventForDetail(null)}
        event={selectedEventForDetail}
        onEdit={handleEditFromDetail}
      />

      {/* Event Create / Edit Form Modal */}
      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        initialDate={formInitialDate}
        initialHour={formInitialHour}
        labels={labels}
      />

      {/* Personal Labels Manager Modal */}
      <LabelManagerModal
        isOpen={isLabelManagerOpen}
        onClose={() => setIsLabelManagerOpen(false)}
      />
    </div>
  );
}
