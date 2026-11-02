import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { CalendarEvent } from '../types/teacher-calendar.types';
import {
  WEEKDAY_NAMES_FULL,
  WEEKDAY_NAMES_SHORT,
  formatDateKey,
  formatSelectedDayTitleVN,
  formatTimeVN,
  getWeekDays,
  isSameDayVN,
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
  onDateChange?: (date: Date) => void;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDateTime: (date: Date, hour: number) => void;
}

export function WeekView({
  currentDate,
  onDateChange,
  events,
  onSelectEvent,
  onCreateEventOnDateTime,
}: WeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Ngày đang được chọn để hiển thị timeline chi tiết
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);

  // Cập nhật selectedDate khi currentDate từ bên ngoài thay đổi (ví dụ toolbar Prev/Next/Today)
  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

  // Cập nhật thời gian hiện tại mỗi phút để vạch đỏ thời gian thực luôn chính xác
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Thống kê số lượng ca dạy trong từng ngày trong tuần
  const eventsCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ev of events) {
      const key = formatDateKey(new Date(ev.startAt));
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [events]);

  const totalHours = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
  const hoursArray = useMemo(
    () => Array.from({ length: totalHours }, (_, i) => CALENDAR_START_HOUR + i),
    [totalHours],
  );

  // Lấy các sự kiện của ngày đang chọn và tính toán toạ độ hiển thị
  const positionedEvents = useMemo(() => {
    return layoutDayEvents(
      events,
      selectedDate,
      CALENDAR_START_HOUR,
      CALENDAR_END_HOUR,
      HOUR_HEIGHT_PX,
    );
  }, [events, selectedDate]);

  // Tính vị trí vạch giờ hiện tại nếu ngày đang xem là hôm nay
  const isSelectedDateToday = isTodayVN(selectedDate);
  const currentMinutes = getMinutesFromMidnightVN(currentTime);
  const isCurrentTimeInRange =
    currentMinutes >= CALENDAR_START_HOUR * 60 && currentMinutes <= CALENDAR_END_HOUR * 60;
  const currentTimeTopPx =
    ((currentMinutes - CALENDAR_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;

  // Tự động cuộn đến sự kiện đầu tiên trong ngày hoặc giờ hiện tại / 07:00
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    if (positionedEvents.length > 0) {
      const firstTop = positionedEvents[0].topPx;
      scrollContainerRef.current.scrollTop = Math.max(0, firstTop - HOUR_HEIGHT_PX);
    } else if (isSelectedDateToday && isCurrentTimeInRange) {
      scrollContainerRef.current.scrollTop = Math.max(
        0,
        currentTimeTopPx - 2 * HOUR_HEIGHT_PX,
      );
    } else {
      const scrollPos = (7 - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPos);
    }
  }, [formatDateKey(selectedDate)]);

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    onDateChange?.(day);
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    handleSelectDay(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    handleSelectDay(next);
  };

  const selectedDayKey = formatDateKey(selectedDate);
  const selectedDayEventsCount = eventsCountByDate.get(selectedDayKey) || 0;

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* 1. Thanh 7 ngày trong tuần theo layout tham khảo */}
      <div className="bg-white border-b border-slate-200 p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, idx) => {
            const isSelected = isSameDayVN(day, selectedDate);
            const isToday = isTodayVN(day);
            const dayKey = formatDateKey(day);
            const eventCount = eventsCountByDate.get(dayKey) || 0;

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={cn(
                  'group py-1.5 sm:py-2 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative',
                  isSelected
                    ? 'bg-rose-50/50 sm:bg-slate-50/80'
                    : 'hover:bg-slate-100/70',
                )}
                aria-label={`${WEEKDAY_NAMES_FULL[idx]}, ngày ${day.getDate()}`}
                aria-pressed={isSelected}
              >
                {/* Tên thứ: T2, T3... trên mobile, Thứ Hai... trên sm+ */}
                <span
                  className={cn(
                    'text-[11px] font-semibold tracking-tight transition-colors',
                    isSelected
                      ? 'text-rose-600 sm:text-slate-900 font-bold'
                      : isToday
                      ? 'text-rose-600 font-bold'
                      : 'text-slate-500',
                  )}
                >
                  <span className="hidden sm:inline">{WEEKDAY_NAMES_FULL[idx]}</span>
                  <span className="sm:hidden">{WEEKDAY_NAMES_SHORT[idx]}</span>
                </span>

                {/* Vòng tròn số ngày */}
                <div
                  className={cn(
                    'mt-1 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-bold transition-all',
                    isSelected
                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-200 scale-105'
                      : isToday
                      ? 'text-rose-600 border-2 border-rose-600/70'
                      : 'text-slate-800 group-hover:text-slate-900',
                  )}
                >
                  {day.getDate()}
                </div>

                {/* Dấu chấm báo hiệu có ca dạy */}
                <div className="h-2 flex items-center justify-center mt-0.5">
                  {eventCount > 0 && (
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        isSelected ? 'bg-rose-600' : 'bg-amber-600',
                      )}
                      title={`${eventCount} ca dạy`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tiêu đề hiển thị ngày đang chọn (như Monday – 2 Nov 2026) */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-50/75 border-b border-slate-200">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Xem ngày trước"
            aria-label="Xem ngày trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif">
            {formatSelectedDayTitleVN(selectedDate)}
          </h3>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Xem ngày kế tiếp"
            aria-label="Xem ngày kế tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">
            {selectedDayEventsCount === 0
              ? 'Chưa có ca dạy'
              : `${selectedDayEventsCount} ca dạy`}
          </span>

          {!isSelectedDateToday && (
            <button
              type="button"
              onClick={() => handleSelectDay(new Date())}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
          )}
        </div>
      </div>

      {/* 3. Lưới thời gian của ngày được chọn */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto max-h-[720px] relative bg-white select-none"
      >
        <div className="flex relative min-h-[1536px]">
          {/* Cột trục giờ bên trái */}
          <div className="w-16 sm:w-20 shrink-0 select-none border-r border-slate-200/90 bg-slate-50/20">
            {hoursArray.map((hour) => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT_PX}px` }}
                className="relative border-b border-slate-100 text-[11px] sm:text-xs font-semibold text-slate-500 text-right pr-2 pt-1"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Cột lịch của ngày được chọn (chiếm trọn không gian, hiển thị thoáng và rõ ràng) */}
          <div className="flex-1 relative">
            {/* Các khung giờ (click để tạo ca dạy) */}
            {hoursArray.map((hour) => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT_PX}px` }}
                onClick={() => onCreateEventOnDateTime(selectedDate, hour)}
                className="border-b border-slate-100 hover:bg-amber-50/40 transition-colors cursor-pointer group relative"
                title={`Bấm để lên lịch vào ${hour}:00`}
              >
                <span className="hidden group-hover:inline-flex items-center gap-1 absolute left-3 top-2 text-[11px] text-amber-700 font-medium bg-amber-100/80 px-2 py-0.5 rounded-md shadow-2xs">
                  <Plus className="w-3 h-3" /> Lên lịch lúc {hour}:00
                </span>
              </div>
            ))}

            {/* Vạch đỏ chỉ giờ hiện tại (khi đang xem ngày hôm nay) */}
            {isSelectedDateToday && isCurrentTimeInRange && (
              <div
                style={{ top: `${currentTimeTopPx}px` }}
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center -ml-16 sm:-ml-20"
              >
                {/* Huy hiệu giờ đỏ bên trục giờ */}
                <div className="w-16 sm:w-20 pr-1.5 flex justify-end items-center">
                  <span className="bg-rose-600 text-white text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full shadow-xs tracking-tight">
                    {formatTimeVN(currentTime)}
                  </span>
                </div>
                {/* Vạch đỏ ngang qua cột lịch */}
                <div className="flex-1 h-0.5 bg-rose-600 shadow-xs" />
              </div>
            )}

            {/* Các thẻ ca dạy trong ngày */}
            {positionedEvents.map(({ event, topPx, heightPx, leftPercent, widthPercent }) => (
              <EventCard
                key={event.id}
                event={event}
                variant="week"
                style={{
                  top: `${topPx}px`,
                  height: `${heightPx}px`,
                  left: `calc(${leftPercent}% + 4px)`,
                  width: `calc(${widthPercent}% - 8px)`,
                }}
                onClick={() => onSelectEvent(event)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
