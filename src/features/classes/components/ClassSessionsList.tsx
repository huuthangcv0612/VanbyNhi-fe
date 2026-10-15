import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  FileText,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { studentClassesService } from '../services/classes.service';
import type { SessionStatus } from '@/types/common.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  getSessionStatusMeta,
  getAttendanceStatusMeta,
  formatDate,
  formatDateTime,
  formatTime,
} from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useStudentMeetJoin } from '../hooks/useStudentMeetJoin';
import { CheckInModal } from './CheckInModal';

export interface ClassSessionsListProps {
  classId: string;
}

export function ClassSessionsList({ classId }: ClassSessionsListProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const limit = 8;

  const { joinMeet, isJoining, joiningSessionId, popupBlockedUrl, clearBlockedUrl } =
    useStudentMeetJoin();

  const [activeCheckInSession, setActiveCheckInSession] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const {
    data: sessionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-class-sessions', classId, { page, limit, statusFilter }],
    queryFn: () =>
      studentClassesService.getClassSessions(classId, {
        page,
        limit,
        status: statusFilter !== 'ALL' ? (statusFilter as SessionStatus) : undefined,
      }),
    enabled: Boolean(classId),
  });

  const sessions = sessionsData?.items || [];
  const pagination = sessionsData?.pagination;

  return (
    <div className="space-y-4">
      {/* Filter header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-violet-700" />
          <span className="text-sm font-bold text-slate-800">Lọc buổi học:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs focus:border-violet-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
            <option value="IN_PROGRESS">Đang diễn ra (LIVE)</option>
            <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>
      </div>

      {/* Popup blocked helper banner */}
      {popupBlockedUrl && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            Cửa sổ mở Meet bị chặn tự động bởi trình duyệt.
          </span>
          <a
            href={popupBlockedUrl}
            target="_blank"
            rel="noreferrer"
            onClick={clearBlockedUrl}
            className="font-bold underline text-amber-950 hover:text-amber-800 cursor-pointer"
          >
            Mở Google Meet ngay &rarr;
          </a>
        </div>
      )}

      {/* Content */}
      {isError ? (
        <ErrorState
          title="Không thể tải danh sách buổi học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-slate-400" />}
          title="Chưa có buổi học nào"
          description={
            statusFilter !== 'ALL'
              ? 'Không có buổi học nào khớp với bộ lọc đã chọn.'
              : 'Lớp học này hiện chưa được giáo viên lên lịch buổi học.'
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {sessions.map((sess) => {
              const statusMeta = getSessionStatusMeta(sess.status);
              const isLive = sess.status === 'IN_PROGRESS';
              const isCancelled = sess.status === 'CANCELLED';
              const isCompleted = sess.status === 'COMPLETED';

              const attendance = sess.myAttendance;
              const hasCheckedIn =
                attendance &&
                (attendance.status === 'PRESENT' || attendance.status === 'LATE');

              return (
                <div
                  key={sess.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col justify-between gap-4 ${
                    isLive
                      ? 'border-violet-300 bg-violet-50/40 ring-1 ring-violet-200'
                      : 'border-slate-200 bg-white hover:border-violet-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-slate-900 line-clamp-1">
                          {sess.title}
                        </h4>

                        {/* Session status badge */}
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                            Đang diễn ra (LIVE)
                          </span>
                        ) : (
                          <Badge className={statusMeta.badgeClass} size="sm">
                            {statusMeta.label}
                          </Badge>
                        )}
                      </div>

                      {sess.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {sess.description}
                        </p>
                      )}

                      {sess.lessonRecordSummary?.homeworkSummary && (
                        <p className="text-xs text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 inline-block">
                          <span className="font-semibold">Dặn dò bài tập:</span>{' '}
                          {sess.lessonRecordSummary.homeworkSummary}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-violet-600" />
                          <span>{formatDate(sess.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-violet-600" />
                          <span>
                            {formatTime(sess.startTime)} - {formatTime(sess.endTime)}
                          </span>
                        </div>

                        {/* Counts badges */}
                        {sess.materialsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            <FolderOpen className="w-3 h-3 text-slate-500" />
                            {sess.materialsCount} tài liệu
                          </span>
                        )}
                        {sess.assignmentsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            <FileText className="w-3 h-3 text-slate-500" />
                            {sess.assignmentsCount} bài tập
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attendance status badge */}
                    <div className="shrink-0 self-start">
                      {attendance ? (
                        <div className="text-right">
                          <Badge
                            className={getAttendanceStatusMeta(attendance.status).badgeClass}
                            size="sm"
                          >
                            {getAttendanceStatusMeta(attendance.status).label}
                          </Badge>
                          {attendance.checkedInAt && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              Điểm danh: {formatDateTime(attendance.checkedInAt)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200" size="sm">
                          <HelpCircle className="w-3 h-3 mr-1 text-slate-400" />
                          Chưa điểm danh
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      {sess.canJoinMeet ? (
                        <span className="text-emerald-700 font-medium">
                          Phòng học mở cửa sổ tham gia
                        </span>
                      ) : sess.joinWindow?.reason ? (
                        <span className="text-slate-400">{sess.joinWindow.reason}</span>
                      ) : (
                        <span>Mở trước giờ học 15 phút</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Check-in button if not checked in yet and eligible */}
                      {!hasCheckedIn && !isCancelled && !isCompleted && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setActiveCheckInSession({
                              id: sess.id,
                              title: sess.title,
                            })
                          }
                          className="border-violet-300 text-violet-800 hover:bg-violet-50 text-xs"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Điểm danh
                        </Button>
                      )}

                      {/* Join Meet button */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => joinMeet(sess.id)}
                        isLoading={isJoining && joiningSessionId === sess.id}
                        disabled={
                          !sess.canJoinMeet ||
                          (isJoining && joiningSessionId === sess.id) ||
                          isCancelled ||
                          isCompleted
                        }
                        className={`text-xs cursor-pointer ${
                          sess.canJoinMeet && !isCancelled && !isCompleted
                            ? 'bg-violet-700 hover:bg-violet-800 text-white'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        }`}
                        leftIcon={<Video className="w-3.5 h-3.5" />}
                        rightIcon={<ExternalLink className="w-3 h-3" />}
                      >
                        {isLive ? 'Vào lớp ngay' : 'Vào Google Meet'}
                      </Button>

                      {/* View detail button */}
                      <Link
                        to={`/student/sessions/${sess.id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        Chi tiết buổi
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={(p) => setPage(p)}
              disabled={isLoading}
            />
          )}
        </div>
      )}

      {activeCheckInSession && (
        <CheckInModal
          isOpen={Boolean(activeCheckInSession)}
          onClose={() => setActiveCheckInSession(null)}
          sessionId={activeCheckInSession.id}
          sessionTitle={activeCheckInSession.title}
        />
      )}
    </div>
  );
}
