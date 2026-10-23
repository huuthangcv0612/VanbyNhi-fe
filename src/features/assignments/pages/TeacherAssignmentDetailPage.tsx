import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  RefreshCw,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/features/classes/components/ConfirmModal';
import { AssignmentStatsCard } from '../components/AssignmentStatsCard';
import { EligibleStudentsTable } from '../components/EligibleStudentsTable';
import { GradingModal } from '../components/GradingModal';
import { SubmissionHistoryModal } from '../components/SubmissionHistoryModal';
import { AssignmentFormModal } from '../components/AssignmentFormModal';
import { AttachmentList } from '../components/AttachmentList';
import {
  useAssignmentDetail,
  useAssignmentStats,
  useEligibleStudents,
  useUpdateAssignment,
  useDeleteAssignment,
  useReviewSubmission,
  useToggleAttachmentKeepForever,
} from '../hooks/useAssignments';
import { assignmentsService } from '../services/assignments.service';
import type {
  AssignmentSubmissionItem,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  ReviewSubmissionDto,
} from '../types/assignment.types';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { isPastDue } from '../utils/assignment.utils';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

export function TeacherAssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmissionItem | null>(null);
  const [historyStudent, setHistoryStudent] = useState<{ id: string; name: string } | null>(null);

  // Queries
  const {
    data: assignment,
    isLoading: isAssignmentLoading,
    isError: isAssignmentError,
    error: assignmentError,
    refetch: refetchAssignment,
  } = useAssignmentDetail(assignmentId!);

  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useAssignmentStats(assignmentId!);

  const {
    data: eligibleData,
    refetch: refetchEligible,
  } = useEligibleStudents(assignmentId!);

  // Mutations
  const updateMutation = useUpdateAssignment(assignmentId!);
  const deleteMutation = useDeleteAssignment();
  const reviewMutation = useReviewSubmission(
    assignmentId!,
    gradingSubmission?.id || '',
  );
  const toggleKeepMutation = useToggleAttachmentKeepForever(assignmentId!);

  const handleEditSubmit = async (dto: CreateAssignmentDto | UpdateAssignmentDto) => {
    await updateMutation.mutateAsync(dto as UpdateAssignmentDto);
    showToast({
      type: 'success',
      message: 'Cập nhật bài tập thành công!',
    });
    refetchAssignment();
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(assignmentId!);
      showToast({
        type: 'success',
        message: 'Đã xóa bài tập thành công',
      });
      navigate('/teacher/assignments');
    } catch (err: unknown) {
      showToast({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleOpenGrading = async (submissionId: string) => {
    try {
      const sub = await assignmentsService.getSubmission(submissionId);
      setGradingSubmission(sub);
    } catch (err: unknown) {
      showToast({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleSaveReview = async (dto: ReviewSubmissionDto) => {
    if (!gradingSubmission) return;
    await reviewMutation.mutateAsync(dto);
    refetchEligible();
    refetchStats();
  };

  const handleToggleKeepForever = async (attachmentId: string, isKeepForever: boolean) => {
    await toggleKeepMutation.mutateAsync({ attachmentId, isKeepForever });
    showToast({
      type: 'success',
      message: isKeepForever
        ? 'Đã đánh dấu lưu giữ tệp vĩnh viễn'
        : 'Đã hủy đánh dấu lưu giữ vĩnh viễn',
    });
  };

  if (isAssignmentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (isAssignmentError) {
    return (
      <div className="space-y-4">
        <Link
          to="/teacher/assignments"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách bài tập</span>
        </Link>
        <ErrorState
          title="Không tìm thấy bài tập"
          message={getApiErrorMessage(assignmentError)}
          onRetry={() => refetchAssignment()}
        />
      </div>
    );
  }

  const expired = isPastDue(assignment?.dueDate);

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="space-y-2">
        <Link
          to="/teacher/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-amber-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách bài tập</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title={assignment?.title || 'Chi tiết bài tập'}
            description={`Lớp: ${assignment?.class?.name || '...'} (${assignment?.class?.classCode || ''})`}
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                refetchAssignment();
                refetchStats();
                refetchEligible();
              }}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Làm mới</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="text-xs"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              <span>Sửa bài tập</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Xóa</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết đề bài */}
      <Card className="p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge size="sm" className="bg-amber-100 text-amber-900 border-amber-200 font-semibold">
              Thang điểm {assignment?.maxScore} đ
            </Badge>

            {assignment?.dueDate ? (
              <Badge
                size="sm"
                className={
                  expired
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }
              >
                Hạn nộp: {formatDateTime(assignment.dueDate)} {expired && '(Đã quá hạn)'}
              </Badge>
            ) : (
              <Badge size="sm" className="bg-slate-100 text-slate-700 border-slate-200">
                Hạn nộp: Không giới hạn
              </Badge>
            )}

            <Badge size="sm" className="bg-blue-50 text-blue-800 border-blue-200">
              {assignment?.allowResubmission
                ? assignment.maxAttempts
                  ? `Nộp lại tối đa ${assignment.maxAttempts} lần`
                  : 'Cho phép nộp lại'
                : 'Chỉ nộp 1 lần'}
            </Badge>

            {assignment?.session && (
              <Badge size="sm" className="bg-purple-50 text-purple-800 border-purple-200">
                Buổi học: {assignment.session.title}
              </Badge>
            )}
          </div>

          <span className="text-xs text-slate-400">
            Tạo lúc {assignment?.createdAt ? formatDate(assignment.createdAt) : ''}
          </span>
        </div>

        {/* Nội dung đề bài */}
        {assignment?.description && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Yêu cầu đề bài & Hướng dẫn:
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {assignment.description}
            </div>
          </div>
        )}

        {/* Tệp đính kèm của đề bài */}
        {assignment?.attachments && assignment.attachments.length > 0 && (
          <div className="pt-1">
            <AttachmentList
              title="Tài liệu & Đề bài đính kèm"
              attachments={assignment.attachments}
              canToggleKeepForever={true}
              onToggleKeepForever={handleToggleKeepForever}
            />
          </div>
        )}
      </Card>

      {/* Thẻ thống kê bài nộp (Real API stats) */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-700" />
          Tiến độ nộp và chấm bài của lớp
        </h3>
        <AssignmentStatsCard stats={stats} isLoading={isStatsLoading} />
      </div>

      {/* Bảng danh sách học sinh đủ điều kiện và trạng thái làm bài */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-serif">
            Danh sách học sinh & Trạng thái bài làm ({eligibleData?.totalEligible ?? 0} học sinh)
          </h3>
        </div>

        <EligibleStudentsTable
          students={eligibleData?.students || []}
          maxScore={assignment?.maxScore ?? 10}
          onGradeStudent={handleOpenGrading}
          onViewHistory={(id, name) => setHistoryStudent({ id, name })}
        />
      </div>

      {/* Modal Chỉnh sửa bài tập */}
      <AssignmentFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        assignmentToEdit={assignment}
      />

      {/* Modal Chấm điểm & Đánh giá */}
      <GradingModal
        isOpen={Boolean(gradingSubmission)}
        onClose={() => setGradingSubmission(null)}
        submission={gradingSubmission}
        maxScore={assignment?.maxScore ?? 10}
        onSaveReview={handleSaveReview}
        onToggleKeepForever={handleToggleKeepForever}
      />

      {/* Modal Lịch sử các lần nộp */}
      {historyStudent && (
        <SubmissionHistoryModal
          isOpen={Boolean(historyStudent)}
          onClose={() => setHistoryStudent(null)}
          assignmentId={assignmentId!}
          studentId={historyStudent.id}
          studentName={historyStudent.name}
          maxScore={assignment?.maxScore ?? 10}
          onGradeSubmission={handleOpenGrading}
        />
      )}

      {/* Modal Xác nhận xóa */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Xóa bài tập"
        description={`Bạn có chắc chắn muốn xóa bài tập "${assignment?.title}"?`}
        confirmLabel="Xóa bài tập"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
