import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { StudentNextSession } from '../types/class.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/utils/formatters';
import { useStudentMeetJoin } from '../hooks/useStudentMeetJoin';
import { CheckInModal } from './CheckInModal';

export interface NextSessionCardProps {
  session: StudentNextSession;
  classNameTitle?: string;
  classId?: string;
}

export function NextSessionCard({
  session,
  classNameTitle,
  classId,
}: NextSessionCardProps) {
  const { joinMeet, isJoining, popupBlockedUrl, clearBlockedUrl } = useStudentMeetJoin();
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const isLive = session.isLive || session.status === 'IN_PROGRESS';
  const isCancelled = session.status === 'CANCELLED';
  const isCompleted = session.status === 'COMPLETED';

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/70 via-stone-50/40 to-amber-50/30 p-5 md:p-6 shadow-xs">
        {/* Decorative subtle backdrop accent */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-violet-200/40 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-900">
                Buổi học tiếp theo
              </span>
            </div>

            {/* Status badge */}
            <div>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                  Đang diễn ra (LIVE)
                </span>
              ) : isCancelled ? (
                <Badge className="bg-rose-100 text-rose-800 border-rose-200">
                  Buổi học đã hủy
                </Badge>
              ) : isCompleted ? (
                <Badge className="bg-slate-100 text-slate-800 border-slate-200">
                  Đã kết thúc
                </Badge>
              ) : (
                <Badge className="bg-violet-100 text-violet-800 border-violet-200">
                  Sắp diễn ra
                </Badge>
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-1.5">
            {classNameTitle && (
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <span>Lớp:</span>
                {classId ? (
                  <Link
                    to={`/student/classes/${classId}`}
                    className="text-violet-700 hover:text-violet-900 hover:underline font-bold"
                  >
                    {classNameTitle}
                  </Link>
                ) : (
                  <span className="font-bold text-slate-700">{classNameTitle}</span>
                )}
              </p>
            )}

            <h3 className="text-lg md:text-xl font-bold font-serif text-slate-900">
              {session.title}
            </h3>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-violet-600" />
                <span>{formatDate(session.startTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-violet-600" />
                <span>
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Popup blocked banner if browser prevented tab opening */}
          {popupBlockedUrl && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Trình duyệt đã chặn cửa sổ tự động.
              </span>
              <a
                href={popupBlockedUrl}
                target="_blank"
                rel="noreferrer"
                onClick={clearBlockedUrl}
                className="font-bold underline text-amber-950 hover:text-amber-700 cursor-pointer"
              >
                Mở Google Meet ngay &rarr;
              </a>
            </div>
          )}

          {/* Actions row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-violet-100">
            <div className="text-xs text-slate-500">
              {session.canJoinMeet ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Phòng học đã mở cửa sổ tham gia
                </span>
              ) : (
                <span>
                  Cửa sổ tham gia mở trước giờ học 15 phút
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Check-in button */}
              {!isCancelled && !isCompleted && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCheckInOpen(true)}
                  className="border-violet-300 text-violet-800 hover:bg-violet-50 text-xs cursor-pointer"
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Điểm danh
                </Button>
              )}

              {/* Join Meet button */}
              <Button
                type="button"
                size="sm"
                onClick={() => joinMeet(session.id)}
                isLoading={isJoining}
                disabled={!session.canJoinMeet || isJoining || isCancelled || isCompleted}
                className={`text-xs cursor-pointer shadow-xs ${
                  session.canJoinMeet && !isCancelled && !isCompleted
                    ? 'bg-violet-700 hover:bg-violet-800 text-white'
                    : 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                }`}
                leftIcon={<Video className="w-4 h-4" />}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                {isLive ? 'Vào lớp ngay' : 'Tham gia Google Meet'}
              </Button>

              {/* View details */}
              <Link
                to={`/student/sessions/${session.id}`}
                className="text-xs font-semibold text-violet-700 hover:text-violet-900 px-2 py-1.5 transition-colors cursor-pointer"
              >
                Chi tiết buổi &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isCheckInOpen && (
        <CheckInModal
          isOpen={isCheckInOpen}
          onClose={() => setIsCheckInOpen(false)}
          sessionId={session.id}
          sessionTitle={session.title}
        />
      )}
    </>
  );
}
