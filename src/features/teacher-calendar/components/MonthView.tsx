import { useState } from 'react';
import type { CalendarEvent } from '../types/teacher-calendar.types';
import {
  WEEKDAY_NAMES_FULL,
  WEEKDAY_NAMES_SHORT,
  formatDateKey,
  getMonthGrid,
  isSameDayVN,
  isTodayVN,
} from '../utils/date-utils';
import { EventCard } from './EventCard';
import { DayEventsModal } from './DayEventsModal';
import { cn } from '@/utils/cn';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
}

export function MonthView({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventOnDate,
}: MonthViewProps) {
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    date: Date;
    events: CalendarEvent[];
  } | null>(null);

  const [activeMobileDate, setActiveMobileDate] = useState<Date>(currentDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const gridDays = getMonthGrid(year, month);

  // Ánh xạ sự kiện theo ngày YYYY-MM-DD
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = formatDateKey(new Date(ev.startAt));
    const list = eventsByDate.get(key) || [];
    list.push(ev);
    eventsByDate.set(key, list);
  }

  // Sắp xếp sự kiện trong ngày theo giờ bắt đầu
  eventsByDate.forEach((list) => {
    list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  });

  const activeMobileKey = formatDateKey(activeMobileDate);
  const activeMobileEvents = eventsByDate.get(activeMobileKey) || [];

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* 7-column header */}
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
          const dayEvents = eventsByDate.get(dayKey) || [];
          const isCurrentMonth = day.getMonth() === month;
          const isToday = isTodayVN(day);
          const isSelectedMobile = isSameDayVN(day, activeMobileDate);

          const maxVisible = 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const remainingCount = dayEvents.length - maxVisible;

          return (
            <div
              key={dayKey}
              onClick={() => {
                setActiveMobileDate(day);
              }}
              onDoubleClick={() => onCreateEventOnDate(day)}
              className={cn(
                'min-h-[105px] sm:min-h-[125px] lg:min-h-[140px] p-1.5 sm:p-2 bg-white flex flex-col justify-between transition-colors relative group',
                !isCurrentMonth && 'bg-slate-50/60 text-slate-400',
                isSelectedMobile && 'ring-2 ring-amber-500 sm:ring-0',
              )}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full select-none',
                    isToday
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400',
                  )}
                >
                  {day.getDate()}
                </span>

                {/* Quick Add icon on hover (desktop) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEventOnDate(day);
                  }}
                  className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  title="Thêm ca dạy vào ngày này"
                >
                  +
                </button>
              </div>

              {/* Event Cards (Desktop & Tablet) */}
              <div className="hidden sm:flex flex-col gap-1 flex-1 overflow-hidden">
                {visibleEvents.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    variant="month"
                    onClick={() => onSelectEvent(ev)}
                  />
                ))}

                {remainingCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDayEvents({ date: day, events: dayEvents });
                    }}
                    className="text-left text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline px-1 py-0.5 rounded cursor-pointer"
                  >
                    +{remainingCount} ca dạy khác
                  </button>
                )}
              </div>

              {/* Mobile Event Dot Indicator */}
              <div className="sm:hidden flex items-center justify-center gap-1 mt-auto pt-1">
                {dayEvents.slice(0, 4).map((ev, i) => (
                  <span
                    key={ev.id || i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: ev.label?.color || '#94a3b8',
                    }}
                  />
                ))}
                {dayEvents.length > 4 && (
                  <span className="text-[9px] text-slate-500 font-bold">+</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Selected Day Drawer/List (clean, spacious, not cramped) */}
      <div className="sm:hidden border-t border-slate-200 p-4 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Lịch ngày {activeMobileDate.getDate()}/{activeMobileDate.getMonth() + 1}:
          </h3>
          <button
            type="button"
            onClick={() => onCreateEventOnDate(activeMobileDate)}
            className="text-xs font-semibold text-amber-700 hover:underline cursor-pointer"
          >
            + Thêm ca
          </button>
        </div>

        {activeMobileEvents.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            Chưa có ca giảng dạy nào trong ngày này.
          </p>
        ) : (
          <div className="space-y-2">
            {activeMobileEvents.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                variant="month"
                onClick={() => onSelectEvent(ev)}
              />
            ))}
          </div>
        )}
      </div>

      {/* More Events Modal for day */}
      <DayEventsModal
        isOpen={Boolean(selectedDayEvents)}
        onClose={() => setSelectedDayEvents(null)}
        date={selectedDayEvents?.date || null}
        events={selectedDayEvents?.events || []}
        onSelectEvent={onSelectEvent}
        onCreateEventOnDate={onCreateEventOnDate}
      />
    </div>
  );
}
