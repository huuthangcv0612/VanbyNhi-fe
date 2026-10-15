import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Play,
  CheckCircle,
  Video,
  ExternalLink,
  Users,
  FileText,
  FolderOpen,
  Filter,
} from 'lucide-react';
import { teacherClassesService } from '../services/classes.service';
import type { TeacherClassSessionItem } from '../types/class.types';
import type { SessionStatus } from '@/types/common.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  getSessionStatusMeta,
  formatDate,
  formatTime,
} from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from './ConfirmModal';

export interface TeacherClassSessionsTabProps {
  classId: string;
}

export function TeacherClassSessionsTab({ classId }: TeacherClassSessionsTabProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const limit = 8;

  // Session to start or end
  const [sessionToStart, setSessionToStart] = useState<TeacherClassSessionItem | null>(null);
  const [sessionToEnd, setSessionToEnd] = useState<TeacherClassSessionItem | null>(null);

  // Query sessions
  const {
    data: sessionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teacher-class-sessions', classId, { page, limit, statusFilter }],
    queryFn: () =>
      teacherClassesService.getClassSessions(classId, {
        page,
        limit,
        status: statusFilter !== 'ALL' ? (statusFilter as SessionStatus) : undefined,
      }),
    enabled: Boolean(classId),
  });

  const sessions = sessionsData?.items || [];
  const pagination = sessionsData?.pagination;

  // Invalidate all related queries to keep UI & Backend ordering in sync
  const invalidateSessionDependencies = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-class-sessions', classId] });
    queryClient.invalidateQueries({ queryKey: ['teacher-class-detail', classId] });
    queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
  };

  // Mutation start session
  const startSessionMutation = useMutation({
    mutationFn: (sessionId: string) => teacherClassesService.startSession(sessionId),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Buổi học đã bắt đầu',
        message: res.message || 'Buổi học đã chuyển sang trạng thái đang diễn ra (LIVE)',
      });
      invalidateSessionDependencies();
      setSessionToStart(null);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể bắt đầu buổi học',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation end session
  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) => teacherClassesService.endSession(sessionId),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Buổi học đã kết thúc',
        message: res.message || 'Buổi học đã hoàn thành thành công',
      });
      invalidateSessionDependencies();
      setSessionToEnd(null);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể kết thúc buổi học',
        message: getApiErrorMessage(err),
      });
    },
  });

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-bold text-slate-800">Lọc buổi học:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs focus:border-amber-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
            <option value="IN_PROGRESS">Đang diễn ra (LIVE)</option>
            <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isError ? (
        <ErrorState
          title="Không thể tải danh sách buổi học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-slate-400" />}
          title="Chưa có buổi học nào"
          description={
            statusFilter !== 'ALL'
              ? 'Không tìm thấy buổi học nào khớp với bộ lọc đã chọn.'
              : 'Lớp học hiện tại chưa có buổi học nào được tạo.'
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {sessions.map((sess) => {
              const statusMeta = getSessionStatusMeta(sess.status);
              const isLive = sess.status === 'IN_PROGRESS';
              const isScheduled = sess.status === 'SCHEDULED';
              const isCompleted = sess.status === 'COMPLETED';
              const isCancelled = sess.status === 'CANCELLED';

              const meetUrl = sess.effectiveMeetUrl;

              return (
                <div
                  key={sess.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col justify-between gap-4 ${
                    isLive
                      ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200'
                      : 'border-slate-200 bg-white hover:border-amber-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-slate-900 line-clamp-1">
                          {sess.title}
                        </h4>

                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                            ĐANG DIỄN RA (LIVE)
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

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>{formatDate(sess.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {formatTime(sess.startTime)} - {formatTime(sess.endTime)}
                          </span>
                        </div>

                        {/* Counts badges */}
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          <Users className="w-3 h-3 text-slate-500" />
                          {sess._count?.attendances ?? 0} điểm danh
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          <FolderOpen className="w-3 h-3 text-slate-500" />
                          {sess._count?.materials ?? 0} tài liệu
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          <FileText className="w-3 h-3 text-slate-500" />
                          {sess._count?.assignments ?? 0} bài tập
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      {meetUrl ? (
                        <a
                          href={meetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mở Google Meet phòng học</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Chưa có link Meet phòng học</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Button Start Session (when SCHEDULED) */}
                      {isScheduled && !isCancelled && !isCompleted && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setSessionToStart(sess)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
                          leftIcon={<Play className="w-3.5 h-3.5" />}
                        >
                          Bắt đầu buổi học (LIVE)
                        </Button>
                      )}

                      {/* Button End Session (when IN_PROGRESS) */}
                      {isLive && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setSessionToEnd(sess)}
                          className="bg-amber-700 hover:bg-amber-800 text-white text-xs cursor-pointer"
                          leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                        >
                          Kết thúc buổi học
                        </Button>
                      )}
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

      {/* Modal xác nhận bắt đầu buổi học */}
      {sessionToStart && (
        <ConfirmModal
          isOpen={Boolean(sessionToStart)}
          onClose={() => setSessionToStart(null)}
          onConfirm={() => startSessionMutation.mutate(sessionToStart.id)}
          title="Bắt đầu buổi học?"
          description={
            <div className="space-y-2">
              <p>
                Bạn có chắc chắn muốn bắt đầu buổi học{' '}
                <strong className="text-slate-900">{sessionToStart.title}</strong>?
              </p>
              <p className="text-xs text-slate-500">
                Buổi học sẽ chuyển sang trạng thái <strong>ĐANG DIỄN RA (LIVE)</strong>. Học sinh trong lớp sẽ nhận được thông báo để tham gia ngay.
              </p>
            </div>
          }
          confirmLabel="Bắt đầu ngay"
          variant="primary"
          isLoading={startSessionMutation.isPending}
        />
      )}

      {/* Modal xác nhận kết thúc buổi học */}
      {sessionToEnd && (
        <ConfirmModal
          isOpen={Boolean(sessionToEnd)}
          onClose={() => setSessionToEnd(null)}
          onConfirm={() => endSessionMutation.mutate(sessionToEnd.id)}
          title="Kết thúc buổi học?"
          description={
            <div className="space-y-2">
              <p>
                Bạn có chắc chắn muốn kết thúc buổi học{' '}
                <strong className="text-slate-900">{sessionToEnd.title}</strong>?
              </p>
              <p className="text-xs text-slate-500">
                Buổi học sẽ chuyển sang trạng thái <strong>ĐÃ HOÀN THÀNH</strong>. Sau khi kết thúc, danh sách lớp sẽ tự động tính toán lại buổi học tiếp theo.
              </p>
            </div>
          }
          confirmLabel="Kết thúc buổi"
          variant="warning"
          isLoading={endSessionMutation.isPending}
        />
      )}
    </div>
  );
}
