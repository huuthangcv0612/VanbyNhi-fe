import { useEffect, useRef } from 'react';
import type { CalendarEvent } from '../types/teacher-calendar.types';
import {
  WEEKDAY_NAMES_FULL,
  WEEKDAY_NAMES_SHORT,
  formatDateKey,
  getWeekDays,
  isTodayVN,
} from '../utils/date-utils';
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  HOUR_HEIGHT_PX,
  getMinutesFromMidnightVN,
  layoutDayEvents,
} from '../utils/calendar-layout';
import { EventCard } from './EventCard';
import { cn } from '@/utils/cn';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDateTime: (date: Date, hour: number) => void;
}

export function WeekView({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventOnDateTime,
}: WeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekDays = getWeekDays(currentDate);

  const totalHours = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
  const hoursArray = Array.from({ length: totalHours }, (_, i) => CALENDAR_START_HOUR + i);

  // Auto scroll to 7:00 AM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollPos = (7 - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPos);
    }
  }, []);

  // Tính vị trí vạch giờ hiện tại
  const now = new Date();
  const currentMinutes = getMinutesFromMidnightVN(now);
  const isCurrentTimeInRange =
    currentMinutes >= CALENDAR_START_HOUR * 60 && currentMinutes <= CALENDAR_END_HOUR * 60;
  const currentTimeTopPx =
    ((currentMinutes - CALENDAR_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto max-h-[750px] relative"
      >
        <div className="min-w-[760px] sm:min-w-[900px] flex flex-col">
          {/* Sticky Weekday Headers */}
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
                        'mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                        isToday
                          ? 'bg-amber-600 text-white shadow-xs'
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

          {/* Time Grid Body */}
          <div className="flex relative">
            {/* Time labels axis (left) */}
            <div className="w-16 shrink-0 select-none border-r border-slate-200 bg-slate-50/30">
              {hoursArray.map((hour) => (
                <div
                  key={hour}
                  style={{ height: `${HOUR_HEIGHT_PX}px` }}
                  className="relative border-b border-slate-100 text-[11px] font-semibold text-slate-500 text-right pr-2 pt-1"
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* 7 Day Columns with Slots and Event Blocks */}
            <div className="grid grid-cols-7 flex-1 divide-x divide-slate-200 relative">
              {weekDays.map((day) => {
                const isToday = isTodayVN(day);
                const positionedEvents = layoutDayEvents(
                  events,
                  day,
                  CALENDAR_START_HOUR,
                  CALENDAR_END_HOUR,
                  HOUR_HEIGHT_PX,
                );

                return (
                  <div
                    key={formatDateKey(day)}
                    className={cn('relative', isToday && 'bg-amber-50/20')}
                  >
                    {/* Hour slots (for click-to-create) */}
                    {hoursArray.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: `${HOUR_HEIGHT_PX}px` }}
                        onClick={() => onCreateEventOnDateTime(day, hour)}
                        className="border-b border-slate-100 hover:bg-amber-50/40 transition-colors cursor-pointer group relative"
                        title={`Bấm để lên lịch vào ${hour}:00`}
                      >
                        <span className="hidden group-hover:block absolute left-2 top-2 text-[10px] text-amber-700 font-medium">
                          + {hour}:00
                        </span>
                      </div>
                    ))}

                    {/* Today current time indicator line */}
                    {isToday && isCurrentTimeInRange && (
                      <div
                        style={{ top: `${currentTimeTopPx}px` }}
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-600 -ml-1.5 shadow-xs" />
                        <div className="flex-1 h-0.5 bg-rose-500 shadow-xs" />
                      </div>
                    )}

                    {/* Positioned Event Cards */}
                    {positionedEvents.map(({ event, topPx, heightPx, leftPercent, widthPercent }) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        variant="week"
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        onClick={() => onSelectEvent(event)}
                      />
                    ))}
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
