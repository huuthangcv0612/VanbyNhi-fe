import { useState, useMemo, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  LogIn,
  Clock,
  Video,
  LogOut,
  User as UserIcon,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { studentClassesService } from '../services/classes.service';
import type { MemberStatus } from '@/types/common.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton, SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  getClassStatusMeta,
  getMemberStatusMeta,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '../components/ConfirmModal';
import { NextSessionCard } from '../components/NextSessionCard';
import { useStudentMeetJoin } from '../hooks/useStudentMeetJoin';

type StudentTab = 'my-classes' | 'requests';

export function StudentClassesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { joinMeet, isJoining, joiningSessionId } = useStudentMeetJoin();

  const [activeTab, setActiveTab] = useState<StudentTab>('my-classes');

  // Input mã tham gia lớp
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Modal confirm rời lớp
  const [classToLeave, setClassToLeave] = useState<{ id: string; name: string } | null>(null);

  // Tab Lớp của tôi: search & paging
  const [classSearch, setClassSearch] = useState('');
  const [classPage, setClassPage] = useState(1);
  const classLimit = 9;

  // Tab Yêu cầu tham gia: status & paging
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('ALL');
  const [requestPage, setRequestPage] = useState(1);
  const requestLimit = 10;

  // Query: Danh sách lớp đang học
  const {
    data: classesData,
    isLoading: isClassesLoading,
    isError: isClassesError,
    error: classesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ['student-classes', { classPage, classLimit, classSearch }],
    queryFn: () =>
      studentClassesService.getMyClasses({
        page: classPage,
        limit: classLimit,
        search: classSearch || undefined,
      }),
  });

  // Query: Lịch sử yêu cầu tham gia
  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['student-requests', { requestPage, requestLimit, requestStatusFilter }],
    queryFn: () =>
      studentClassesService.getMyRequests({
        page: requestPage,
        limit: requestLimit,
        status: requestStatusFilter !== 'ALL' ? (requestStatusFilter as MemberStatus) : undefined,
      }),
    enabled: activeTab === 'requests',
  });

  // Mutation: Gửi yêu cầu tham gia lớp
  const joinMutation = useMutation({
    mutationFn: (code: string) => studentClassesService.joinClass({ joinCode: code }),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Gửi yêu cầu thành công',
        message: res.message || 'Yêu cầu tham gia lớp của bạn đã được gửi tới giáo viên',
      });
      setJoinCode('');
      setJoinError(null);
      queryClient.invalidateQueries({ queryKey: ['student-requests'] });
      queryClient.invalidateQueries({ queryKey: ['student-classes'] });
      setActiveTab('requests');
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err);
      setJoinError(msg);
      showToast({
        type: 'error',
        title: 'Không thể gửi yêu cầu',
        message: msg,
      });
    },
  });

  // Mutation: Rời lớp
  const leaveMutation = useMutation({
    mutationFn: (classId: string) => studentClassesService.leaveClass(classId),
    onSuccess: () => {
      showToast({
        type: 'info',
        title: 'Đã rời lớp học',
        message: 'Bạn đã rời khỏi lớp học thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['student-classes'] });
      queryClient.invalidateQueries({ queryKey: ['student-requests'] });
      setClassToLeave(null);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể rời lớp',
        message: getApiErrorMessage(err),
      });
    },
  });

  const handleJoinSubmit = (e: FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) {
      setJoinError('Vui lòng nhập mã tham gia lớp học');
      return;
    }
    joinMutation.mutate(trimmed);
  };

  const myClasses = useMemo(() => classesData?.items || [], [classesData?.items]);
  const classPagination = classesData?.pagination;

  const myRequests = requestsData?.items || [];
  const requestPagination = requestsData?.pagination;

  // Tìm buổi học tiếp theo gần nhất trên toàn bộ các lớp của học sinh
  const nearestUpcomingSession = useMemo(() => {
    const sessionsWithClass = myClasses
      .filter((item) => item.class.nextSession)
      .map((item) => ({
        session: item.class.nextSession!,
        className: item.class.name,
        classId: item.class.id,
      }));

    if (sessionsWithClass.length === 0) return null;

    sessionsWithClass.sort(
      (a, b) =>
        new Date(a.session.startTime).getTime() - new Date(b.session.startTime).getTime(),
    );

    return sessionsWithClass[0];
  }, [myClasses]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lớp học của tôi"
        description="Quản lý các lớp học trực tuyến, theo dõi buổi học và phòng học Google Meet của bạn"
      />

      {/* Spotlight: Buổi học tiếp theo gần nhất nếu có */}
      {nearestUpcomingSession && (
        <NextSessionCard
          session={nearestUpcomingSession.session}
          classNameTitle={nearestUpcomingSession.className}
          classId={nearestUpcomingSession.classId}
        />
      )}

      {/* Box Tham gia lớp học bằng mã */}
      <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50/50 via-stone-50/30 to-amber-50/30 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-violet-950 flex items-center gap-2">
              <LogIn className="w-4 h-4 text-violet-700" />
              Tham gia lớp học mới
            </h3>
            <p className="text-xs text-slate-600">
              Nhập mã tham gia do giáo viên cung cấp để gửi yêu cầu gia nhập lớp học.
            </p>
          </div>

          <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="sm:w-64">
              <Input
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.trim().toUpperCase());
                  if (joinError) setJoinError(null);
                }}
                placeholder="NHẬP MÃ (VD: 8AK29P)"
                maxLength={16}
                className="font-mono uppercase tracking-wider text-sm font-semibold"
              />
            </div>
            <Button
              type="submit"
              isLoading={joinMutation.isPending}
              disabled={!joinCode.trim()}
              className="shrink-0 bg-violet-700 hover:bg-violet-800 text-white cursor-pointer"
            >
              Gửi yêu cầu
            </Button>
          </form>
        </div>

        {joinError && (
          <p className="mt-2 text-xs text-rose-600 font-medium">
            ⚠️ {joinError}
          </p>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('my-classes')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'my-classes'
                ? 'border-violet-700 text-violet-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lớp đang học</span>
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-semibold">
              {classPagination?.total ?? myClasses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-violet-700 text-violet-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Lịch sử yêu cầu</span>
          </button>
        </nav>
      </div>

      {/* Tab: LỚP ĐANG HỌC */}
      {activeTab === 'my-classes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex-1 sm:max-w-xs">
              <Input
                placeholder="Tìm lớp học theo tên..."
                value={classSearch}
                onChange={(e) => {
                  setClassSearch(e.target.value);
                  setClassPage(1);
                }}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </div>

          {isClassesError ? (
            <ErrorState
              title="Không thể tải danh sách lớp học"
              message={getApiErrorMessage(classesError)}
              onRetry={() => refetchClasses()}
            />
          ) : isClassesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <Skeleton className="h-56 rounded-2xl" />
              <Skeleton className="h-56 rounded-2xl" />
              <Skeleton className="h-56 rounded-2xl" />
            </div>
          ) : myClasses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8 text-slate-400" />}
              title="Bạn chưa tham gia lớp học nào"
              description={
                classSearch
                  ? 'Không tìm thấy lớp học nào phù hợp với từ khóa tìm kiếm.'
                  : 'Hãy nhập mã tham gia ở khung phía trên để gửi yêu cầu vào lớp học.'
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myClasses.map((item) => {
                  const cls = item.class;
                  const statusMeta = getClassStatusMeta(cls.status);
                  const nextSess = cls.nextSession;

                  return (
                    <div
                      key={item.membershipId}
                      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-violet-200 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-base text-slate-900 leading-snug line-clamp-1 font-serif">
                            {cls.name}
                          </h4>
                          <Badge className={statusMeta.badgeClass} size="sm">
                            {statusMeta.label}
                          </Badge>
                        </div>

                        {cls.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {cls.description}
                          </p>
                        )}

                        <div className="divide-y divide-slate-100 text-xs text-slate-600">
                          <div className="py-1.5 flex items-center justify-between">
                            <span className="text-slate-400">Giáo viên:</span>
                            <span className="font-medium text-slate-800 flex items-center gap-1">
                              <UserIcon className="w-3 h-3 text-slate-400" />
                              {cls.teacher?.fullName || 'Giáo viên phụ trách'}
                            </span>
                          </div>

                          <div className="py-1.5 flex items-center justify-between">
                            <span className="text-slate-400">Học phí:</span>
                            <span className="font-semibold text-amber-900">
                              {formatCurrency(item.effectiveTuition)} / tháng
                            </span>
                          </div>

                          <div className="py-1.5 flex items-center justify-between">
                            <span className="text-slate-400">Ngày vào lớp:</span>
                            <span>{formatDate(item.joinedAt)}</span>
                          </div>
                        </div>

                        {/* Buổi học tiếp theo của lớp */}
                        {nextSess ? (
                          <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 space-y-2">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-800 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Buổi tiếp theo
                              </span>
                              {nextSess.isLive && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {nextSess.title}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-violet-600" />
                              {formatDateTime(nextSess.startTime)}
                            </p>

                            {/* Nút vào Meet nếu canJoinMeet */}
                            {nextSess.canJoinMeet && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => joinMeet(nextSess.id)}
                                isLoading={isJoining && joiningSessionId === nextSess.id}
                                disabled={isJoining && joiningSessionId === nextSess.id}
                                className="w-full mt-1 bg-violet-700 hover:bg-violet-800 text-white text-xs cursor-pointer"
                                leftIcon={<Video className="w-3.5 h-3.5" />}
                              >
                                Vào Google Meet
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center text-xs text-slate-400 italic">
                            Chưa có buổi học tiếp theo
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setClassToLeave({ id: cls.id, name: cls.name })}
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Rời lớp
                        </button>

                        <Link
                          to={`/student/classes/${cls.id}`}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-violet-700 text-white text-xs font-semibold hover:bg-violet-800 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>Vào lớp học</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {classPagination && classPagination.totalPages > 1 && (
                <Pagination
                  currentPage={classPagination.page}
                  totalPages={classPagination.totalPages}
                  totalItems={classPagination.total}
                  onPageChange={(p) => setClassPage(p)}
                  disabled={isClassesLoading}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: LỊCH SỬ YÊU CẦU */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Lọc trạng thái:</label>
              <select
                value={requestStatusFilter}
                onChange={(e) => {
                  setRequestStatusFilter(e.target.value);
                  setRequestPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ duyệt (PENDING)</option>
                <option value="ACTIVE">Đã được duyệt (ACTIVE)</option>
                <option value="REJECTED">Bị từ chối (REJECTED)</option>
                <option value="LEFT">Đã rời lớp (LEFT)</option>
              </select>
            </div>
          </div>

          {isRequestsError ? (
            <ErrorState
              title="Không thể tải lịch sử yêu cầu"
              message={getApiErrorMessage(requestsError)}
              onRetry={() => refetchRequests()}
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lớp học</TableHead>
                    <TableHead>Giáo viên phụ trách</TableHead>
                    <TableHead>Thời gian gửi yêu cầu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isRequestsLoading ? (
                    <SkeletonTableRows rows={4} />
                  ) : myRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12">
                        <EmptyState
                          icon={<Clock className="w-8 h-8 text-slate-400" />}
                          title="Chưa có yêu cầu nào"
                          description="Lịch sử các yêu cầu tham gia lớp bạn đã gửi sẽ hiển thị tại đây."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    myRequests.map((req) => {
                      const statusMeta = getMemberStatusMeta(req.status);

                      return (
                        <TableRow key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-semibold text-slate-900 text-sm">
                            {req.class.name}
                          </TableCell>

                          <TableCell className="text-xs text-slate-700">
                            {req.class.teacher?.fullName || '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-500">
                            {formatDateTime(req.requestedAt)}
                          </TableCell>

                          <TableCell>
                            <Badge className={statusMeta.badgeClass}>
                              {statusMeta.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {requestPagination && requestPagination.totalPages > 1 && (
                <Pagination
                  currentPage={requestPagination.page}
                  totalPages={requestPagination.totalPages}
                  totalItems={requestPagination.total}
                  onPageChange={(p) => setRequestPage(p)}
                  disabled={isRequestsLoading}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal xác nhận rời lớp */}
      {classToLeave && (
        <ConfirmModal
          isOpen={Boolean(classToLeave)}
          onClose={() => setClassToLeave(null)}
          onConfirm={() => leaveMutation.mutate(classToLeave.id)}
          title="Rời khỏi lớp học?"
          description={
            <div className="space-y-2">
              <p>
                Bạn có chắc chắn muốn rời khỏi lớp học{' '}
                <strong className="text-slate-900">{classToLeave.name}</strong>?
              </p>
              <p className="text-xs text-slate-500">
                Sau khi rời lớp, bạn sẽ không thể tham gia các buổi học trực tuyến hoặc xem tài liệu của lớp trừ khi được giáo viên thêm lại.
              </p>
            </div>
          }
          confirmLabel="Rời lớp"
          variant="danger"
          isLoading={leaveMutation.isPending}
        />
      )}
    </div>
  );
}
