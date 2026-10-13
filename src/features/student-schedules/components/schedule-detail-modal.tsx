import {
  Calendar,
  Clock,
  User as UserIcon,
  BookOpen,
  MapPin,
  Video,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { StudentSchedule } from '../types/student-schedule.types';
import { useStudentScheduleDetail } from '../hooks/use-student-schedules';
import {
  formatFullDateVN,
  formatTimeVN,
  getScheduleStatusMeta,
  getMeetingTypeMeta,
  isScheduleUpcoming,
  isValidHttpUrl,
  hasScheduleEnded,
} from '../utils/schedule-date.utils';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/lib/api-client';
import { cn } from '@/utils/cn';

export interface ScheduleDetailModalProps {
  scheduleId: string | null;
  initialSchedule?: StudentSchedule | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleDetailModal({
  scheduleId,
  initialSchedule,
  isOpen,
  onClose,
}: ScheduleDetailModalProps) {
  const {
    data: fetchedSchedule,
    isLoading,
    isError,
    error,
    refetch,
  } = useStudentScheduleDetail(scheduleId || undefined);

  // Dùng fetchedSchedule nếu có, hoặc initialSchedule làm fallback
  const schedule = fetchedSchedule || initialSchedule;

  if (!isOpen) return null;

  const isUpcoming = schedule ? isScheduleUpcoming(schedule) : false;
  const isEnded = schedule ? hasScheduleEnded(schedule) : false;
  const statusMeta = schedule ? getScheduleStatusMeta(schedule.status, isUpcoming) : null;
  const meetingMeta = schedule ? getMeetingTypeMeta(schedule.meetingType) : null;

  const isValidUrl = schedule ? isValidHttpUrl(schedule.meetingUrl) : false;

  // Quyết định hiển thị nút tham gia buổi học theo Section 6
  const canShowJoinButton =
    schedule &&
    (schedule.meetingType === 'ONLINE_MEET' || schedule.meetingType === 'ONLINE_WEB') &&
    isValidUrl &&
    schedule.status !== 'CANCELLED' &&
    schedule.status !== 'COMPLETED';

  const isJoinDisabled = isEnded;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết buổi học"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>

          {canShowJoinButton && (
            <div className="flex items-center gap-2">
              {isJoinDisabled ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Thời gian buổi học đã kết thúc</span>
                </div>
              ) : (
                <a
                  href={schedule!.meetingUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-colors cursor-pointer"
                >
                  {schedule!.meetingType === 'ONLINE_MEET' ? (
                    <>
                      <Video className="w-4 h-4" />
                      <span>Tham gia Google Meet</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Vào phòng học</span>
                    </>
                  )}
                </a>
              )}
            </div>
          )}
        </div>
      }
    >
      {isLoading && !schedule ? (
        <div className="space-y-4 py-2">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
          <div className="grid grid-cols-2 gap-3 pt-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : isError && !schedule ? (
        <div className="p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-800">Không thể tải thông tin chi tiết</h4>
          <p className="text-xs text-slate-500">{getApiErrorMessage(error)}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Thử lại
          </Button>
        </div>
      ) : schedule ? (
        <div className="space-y-5 text-sm">
          {/* Header section: Title and status tags */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {statusMeta && (
                <Badge className={statusMeta.badgeClass} size="md">
                  <span
                    className={cn('w-2 h-2 rounded-full mr-1.5 shrink-0', statusMeta.dotColor)}
                  />
                  {statusMeta.label}
                </Badge>
              )}
              {meetingMeta && (
                <Badge className={meetingMeta.badgeClass} size="md">
                  {meetingMeta.label}
                </Badge>
              )}
            </div>

            <h2
              className={cn(
                'text-lg sm:text-xl font-bold text-slate-900 font-serif leading-snug',
                schedule.status === 'CANCELLED' && 'line-through text-slate-500',
              )}
            >
              {schedule.title}
            </h2>

            {schedule.description && (
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                {schedule.description}
              </p>
            )}
          </div>

          {/* Time & Timezone block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Ngày học</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {formatFullDateVN(schedule.startAt)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Khung giờ</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 tabular-nums">
                {formatTimeVN(schedule.startAt)} – {formatTimeVN(schedule.endAt)}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                <Globe className="w-3 h-3 text-slate-400" />
                <span>Múi giờ: {schedule.timezone || 'Asia/Ho_Chi_Minh'}</span>
              </div>
            </div>
          </div>

          {/* Teacher and Class block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Teacher info */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <UserIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>Giáo viên phụ trách</span>
              </div>
              {schedule.teacher ? (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 text-sm">
                    {schedule.teacher.fullName}
                  </p>
                  {schedule.teacher.email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{schedule.teacher.email}</span>
                    </div>
                  )}
                  {schedule.teacher.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{schedule.teacher.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa có thông tin giáo viên</p>
              )}
            </div>

            {/* Class info */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Thông tin lớp học</span>
              </div>
              {schedule.class ? (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 text-sm">
                    {schedule.class.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Mã lớp: <span className="font-mono font-medium text-slate-700">{schedule.class.classCode}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Lịch học được chỉ định trực tiếp cho bạn (không thuộc lớp nhóm).
                </p>
              )}
            </div>
          </div>

          {/* Meeting location / Meet URL */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {schedule.meetingType === 'IN_PERSON' ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Địa điểm học trực tiếp</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5 text-amber-600" />
                  <span>Liên kết phòng học trực tuyến</span>
                </>
              )}
            </div>

            {schedule.meetingType === 'IN_PERSON' ? (
              <p className="text-sm text-slate-800">
                {schedule.location || 'Chưa cập nhật địa điểm cụ thể. Vui lòng liên hệ giáo viên.'}
              </p>
            ) : schedule.meetingUrl ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-mono text-slate-600 truncate max-w-sm sm:max-w-md">
                  {schedule.meetingUrl}
                </span>
                {isValidUrl && (
                  <a
                    href={schedule.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 underline shrink-0"
                  >
                    <span>Mở liên kết</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Chưa có liên kết phòng học trực tuyến.</p>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
