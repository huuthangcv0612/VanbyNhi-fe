import type { CSSProperties, MouseEvent } from 'react';
import { Video, MapPin, Users } from 'lucide-react';
import type { CalendarEvent } from '../types/teacher-calendar.types';
import { formatTimeVN } from '../utils/date-utils';
import { cn } from '@/utils/cn';

interface EventCardProps {
  event: CalendarEvent;
  variant?: 'month' | 'week';
  onClick?: (event: CalendarEvent) => void;
  className?: string;
  style?: CSSProperties;
}

export function EventCard({
  event,
  variant = 'month',
  onClick,
  className,
  style,
}: EventCardProps) {
  const startTimeStr = formatTimeVN(event.startAt);
  const endTimeStr = formatTimeVN(event.endAt);
  const labelColor = event.label?.color;

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  const hasMeet = Boolean(event.meetUrl || event.googleMeetUrl);
  const hasLocation = Boolean(event.address || event.location);
  const participantCount = event.participants?.length ?? event.studentCount ?? 0;

  if (variant === 'month') {
    return (
      <button
        type="button"
        onClick={handleClick}
        style={{
          borderLeftColor: labelColor || '#94a3b8',
          ...style,
        }}
        className={cn(
          'w-full text-left rounded-md px-2 py-1 text-xs transition-all cursor-pointer',
          'border border-l-4 border-slate-200/90 hover:shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500',
          labelColor
            ? 'bg-white hover:bg-slate-50 text-slate-900'
            : 'bg-slate-50/90 hover:bg-slate-100 text-slate-800 border-slate-200',
          className,
        )}
        title={`${startTimeStr} - ${event.title}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-[11px] text-slate-600 shrink-0">
            {startTimeStr}
          </span>
          <span className="truncate font-medium text-[11px] text-slate-900">
            {event.title}
          </span>
          {hasMeet && (
            <Video className="w-3 h-3 text-sky-600 shrink-0 ml-auto" aria-label="Có Google Meet" />
          )}
        </div>
      </button>
    );
  }

  // Week variant
  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(event);
        }
      }}
      style={{
        borderLeftColor: labelColor || '#94a3b8',
        ...style,
      }}
      className={cn(
        'group absolute rounded-lg p-2 text-xs transition-all overflow-hidden cursor-pointer select-none',
        'border border-l-4 border-slate-200/90 shadow-xs hover:shadow-md hover:z-20',
        labelColor
          ? 'bg-white/95 hover:bg-white text-slate-900'
          : 'bg-slate-50/95 hover:bg-slate-100 text-slate-800',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="font-semibold text-[11px] text-slate-700 truncate">
          {startTimeStr} – {endTimeStr}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {hasMeet && (
            <Video className="w-3 h-3 text-sky-600" aria-label="Google Meet" />
          )}
          {hasLocation && (
            <MapPin className="w-3 h-3 text-emerald-600" aria-label="Địa chỉ học" />
          )}
        </div>
      </div>

      <p className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-800">
        {event.title}
      </p>

      {/* Label and Participants info */}
      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
        {event.label && (
          <span
            className="inline-block px-1.5 py-0.2 rounded font-medium truncate max-w-[90px]"
            style={{
              backgroundColor: `${event.label.color}15`,
              color: event.label.color,
            }}
          >
            {event.label.name}
          </span>
        )}
        {participantCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-slate-500">
            <Users className="w-3 h-3" />
            <span>{participantCount}</span>
          </span>
        )}
      </div>
    </div>
  );
}
