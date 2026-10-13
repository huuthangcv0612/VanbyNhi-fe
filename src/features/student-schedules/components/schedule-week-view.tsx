import { useEffect, useRef } from 'react';
import type { StudentSchedule } from '../types/student-schedule.types';
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  HOUR_HEIGHT_PX,
  WEEKDAY_NAMES_FULL,
  WEEKDAY_NAMES_SHORT,
  formatDateKey,
  formatTimeVN,
  getMinutesFromMidnightVN,
  getScheduleStatusMeta,
  getWeekDays,
  isScheduleUpcoming,
  isTodayVN,
  layoutDaySchedules,
} from '../utils/schedule-date.utils';
import { cn } from '@/utils/cn';

export interface ScheduleWeekViewProps {
  currentDate: Date;
  schedules: StudentSchedule[];
  onSelectSchedule: (schedule: StudentSchedule) => void;
}

export function ScheduleWeekView({
  currentDate,
  schedules,
  onSelectSchedule,
}: ScheduleWeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekDays = getWeekDays(currentDate);

  const totalHours = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
  const hoursArray = Array.from({ length: totalHours }, (_, i) => CALENDAR_START_HOUR + i);

  // Cuộn tự động đến khoảng 07:30 khi mở chế độ xem tuần
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollPos = (7.5 - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPos);
    }
  }, []);

  // Tính vị trí vạch giờ hiện tại nếu đang trong khoảng
  const now = new Date();
  const currentMinutes = getMinutesFromMidnightVN(now);
  const isCurrentTimeInRange =
    currentMinutes >= CALENDAR_START_HOUR * 60 && currentMinutes <= CALENDAR_END_HOUR * 60;
  const currentTimeTopPx =
    ((currentMinutes - CALENDAR_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto max-h-[720px] relative scrollbar-thin"
      >
        <div className="min-w-[760px] sm:min-w-[900px] flex flex-col">
          {/* Sticky Weekday Header */}
          <div className="sticky top-0 z-30 flex bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
            {/* Hour axis corner */}
            <div className="w-16 shrink-0 py-3 text-center border-r border-slate-200 text-xs font-semibold text-slate-500">
              Giờ
            </div>

            {/* 7 Columns */}
            <div className="grid grid-cols-7 flex-1 divide-x divide-slate-200">
              {weekDays.map((day, idx) => {
                const isToday = isTodayVN(day);
                return (
                  <div
                    key={formatDateKey(day)}
                    className={cn(
                      'py-2.5 px-2 text-center transition-colors',
                      isToday && 'bg-amber-50/60',
                    )}
                  >
                    <p className="text-[11px] font-semibold text-slate-500">
                      <span className="hidden sm:inline">{WEEKDAY_NAMES_FULL[idx]}</span>
                      <span className="sm:hidden">{WEEKDAY_NAMES_SHORT[idx]}</span>
                    </p>
                    <p
                      className={cn(
                        'mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold tabular-nums',
                        isToday
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-800',
                      )}
                    >
                      {day.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time grid body */}
          <div className="flex relative">
            {/* Time labels column */}
            <div className="w-16 shrink-0 border-r border-slate-200 select-none bg-slate-50/30">
              {hoursArray.map((hour) => (
                <div
                  key={hour}
                  style={{ height: `${HOUR_HEIGHT_PX}px` }}
                  className="border-b border-slate-100 pr-2 text-right text-[11px] font-medium text-slate-400 -translate-y-2 tabular-nums"
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* 7 Day columns with grid lines */}
            <div className="grid grid-cols-7 flex-1 divide-x divide-slate-200 relative">
              {weekDays.map((day) => {
                const dayKey = formatDateKey(day);
                const isToday = isTodayVN(day);
                const positionedSchedules = layoutDaySchedules(schedules, day);

                return (
                  <div
                    key={dayKey}
                    className={cn(
                      'relative h-full transition-colors',
                      isToday && 'bg-amber-50/20',
                    )}
                    style={{ height: `${totalHours * HOUR_HEIGHT_PX}px` }}
                  >
                    {/* Horizontal hour lines */}
                    {hoursArray.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: `${HOUR_HEIGHT_PX}px` }}
                        className="border-b border-slate-100 pointer-events-none"
                      />
                    ))}

                    {/* Vạch kẻ giờ hiện tại */}
                    {isToday && isCurrentTimeInRange && (
                      <div
                        style={{ top: `${currentTimeTopPx}px` }}
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 -ml-1 ring-2 ring-white" />
                        <span className="flex-1 border-t-2 border-rose-500" />
                      </div>
                    )}

                    {/* Positioned Schedule Cards */}
                    {positionedSchedules.map((pos) => {
                      const schedule = pos.schedule;
                      const isUpcoming = isScheduleUpcoming(schedule);
                      const statusMeta = getScheduleStatusMeta(schedule.status, isUpcoming);

                      return (
                        <div
                          key={schedule.id}
                          onClick={() => onSelectSchedule(schedule)}
                          style={{
                            top: `${pos.topPx}px`,
                            height: `${pos.heightPx}px`,
                            left: `${pos.leftPercent}%`,
                            width: `${pos.widthPercent}%`,
                          }}
                          className={cn(
                            'absolute z-10 p-1.5 rounded-lg border text-left overflow-hidden cursor-pointer transition-all hover:z-20 hover:shadow-md select-none',
                            schedule.status === 'CANCELLED'
                              ? 'bg-rose-50/90 border-rose-300 text-rose-800 opacity-85'
                              : schedule.status === 'COMPLETED'
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                                : isUpcoming
                                  ? 'bg-amber-50/95 border-amber-300 text-amber-900 ring-1 ring-amber-200'
                                  : 'bg-white/95 border-slate-300 text-slate-800 shadow-2xs',
                          )}
                          title={`${schedule.title} (${formatTimeVN(schedule.startAt)} - ${formatTimeVN(schedule.endAt)})`}
                        >
                          <div className="flex items-center gap-1 mb-0.5 truncate">
                            <span
                              className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusMeta.dotColor)}
                            />
                            <span className="text-[10px] font-bold tabular-nums text-slate-700 shrink-0">
                              {formatTimeVN(schedule.startAt)}
                            </span>
                            {schedule.class && (
                              <span className="text-[9px] font-semibold px-1 rounded bg-slate-100 text-slate-600 truncate">
                                {schedule.class.classCode}
                              </span>
                            )}
                          </div>

                          <p
                            className={cn(
                              'text-[11px] font-semibold leading-tight line-clamp-2',
                              schedule.status === 'CANCELLED' && 'line-through text-slate-500',
                            )}
                          >
                            {schedule.title}
                          </p>

                          {pos.heightPx > 48 && schedule.teacher && (
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {schedule.teacher.fullName}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
