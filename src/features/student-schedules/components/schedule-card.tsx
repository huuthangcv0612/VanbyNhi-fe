import {
  Clock,
  User as UserIcon,
  BookOpen,
  MapPin,
  Video,
  ExternalLink,
} from 'lucide-react';
import type { StudentSchedule } from '../types/student-schedule.types';
import {
  formatTimeVN,
  formatDateVN,
  getScheduleStatusMeta,
  getMeetingTypeMeta,
  isScheduleUpcoming,
  isValidHttpUrl,
  hasScheduleEnded,
} from '../utils/schedule-date.utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

export interface ScheduleCardProps {
  schedule: StudentSchedule;
  onClick?: () => void;
  compact?: boolean;
  showDate?: boolean;
  showJoinButton?: boolean;
}

export function ScheduleCard({
  schedule,
  onClick,
  compact = false,
  showDate = false,
  showJoinButton = false,
}: ScheduleCardProps) {
  const isUpcoming = isScheduleUpcoming(schedule);
  const isEnded = hasScheduleEnded(schedule);
  const statusMeta = getScheduleStatusMeta(schedule.status, isUpcoming);
  const meetingMeta = getMeetingTypeMeta(schedule.meetingType);

  const canJoin =
    (schedule.meetingType === 'ONLINE_MEET' || schedule.meetingType === 'ONLINE_WEB') &&
    isValidHttpUrl(schedule.meetingUrl) &&
    schedule.status === 'SCHEDULED' &&
    !isEnded;

  if (compact) {
    // Phiên bản thu gọn cho ô lưới tháng
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={cn(
          'w-full text-left p-1.5 rounded-lg border text-xs transition-all cursor-pointer truncate group shadow-2xs',
          schedule.status === 'CANCELLED'
            ? 'bg-rose-50/70 border-rose-200 text-rose-700 opacity-80'
            : schedule.status === 'COMPLETED'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
              : isUpcoming
                ? 'bg-amber-50/90 border-amber-300 text-amber-900 font-medium'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800',
        )}
        title={`${schedule.title} (${formatTimeVN(schedule.startAt)} - ${formatTimeVN(schedule.endAt)})`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span
            className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusMeta.dotColor)}
            aria-hidden="true"
          />
          <span className="font-semibold text-[11px] tabular-nums text-slate-600 shrink-0">
            {formatTimeVN(schedule.startAt)}
          </span>
          <span
            className={cn(
              'truncate font-medium text-[11px]',
              schedule.status === 'CANCELLED' && 'line-through text-slate-500',
            )}
          >
            {schedule.title}
          </span>
        </div>
      </button>
    );
  }

  // Phiên bản thẻ đầy đủ cho Chế độ Ngày / Tuần / Modal
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer bg-white hover:shadow-md',
        schedule.status === 'CANCELLED'
          ? 'border-rose-200 bg-rose-50/30'
          : schedule.status === 'COMPLETED'
            ? 'border-slate-200 hover:border-emerald-300'
            : isUpcoming
              ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
              : 'border-slate-200 hover:border-slate-300',
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Top row: Badges and time */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={statusMeta.badgeClass} size="sm">
            <span
              className={cn('w-1.5 h-1.5 rounded-full mr-1.5 shrink-0', statusMeta.dotColor)}
            />
            {statusMeta.label}
          </Badge>

          <Badge className={meetingMeta.badgeClass} size="sm">
            {meetingMeta.label}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 tabular-nums">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {showDate && <span>{formatDateVN(schedule.startAt)}, </span>}
          <span>
            {formatTimeVN(schedule.startAt)} – {formatTimeVN(schedule.endAt)}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3
        className={cn(
          'text-sm sm:text-base font-semibold text-slate-900 group-hover:text-amber-700 transition-colors mb-2',
          schedule.status === 'CANCELLED' && 'line-through text-slate-500',
        )}
      >
        {schedule.title}
      </h3>

      {/* Description preview if present */}
      {schedule.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {schedule.description}
        </p>
      )}

      {/* Meta info: Teacher, Class, Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mt-auto pt-2 border-t border-slate-100">
        {schedule.teacher && (
          <div className="flex items-center gap-1.5 truncate">
            <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Giáo viên: <span className="font-medium text-slate-800">{schedule.teacher.fullName}</span>
            </span>
          </div>
        )}

        {schedule.class ? (
          <div className="flex items-center gap-1.5 truncate">
            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Lớp: <span className="font-medium text-slate-800">{schedule.class.name}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400 truncate">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Lịch kèm riêng / Chỉ định</span>
          </div>
        )}

        {schedule.location && (
          <div className="flex items-center gap-1.5 truncate sm:col-span-2 text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{schedule.location}</span>
          </div>
        )}
      </div>

      {/* Quick Join Action (if enabled and applicable) */}
      {showJoinButton && canJoin && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
          <a
            href={schedule.meetingUrl!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-2xs transition-colors"
          >
            {schedule.meetingType === 'ONLINE_MEET' ? (
              <>
                <Video className="w-3.5 h-3.5" />
                <span>Tham gia Google Meet</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Vào phòng học</span>
              </>
            )}
          </a>
        </div>
      )}
    </div>
  );
}
