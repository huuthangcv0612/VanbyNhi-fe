import { useState } from 'react';
import type { StudentSchedule } from '../types/student-schedule.types';
import {
  WEEKDAY_NAMES_FULL,
  WEEKDAY_NAMES_SHORT,
  formatDateKey,
  formatDateVN,
  getMonthGrid,
  isSameDayVN,
  isTodayVN,
} from '../utils/schedule-date.utils';
import { ScheduleCard } from './schedule-card';
import { cn } from '@/utils/cn';

export interface ScheduleMonthViewProps {
  currentDate: Date;
  schedules: StudentSchedule[];
  onSelectSchedule: (schedule: StudentSchedule) => void;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

export function ScheduleMonthView({
  currentDate,
  schedules,
  onSelectSchedule,
  selectedDate,
  onSelectDate,
}: ScheduleMonthViewProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(
    selectedDate || currentDate,
  );

  const activeDate = selectedDate || internalSelectedDate;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const gridDays = getMonthGrid(year, month);

  // Nhóm lịch học theo ngày (YYYY-MM-DD theo giờ Việt Nam)
  const schedulesByDate = new Map<string, StudentSchedule[]>();
  for (const item of schedules) {
    const key = formatDateKey(new Date(item.startAt));
    const list = schedulesByDate.get(key) || [];
    list.push(item);
    schedulesByDate.set(key, list);
  }

  // Sắp xếp lịch học trong ngày theo giờ bắt đầu
  schedulesByDate.forEach((list) => {
    list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  });

  const activeDateKey = formatDateKey(activeDate);
  const activeDaySchedules = schedulesByDate.get(activeDateKey) || [];

  const handleDayClick = (day: Date) => {
    setInternalSelectedDate(day);
    onSelectDate?.(day);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Weekday Header: 7 cột từ Thứ Hai đến Chủ Nhật */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center">
          {WEEKDAY_NAMES_FULL.map((name, idx) => (
            <div
              key={name}
              className="py-2.5 px-1 sm:px-2 text-xs font-semibold text-slate-700 tracking-wide border-r border-slate-200 last:border-r-0"
            >
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{WEEKDAY_NAMES_SHORT[idx]}</span>
            </div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/40">
          {gridDays.map((day) => {
            const dayKey = formatDateKey(day);
            const daySchedules = schedulesByDate.get(dayKey) || [];
            const isCurrentMonth = day.getMonth() === month;
            const isToday = isTodayVN(day);
            const isSelected = isSameDayVN(day, activeDate);

            const maxVisible = 2;
            const visibleSchedules = daySchedules.slice(0, maxVisible);
            const remainingCount = daySchedules.length - maxVisible;

            return (
              <div
                key={dayKey}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'min-h-[90px] sm:min-h-[120px] lg:min-h-[135px] p-1 sm:p-2 bg-white flex flex-col justify-between transition-colors relative cursor-pointer group',
                  !isCurrentMonth && 'bg-slate-50/70 text-slate-400',
                  isSelected && 'ring-2 ring-inset ring-amber-500 bg-amber-50/15',
                )}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold tabular-nums',
                      isToday
                        ? 'bg-amber-600 text-white font-bold shadow-2xs'
                        : isCurrentMonth
                          ? 'text-slate-800 group-hover:text-amber-700'
                          : 'text-slate-400',
                    )}
                  >
                    {day.getDate()}
                  </span>

                  {daySchedules.length > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
                      {daySchedules.length}
                    </span>
                  )}
                </div>

                {/* Schedules preview */}
                <div className="flex-1 space-y-1 overflow-hidden my-0.5">
                  {visibleSchedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      compact
                      onClick={() => onSelectSchedule(schedule)}
                    />
                  ))}
                </div>

                {/* Remaining count tag */}
                {remainingCount > 0 && (
                  <div className="mt-auto pt-0.5 text-center sm:text-left">
                    <span className="text-[10px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md">
                      +{remainingCount} buổi khác
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel (Hiển thị danh sách buổi học của ngày được chọn) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 font-serif">
              Lịch học ngày {formatDateVN(activeDate)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeDaySchedules.length > 0
                ? `Có ${activeDaySchedules.length} buổi học được lên lịch trong ngày này`
                : 'Không có buổi học nào trong ngày được chọn'}
            </p>
          </div>

          {isTodayVN(activeDate) && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              Hôm nay
            </span>
          )}
        </div>

        {activeDaySchedules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeDaySchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onClick={() => onSelectSchedule(schedule)}
                showJoinButton
              />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            Nhấn vào các ngày trên lịch để xem các buổi học tương ứng.
          </div>
        )}
      </div>
    </div>
  );
}
