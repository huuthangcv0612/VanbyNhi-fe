import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Video,
  ExternalLink,
  LogOut,
  Mail,
  Phone,
  Calendar,
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

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <Link
            to="/student/classes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors mb-1"
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
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 self-start sm:self-auto shrink-0"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Rời lớp học
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột chính: Thông tin phòng học & Lớp */}
        <div className="md:col-span-2 space-y-6">
          {/* Card Google Meet */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-600" />
              Phòng học trực tuyến
            </h3>

            {classData.defaultMeetUrl ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm font-mono text-slate-800 truncate">
                    {classData.defaultMeetUrl}
                  </span>
                  <a
                    href={classData.defaultMeetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer"
                  >
                    <span>Vào phòng học</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-500">
                  Đây là link học trực tuyến cố định cho lớp học này. Vui lòng tham gia đúng giờ theo lịch học.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Lớp học chưa thiết lập link Google Meet cố định. Vui lòng kiểm tra lịch học tại mục Lịch học.
              </p>
            )}
          </div>

          {/* Card Thời gian học */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900">Thông tin tham gia</h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Ngày bạn tham gia lớp:</span>
              <span className="font-semibold text-slate-900">{formatDate(classData.joinedAt)}</span>
            </div>
          </div>
        </div>

        {/* Cột phụ: Thông tin giáo viên */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 h-fit">
          <h3 className="text-base font-bold text-slate-900">Giáo viên phụ trách</h3>

          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 font-bold text-lg shrink-0">
              {classData.teacher?.fullName?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">
                {classData.teacher?.fullName}
              </p>
              <p className="text-xs text-amber-700 font-medium">Giáo viên bộ môn Văn</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
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
              Sau khi rời lớp, bạn sẽ không thể tham gia các buổi học trực tuyến hoặc xem bài tập của lớp này nữa.
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
