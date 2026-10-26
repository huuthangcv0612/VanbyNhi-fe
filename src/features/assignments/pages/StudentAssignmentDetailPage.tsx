import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Clock,
  History,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AttachmentList } from '../components/AttachmentList';
import { AssignmentStatusBadge } from '../components/AssignmentStatusBadge';
import { StudentSubmissionForm } from '../components/StudentSubmissionForm';
import {
  useAssignmentDetail,
  useAssignmentSubmissions,
  useSubmitAssignment,
} from '../hooks/useAssignments';
import { formatDateTime } from '@/utils/formatters';
import { isPastDue } from '../utils/assignment.utils';
import { getApiErrorMessage } from '@/lib/api-client';

export function StudentAssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  // Lấy thông tin bài tập
  const {
    data: assignment,
    isLoading: isAssignmentLoading,
    isError: isAssignmentError,
    error: assignmentError,
    refetch: refetchAssignment,
  } = useAssignmentDetail(assignmentId!);

  // Lấy các bài nộp của học sinh đối với bài tập này
  const {
    data: submissions,
    refetch: refetchSubmissions,
  } = useAssignmentSubmissions(assignmentId!);

  const submitMutation = useSubmitAssignment(assignmentId!);

  const submissionList = submissions || [];
  const latestSubmission = submissionList.length > 0 ? submissionList[0] : null;

  // Lần nộp đang được xem chi tiết (mặc định là lần nộp mới nhất)
  const currentSubmission =
    submissionList.find((s) => s.id === selectedAttemptId) || latestSubmission;

  const handleSubmit = async (dto: Parameters<typeof submitMutation.mutateAsync>[0]) => {
    await submitMutation.mutateAsync(dto);
    refetchSubmissions();
    refetchAssignment();
  };

  if (isAssignmentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isAssignmentError) {
    return (
      <div className="space-y-4">
        <Link
          to="/student/assignments"
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
  // Tuyệt đối chỉ hiển thị kết quả nếu review là RETURNED
  const isReturned =
    currentSubmission?.review?.status === 'RETURNED' ||
    currentSubmission?.status === 'RETURNED';

  return (
    <div className="space-y-6">
      {/* Header navigation */}
      <div className="space-y-2">
        <Link
          to="/student/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-amber-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách bài tập</span>
        </Link>

        <PageHeader
          title={assignment?.title || 'Đề bài tập'}
          description={`Lớp học: ${assignment?.class?.name || '...'}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Đề bài và Hướng dẫn (Chiếm 2 cột trên màn hình lớn) */}
        <div className="lg:col-span-2 space-y-6">
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
                    Hạn nộp: {formatDateTime(assignment.dueDate)} {expired && '(Quá hạn)'}
                  </Badge>
                ) : (
                  <Badge size="sm" className="bg-slate-100 text-slate-700 border-slate-200">
                    Không giới hạn hạn nộp
                  </Badge>
                )}

                <Badge size="sm" className="bg-blue-50 text-blue-800 border-blue-200">
                  {assignment?.allowResubmission
                    ? assignment.maxAttempts
                      ? `Tối đa ${assignment.maxAttempts} lần nộp`
                      : 'Cho phép nộp lại'
                    : 'Chỉ nộp 1 lần duy nhất'}
                </Badge>
              </div>

              {assignment?.session && (
                <span className="text-xs text-slate-500">
                  Buổi học: <strong>{assignment.session.title}</strong>
                </span>
              )}
            </div>

            {/* Nội dung đề bài */}
            {assignment?.description ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nội dung đề bài & Hướng dẫn làm bài
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs font-serif">
                  {assignment.description}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Không có mô tả chi tiết cho đề bài này.</p>
            )}

            {/* Tệp tài liệu đề bài đính kèm */}
            {assignment?.attachments && assignment.attachments.length > 0 && (
              <div className="pt-2">
                <AttachmentList
                  title="Tài liệu & Đề bài đính kèm từ giáo viên"
                  attachments={assignment.attachments}
                />
              </div>
            )}
          </Card>

          {/* KẾT QUẢ ĐÁNH GIÁ (CHỈ HIỂN THỊ KHI ĐÃ ĐƯỢC TRẢ BÀI) */}
          {latestSubmission && (
            <Card className="p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  Kết quả chấm bài & Lời phê của giáo viên
                </h3>
                <AssignmentStatusBadge
                  status={isReturned ? 'RETURNED' : 'SUBMITTED'}
                  isLate={currentSubmission?.isLate}
                />
              </div>

              {isReturned && currentSubmission ? (
                <div className="space-y-4">
                  {/* Điểm số */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-800">
                        Điểm bài thi (Lần nộp thứ {currentSubmission.attemptNumber})
                      </p>
                      <p className="text-2xl font-bold font-serif text-emerald-950 mt-0.5">
                        {currentSubmission.review?.score !== null &&
                        currentSubmission.review?.score !== undefined
                          ? currentSubmission.review.score
                          : currentSubmission.score}{' '}
                        <span className="text-sm font-normal text-emerald-700">
                          / {assignment?.maxScore} điểm
                        </span>
                      </p>
                    </div>

                    {currentSubmission.review?.returnedAt && (
                      <span className="text-xs text-emerald-700 font-medium">
                        Trả bài: {formatDateTime(currentSubmission.review.returnedAt)}
                      </span>
                    )}
                  </div>

                  {/* Lời nhận xét */}
                  {(currentSubmission.review?.feedback || currentSubmission.feedback) && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        Lời nhận xét chi tiết:
                      </h4>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                        {currentSubmission.review?.feedback || currentSubmission.feedback}
                      </div>
                    </div>
                  )}

                  {/* Tệp bài chữa đính kèm */}
                  {currentSubmission.review?.attachments &&
                    currentSubmission.review.attachments.length > 0 && (
                      <div className="pt-1">
                        <AttachmentList
                          title="Tệp bài chữa & Nhận xét đính kèm của giáo viên"
                          attachments={currentSubmission.review.attachments}
                        />
                      </div>
                    )}
                </div>
              ) : (
                /* Chưa trả bài hoặc đang là bản nháp: Tuyệt đối không để lộ điểm / feedback nháp */
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1 text-center py-6">
                  <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-800 text-sm">
                    Bài làm đang chờ giáo viên chấm bài
                  </p>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Bài làm của em đã được hệ thống ghi nhận. Khi giáo viên hoàn tất việc chấm bài và trả bài công khai,
                    điểm số và nhận xét sẽ hiển thị tại đây.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Lịch sử các lần nộp của học sinh (nếu có nộp bài) */}
          {submissionList.length > 0 && (
            <Card className="p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Các lần nộp bài ({submissionList.length} lần)
                </h4>
              </div>

              <div className="space-y-3 divide-y divide-slate-100">
                {submissionList.map((sub) => {
                  const isSelected = sub.id === (currentSubmission?.id || '');
                  const subReturned = sub.review?.status === 'RETURNED' || sub.status === 'RETURNED';

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedAttemptId(sub.id)}
                      className={`pt-3 first:pt-0 p-3 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-50/70 border border-amber-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            Lần nộp thứ {sub.attemptNumber}
                          </span>
                          <AssignmentStatusBadge
                            status={subReturned ? 'RETURNED' : 'SUBMITTED'}
                            isLate={sub.isLate}
                          />
                        </div>
                        <span className="text-slate-500">{formatDateTime(sub.submittedAt)}</span>
                      </div>

                      {sub.content && (
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {sub.content}
                        </p>
                      )}

                      {sub.externalUrl && (
                        <p className="text-[11px] text-amber-700 truncate mt-1">
                          Liên kết: {sub.externalUrl}
                        </p>
                      )}

                      {/* Attachments của lần nộp */}
                      {sub.attachments && sub.attachments.length > 0 && (
                        <div className="mt-2">
                          <AttachmentList
                            title={`Tệp đính kèm lần ${sub.attemptNumber}`}
                            attachments={sub.attachments}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Cột phải: Form nộp bài / nộp lại bài */}
        <div className="space-y-6">
          <Card className="p-5 border border-slate-200/90 shadow-2xs space-y-4 sticky top-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 font-serif">
                {latestSubmission ? 'Nộp lại bài tập' : 'Khu vực nộp bài'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Điền nội dung làm văn hoặc đính kèm tệp bài làm trực tiếp
              </p>
            </div>

            {assignment && (
              <StudentSubmissionForm
                assignment={assignment}
                previousAttemptsCount={submissionList.length}
                onSubmit={handleSubmit}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
