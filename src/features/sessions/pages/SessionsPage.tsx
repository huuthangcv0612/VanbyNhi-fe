import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Video, ClipboardCheck, Clock } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { classesService } from '@/features/classes/services/classes.service';
import { apiClient } from '@/lib/api-client';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton, SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getSessionStatusMeta, formatDateTime } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import type { PaginatedResponse, SessionStatus } from '@/types/common.types';

interface SessionItem {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  meetUrl: string | null;
  status: SessionStatus;
}

export function SessionsPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Lấy danh sách lớp để cho phép chọn lớp xem buổi học
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes', { limit: 50 }],
    queryFn: () => classesService.findAll({ limit: 50 }),
  });

  const classes = classesData?.items || [];
  const activeClassId = selectedClassId || (classes[0]?.id ?? '');

  // Lấy danh sách buổi học của lớp đã chọn
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sessions', activeClassId],
    queryFn: async () => {
      if (!activeClassId) return null;
      const res = await apiClient.get<PaginatedResponse<SessionItem>>(
        `/classes/${activeClassId}/sessions`,
      );
      return res.data;
    },
    enabled: !!activeClassId,
  });

  const sessions = sessionsData?.items || [];

  const { user } = useAuth();
  const baseRoute = user?.role === 'ADMIN' ? '/admin' : '/teacher';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Buổi học & Lịch giảng"
        description="Lịch trình buổi học, phòng Google Meet và nhật ký giáo án"
      />

      {/* Class selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <label className="text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
          Chọn lớp học:
        </label>
        <select
          value={activeClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          disabled={isLoadingClasses || classes.length === 0}
          aria-label="Chọn lớp học"
          className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer min-h-[42px] sm:min-h-[38px]"
        >
          {classes.length === 0 ? (
            <option value="">Chưa có lớp học</option>
          ) : (
            classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))
          )}
        </select>
      </div>

      {isError ? (
        <ErrorState
          title="Không thể tải danh sách buổi học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile view (< sm) */}
          <div className="sm:hidden space-y-3">
            {isLoadingSessions || isLoadingClasses ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-40 rounded" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </Card>
              ))
            ) : !activeClassId || sessions.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-8 h-8 text-slate-400" />}
                title="Chưa có buổi học nào"
                description="Lớp học này chưa có buổi học nào được lên lịch."
              />
            ) : (
              sessions.map((sess) => {
                const statusMeta = getSessionStatusMeta(sess.status);
                return (
                  <Card key={sess.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 font-serif text-sm">
                          {sess.title}
                        </h4>
                        {sess.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {sess.description}
                          </p>
                        )}
                      </div>
                      <Badge className={statusMeta.badgeClass} size="sm">
                        {statusMeta.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateTime(sess.startTime)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      {sess.meetUrl ? (
                        <a
                          href={sess.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 underline min-h-[36px]"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Vào Meet</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa có Meet</span>
                      )}

                      <Link
                        to={`${baseRoute}/sessions/${sess.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100/90 rounded-xl border border-amber-200/80 transition-colors min-h-[36px]"
                        aria-label={`Điểm danh buổi học ${sess.title}`}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Điểm danh</span>
                      </Link>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Desktop/Tablet Table (sm+) */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề buổi học</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Phòng học trực tuyến</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSessions || isLoadingClasses ? (
                  <SkeletonTableRows rows={4} />
                ) : !activeClassId || sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8">
                      <EmptyState
                        icon={<Calendar className="w-6 h-6 text-slate-400" />}
                        title="Chưa có buổi học nào"
                        description="Lớp học này chưa có buổi học nào được lên lịch."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((sess) => {
                    const statusMeta = getSessionStatusMeta(sess.status);
                    return (
                      <TableRow key={sess.id}>
                        <TableCell className="font-semibold text-slate-900">
                          {sess.title}
                          {sess.description && (
                            <p className="text-xs text-slate-500 font-normal truncate max-w-sm">
                              {sess.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 font-mono">
                          {formatDateTime(sess.startTime)}
                        </TableCell>
                        <TableCell>
                          {sess.meetUrl ? (
                            <a
                              href={sess.meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Vào Meet</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Chưa có liên kết</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusMeta.badgeClass}>
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            to={`${baseRoute}/sessions/${sess.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-xl border border-amber-200 transition-colors"
                            aria-label={`Điểm danh buổi học ${sess.title}`}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>Điểm danh</span>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
