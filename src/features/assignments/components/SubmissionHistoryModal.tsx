import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Loader2, Award, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { assignmentsService } from '../services/assignments.service';
import { AttachmentList } from './AttachmentList';
import { formatDateTime } from '@/utils/formatters';
import { AssignmentStatusBadge } from './AssignmentStatusBadge';

export interface SubmissionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  maxScore?: number;
  onGradeSubmission?: (submissionId: string) => void;
}

export function SubmissionHistoryModal({
  isOpen,
  onClose,
  assignmentId,
  studentId,
  studentName,
  maxScore = 10,
  onGradeSubmission,
}: SubmissionHistoryModalProps) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submission-history', assignmentId, studentId],
    queryFn: () => assignmentsService.getSubmissions(assignmentId, { studentId }),
    enabled: isOpen && Boolean(assignmentId) && Boolean(studentId),
  });

  const submissionList = submissions || [];
  const activeSubmission =
    submissionList.find((s) => s.id === selectedSubmissionId) ||
    submissionList[0] ||
    null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lịch sử nộp bài: ${studentName || 'Học sinh'}`}
      description="Xem tất cả các lần nộp bài, tệp đính kèm và đánh giá qua các lần nộp"
      maxWidth="lg"
    >
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <p className="text-xs">Đang tải lịch sử các lần nộp...</p>
        </div>
      ) : submissionList.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          Chưa có bài nộp nào từ học sinh này.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Danh sách các lần nộp (Tabs) */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {submissionList.map((sub) => {
              const isActive = sub.id === (activeSubmission?.id || '');
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>Lần nộp #{sub.attemptNumber}</span>
                  {sub.isLate && (
                    <span className="text-[10px] px-1 rounded bg-rose-500/20 text-rose-200">
                      Muộn
                    </span>
                  )}
                  {sub.score !== null && (
                    <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-100 font-bold">
                      {sub.score}đ
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chi tiết lần nộp đang chọn */}
          {activeSubmission && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">
                    Lần nộp thứ {activeSubmission.attemptNumber}
                  </span>
                  <AssignmentStatusBadge
                    status={activeSubmission.status}
                    isLate={activeSubmission.isLate}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateTime(activeSubmission.submittedAt)}</span>
                </div>
              </div>

              {/* Nội dung bài làm */}
              {activeSubmission.content && (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    Nội dung bài làm:
                  </p>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {activeSubmission.content}
                  </div>
                </div>
              )}

              {/* External url */}
              {activeSubmission.externalUrl && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Liên kết ngoài:</span>
                  <a
                    href={activeSubmission.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:text-amber-800 underline flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{activeSubmission.externalUrl}</span>
                  </a>
                </div>
              )}

              {/* Tệp đính kèm */}
              {activeSubmission.attachments && activeSubmission.attachments.length > 0 && (
                <AttachmentList
                  title="Tệp bài nộp"
                  attachments={activeSubmission.attachments}
                />
              )}

              {/* Đánh giá / Review */}
              {activeSubmission.review && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      Kết quả đánh giá:
                    </p>
                    <Badge size="sm" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      {activeSubmission.review.status === 'RETURNED' ? 'Đã trả bài' : 'Bản nháp'}
                    </Badge>
                  </div>
                  {activeSubmission.review.score !== null && (
                    <p className="text-sm font-bold text-emerald-900 font-serif">
                      Điểm: {activeSubmission.review.score} / {maxScore}
                    </p>
                  )}
                  {activeSubmission.review.feedback && (
                    <p className="text-slate-700 whitespace-pre-wrap text-xs">
                      <strong>Nhận xét:</strong> {activeSubmission.review.feedback}
                    </p>
                  )}
                  {activeSubmission.review.attachments &&
                    activeSubmission.review.attachments.length > 0 && (
                      <div className="pt-2">
                        <AttachmentList
                          title="Tệp bài chữa của giáo viên"
                          attachments={activeSubmission.review.attachments}
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Action chấm lần này */}
              {onGradeSubmission && (
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onGradeSubmission(activeSubmission.id);
                      onClose();
                    }}
                  >
                    Chấm lượt nộp này
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
