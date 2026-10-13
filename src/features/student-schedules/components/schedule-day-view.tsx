import type { StudentSchedule } from '../types/student-schedule.types';
import {
  formatDayTitleVN,
  formatDateKey,
  isTodayVN,
} from '../utils/schedule-date.utils';
import { ScheduleCard } from './schedule-card';
import { ScheduleEmptyState } from './schedule-empty-state';

export interface ScheduleDayViewProps {
  currentDate: Date;
  schedules: StudentSchedule[];
  onSelectSchedule: (schedule: StudentSchedule) => void;
  onGoToday?: () => void;
}

export function ScheduleDayView({
  currentDate,
  schedules,
  onSelectSchedule,
  onGoToday,
}: ScheduleDayViewProps) {
  const currentDateKey = formatDateKey(currentDate);

  // Lọc lịch của ngày đang chọn
  const daySchedules = schedules
    .filter((s) => formatDateKey(new Date(s.startAt)) === currentDateKey)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const isToday = isTodayVN(currentDate);

  return (
    <div className="flex flex-col gap-4">
      {/* Day header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
            {formatDayTitleVN(currentDate)}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {daySchedules.length > 0
              ? `Có ${daySchedules.length} buổi học được sắp xếp trong ngày này`
              : 'Không có buổi học nào'}
          </p>
        </div>

        {isToday && (
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Hôm nay
          </span>
        )}
      </div>

      {/* Schedules list or Empty State */}
      {daySchedules.length === 0 ? (
        <ScheduleEmptyState
          title={`Không có buổi học nào vào ${isToday ? 'hôm nay' : 'ngày này'}`}
          description="Bạn có thể chuyển sang các ngày khác hoặc xem theo chế độ Tuần / Tháng để theo dõi toàn bộ lịch học môn Văn."
          onGoToday={!isToday ? onGoToday : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daySchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onClick={() => onSelectSchedule(schedule)}
              showJoinButton
            />
          ))}
        </div>
      )}
    </div>
  );
}
