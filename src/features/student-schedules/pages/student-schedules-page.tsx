import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ScheduleFilters } from '../components/schedule-filters';
import { ScheduleCalendar } from '../components/schedule-calendar';
import { ScheduleDetailModal } from '../components/schedule-detail-modal';
import { useStudentSchedules } from '../hooks/use-student-schedules';
import type {
  ScheduleClass,
  ScheduleStatus,
  ScheduleStatusFilter,
  ScheduleViewMode,
  StudentSchedule,
} from '../types/student-schedule.types';
import {
  getDayQueryRange,
  getMonthQueryRange,
  getWeekQueryRange,
  isScheduleUpcoming,
} from '../utils/schedule-date.utils';
import { getApiErrorMessage } from '@/lib/api-client';

export function StudentSchedulesPage() {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [statusFilter, setStatusFilter] = useState<ScheduleStatusFilter>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected schedule for modal detail
  const [selectedSchedule, setSelectedSchedule] = useState<StudentSchedule | null>(null);

  // Tính khoảng from và to theo viewMode hiện tại
  const queryRange = useMemo(() => {
    switch (viewMode) {
      case 'month':
        return getMonthQueryRange(currentDate);
      case 'week':
        return getWeekQueryRange(currentDate);
      case 'day':
        return getDayQueryRange(currentDate);
      default:
        return getMonthQueryRange(currentDate);
    }
  }, [viewMode, currentDate]);

  // Ánh xạ statusFilter sang Backend status param:
  // UPCOMING dùng SCHEDULED trên API, COMPLETED và CANCELLED dùng enum tương ứng
  const apiStatusParam: ScheduleStatus | undefined = useMemo(() => {
    if (statusFilter === 'UPCOMING') return 'SCHEDULED';
    if (statusFilter === 'COMPLETED') return 'COMPLETED';
    if (statusFilter === 'CANCELLED') return 'CANCELLED';
    return undefined;
  }, [statusFilter]);

  // Query dữ liệu lịch học
  const {
    data: rawSchedules = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useStudentSchedules({
    from: queryRange.from,
    to: queryRange.to,
    status: apiStatusParam,
    classId: selectedClassId || undefined,
  });

  // Trích xuất danh sách các lớp học có trong các buổi học để hiển thị dropdown lọc
  const classesList: ScheduleClass[] = useMemo(() => {
    const map = new Map<string, ScheduleClass>();
    for (const s of rawSchedules) {
      if (s.class && !map.has(s.class.id)) {
        map.set(s.class.id, s.class);
      }
    }
    return Array.from(map.values());
  }, [rawSchedules]);

  // Lọc client-side: UPCOMING (kiểm tra thêm thời gian hiện tại) và tìm kiếm theo chuỗi
  const filteredSchedules = useMemo(() => {
    let result = rawSchedules;

    // Lọc "Sắp diễn ra" theo thời gian hiện tại (endAt >= now)
    if (statusFilter === 'UPCOMING') {
      const now = new Date();
      result = result.filter((s) => isScheduleUpcoming(s, now));
    }

    // Lọc theo từ khóa tìm kiếm (tiêu đề, giáo viên, lớp)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const titleMatch = s.title.toLowerCase().includes(q);
        const descMatch = s.description?.toLowerCase().includes(q) ?? false;
        const teacherMatch = s.teacher?.fullName.toLowerCase().includes(q) ?? false;
        const classMatch = s.class?.name.toLowerCase().includes(q) ?? false;
        return titleMatch || descMatch || teacherMatch || classMatch;
      });
    }

    return result;
  }, [rawSchedules, statusFilter, searchQuery]);

  // Điều hướng thời gian
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch học của tôi"
        description="Theo dõi lịch học các lớp văn, ca học trực tiếp và phòng học trực tuyến"
      />

      {/* Bộ lọc và công cụ chuyển đổi chế độ xem */}
      <ScheduleFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        classes={classesList}
        selectedClassId={selectedClassId}
        onSelectClassId={setSelectedClassId}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      {/* Hiển thị lỗi nếu có */}
      {isError ? (
        <ErrorState
          title="Không thể tải lịch học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        /* Lịch học chính (Tháng / Tuần / Ngày) */
        <ScheduleCalendar
          viewMode={viewMode}
          currentDate={currentDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          schedules={filteredSchedules}
          onSelectSchedule={(s) => setSelectedSchedule(s)}
          isLoading={isLoading}
          isFetching={isFetching}
        />
      )}

      {/* Modal chi tiết buổi học */}
      <ScheduleDetailModal
        scheduleId={selectedSchedule?.id || null}
        initialSchedule={selectedSchedule}
        isOpen={Boolean(selectedSchedule)}
        onClose={() => setSelectedSchedule(null)}
      />
    </div>
  );
}
