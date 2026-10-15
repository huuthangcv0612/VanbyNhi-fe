import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Award,
  CheckCircle2,
  CalendarDays,
  User as UserIcon,
} from 'lucide-react';
import { studentClassesService } from '../services/classes.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getClassStatusMeta, formatDate } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '../components/ConfirmModal';
import { NextSessionCard } from '../components/NextSessionCard';
import { ClassSessionsList } from '../components/ClassSessionsList';

export function StudentClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const {
    data: classData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-class-detail', classId],
    queryFn: () => studentClassesService.getClassDetail(classId!),
    enabled: Boolean(classId),
  });

  const leaveMutation = useMutation({
    mutationFn: () => studentClassesService.leaveClass(classId!),
    onSuccess: () => {
      showToast({
        type: 'info',
        title: 'Đã rời lớp học',
        message: 'Bạn đã rời khỏi lớp học thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['student-classes'] });
      queryClient.invalidateQueries({ queryKey: ['student-requests'] });
      setIsLeaveModalOpen(false);
      navigate('/student/classes');
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể rời lớp',
        message: getApiErrorMessage(err),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl md:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !classData) {
    return (
      <div className="space-y-6">
        <Link
          to="/student/classes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách lớp học
        </Link>
        <ErrorState
          title="Không thể xem chi tiết lớp học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const statusMeta = getClassStatusMeta(classData.status);
  const attendance = classData.attendanceSummary;

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <Link
            to="/student/classes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Lớp học của tôi
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-serif text-slate-900">{classData.name}</h1>
            <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
          </div>
          {classData.description && (
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed mt-1">
              {classData.description}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLeaveModalOpen(true)}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Rời lớp học
        </Button>
      </div>

      {/* Attendance Summary Stat Row - Real Data from Backend */}
      {attendance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Buổi học đã hoàn thành</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {attendance.totalCompletedSessions} <span className="text-xs font-normal text-slate-400">buổi</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Số buổi đã tham dự</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {attendance.attendedCount} <span className="text-xs font-normal text-slate-400">buổi</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">Tỷ lệ chuyên cần</p>
                <span className="text-xs font-bold text-slate-800">
                  {attendance.attendanceRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, attendance.attendanceRate))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Session Spotlight if available */}
      {classData.nextSession && (
        <NextSessionCard
          session={classData.nextSession}
          classNameTitle={classData.name}
          classId={classData.id}
        />
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột chính: Danh sách buổi học */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-serif text-slate-900">
              Lịch trình các buổi học
            </h2>
          </div>

          <ClassSessionsList classId={classData.id} />
        </div>

        {/* Cột phụ: Thông tin giáo viên & tham gia */}
        <div className="space-y-5">
          {/* Card giáo viên */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Giáo viên phụ trách
            </h3>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800 font-bold text-lg shrink-0">
                {classData.teacher?.fullName?.charAt(0)?.toUpperCase() || 'T'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">
                  {classData.teacher?.fullName || 'Giáo viên phụ trách'}
                </p>
                <p className="text-xs text-violet-700 font-medium">Giáo viên bộ môn Văn</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              {classData.teacher?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{classData.teacher.email}</span>
                </div>
              )}

              {classData.teacher?.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono">{classData.teacher.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card thông tin tham gia */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Thông tin học viên
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Ngày tham gia:
                </span>
                <span className="font-semibold text-slate-800">
                  {formatDate(classData.joinedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  Trạng thái thành viên:
                </span>
                <Badge size="sm" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  Chính thức (ACTIVE)
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận rời lớp */}
      <ConfirmModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={() => leaveMutation.mutate()}
        title="Rời khỏi lớp học?"
        description={
          <div className="space-y-2">
            <p>
              Bạn có chắc chắn muốn rời khỏi lớp học{' '}
              <strong className="text-slate-900">{classData.name}</strong>?
            </p>
            <p className="text-xs text-slate-500">
              Sau khi rời lớp, bạn sẽ không thể tham gia các buổi học trực tuyến hoặc xem tài liệu/bài tập của lớp này nữa.
            </p>
          </div>
        }
        confirmLabel="Rời lớp"
        variant="danger"
        isLoading={leaveMutation.isPending}
      />
    </div>
  );
}
