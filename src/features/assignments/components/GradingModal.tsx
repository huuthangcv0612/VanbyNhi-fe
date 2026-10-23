import { useState } from 'react';
import {
  Award,
  FileCheck,
  Upload,
  X,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  User,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmModal } from '@/features/classes/components/ConfirmModal';
import { AttachmentList } from './AttachmentList';
import { useFileUpload, type UploadedFileItem } from '../hooks/useFileUpload';
import { formatBytes } from '../utils/assignment.utils';
import { formatDateTime } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import type {
  AssignmentSubmissionItem,
  ReviewSubmissionDto,
} from '../types/assignment.types';

export interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: AssignmentSubmissionItem | null;
  maxScore?: number;
  onSaveReview: (dto: ReviewSubmissionDto) => Promise<void>;
  onToggleKeepForever?: (attachmentId: string, isKeepForever: boolean) => Promise<void> | void;
}

interface FormInnerProps {
  onClose: () => void;
  submission: AssignmentSubmissionItem;
  maxScore: number;
  onSaveReview: (dto: ReviewSubmissionDto) => Promise<void>;
  onToggleKeepForever?: (attachmentId: string, isKeepForever: boolean) => Promise<void> | void;
}

function GradingFormInner({
  onClose,
  submission,
  maxScore,
  onSaveReview,
  onToggleKeepForever,
}: FormInnerProps) {
  const { showToast } = useToast();

  const existingReview = submission.review;
  const initialScore =
    existingReview?.score !== null && existingReview?.score !== undefined
      ? String(existingReview.score)
      : submission.score !== null && submission.score !== undefined
        ? String(submission.score)
        : '';
  const initialFeedback = existingReview?.feedback || submission.feedback || '';

  const [score, setScore] = useState(() => initialScore);
  const [feedback, setFeedback] = useState(() => initialFeedback);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [isConfirmReturnOpen, setIsConfirmReturnOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hook upload bài chữa cho giáo viên (targetType: REVIEW)
  const { uploadFile, isUploading, progress, error: uploadError } = useFileUpload({
    targetType: 'REVIEW',
    targetId: submission.id,
    onSuccess: (item) => {
      setUploadedFiles((prev) => [...prev, item]);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }
    e.target.value = '';
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateScore = (): boolean => {
    if (!score.trim()) return true; // Khi lưu nháp có thể chưa có điểm
    const num = Number(score);
    if (isNaN(num) || num < 0 || num > maxScore) {
      setErrorMessage(`Điểm số phải là số hợp lệ từ 0 đến ${maxScore}`);
      return false;
    }
    return true;
  };

  // Lưu bản nháp (DRAFT)
  const handleSaveDraft = async () => {
    setErrorMessage(null);
    if (!validateScore()) return;

    setIsSubmittingDraft(true);
    try {
      const attachmentKeys = uploadedFiles.map((f) => f.storageKey);
      await onSaveReview({
        score: score.trim() ? Number(score) : undefined,
        feedback: feedback.trim() || undefined,
        status: 'DRAFT',
        attachmentKeys: attachmentKeys.length > 0 ? attachmentKeys : undefined,
      });
      showToast({
        type: 'success',
        message: 'Đã lưu bản nháp chấm bài. Học sinh chưa xem được kết quả này.',
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  // Nhấn nút Trả bài -> kiểm tra điểm trước khi mở modal xác nhận
  const handleOpenConfirmReturn = () => {
    setErrorMessage(null);
    if (!score.trim()) {
      setErrorMessage('Vui lòng nhập điểm trước khi trả bài cho học sinh');
      return;
    }
    const num = Number(score);
    if (isNaN(num) || num < 0 || num > maxScore) {
      setErrorMessage(`Điểm số phải là số hợp lệ từ 0 đến ${maxScore}`);
      return;
    }
    setIsConfirmReturnOpen(true);
  };

  // Xác nhận trả bài (RETURNED)
  const handleConfirmReturn = async () => {
    setIsSubmittingReturn(true);
    try {
      const attachmentKeys = uploadedFiles.map((f) => f.storageKey);
      await onSaveReview({
        score: Number(score),
        feedback: feedback.trim() || undefined,
        status: 'RETURNED',
        attachmentKeys: attachmentKeys.length > 0 ? attachmentKeys : undefined,
      });
      showToast({
        type: 'success',
        message: 'Đã trả bài thành công! Học sinh đã có thể xem điểm và nhận xét.',
      });
      setIsConfirmReturnOpen(false);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const isCurrentDraft = existingReview?.status === 'DRAFT';
  const isCurrentReturned = existingReview?.status === 'RETURNED' || submission.status === 'RETURNED';

  return (
    <div className="space-y-5">
      {/* Thông tin học sinh và lượt nộp */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-semibold font-serif">
            {submission.student?.fullName?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{submission.student?.fullName}</p>
            <p className="text-slate-500">{submission.student?.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-slate-500">Lượt nộp thứ {submission.attemptNumber}</p>
            <p className="text-slate-700 font-medium">{formatDateTime(submission.submittedAt)}</p>
          </div>
          {submission.isLate ? (
            <Badge size="sm" className="bg-rose-100 text-rose-800 border-rose-200 text-xs">
              Nộp muộn
            </Badge>
          ) : (
            <Badge size="sm" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
              Đúng hạn
            </Badge>
          )}
        </div>
      </div>

      {/* Nội dung bài làm của học sinh */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Bài nộp của học sinh
        </h4>
        {submission.content ? (
          <div className="p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-2xs">
            {submission.content}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Học sinh không nhập nội dung văn bản.</p>
        )}

        {submission.externalUrl && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-medium">Liên kết ngoài:</span>
            <a
              href={submission.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:text-amber-800 underline flex items-center gap-1 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{submission.externalUrl}</span>
            </a>
          </div>
        )}

        {/* Tệp học sinh đính kèm */}
        {submission.attachments && submission.attachments.length > 0 && (
          <div className="pt-2">
            <AttachmentList
              title="Tệp đính kèm của bài nộp"
              attachments={submission.attachments}
              canToggleKeepForever={true}
              onToggleKeepForever={onToggleKeepForever}
            />
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* Form chấm điểm */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-amber-600" />
            Đánh giá & Chấm bài
          </h4>
          {isCurrentReturned ? (
            <Badge size="sm" className="bg-emerald-100 text-emerald-800 border-emerald-200">
              Đã trả bài
            </Badge>
          ) : isCurrentDraft ? (
            <Badge size="sm" className="bg-indigo-100 text-indigo-800 border-indigo-200">
              Bản nháp
            </Badge>
          ) : null}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Điểm số */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Điểm số (Thang điểm: {maxScore}) <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2 max-w-xs">
            <Input
              type="number"
              step="0.25"
              min="0"
              max={maxScore}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder={`0 - ${maxScore}`}
            />
            <span className="text-sm font-semibold text-slate-500 font-serif">/ {maxScore}</span>
          </div>
        </div>

        {/* Nhận xét */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nhận xét của giáo viên
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            placeholder="Ghi nhận xét ưu điểm, lỗi diễn đạt, gợi ý sửa đổi cho học sinh..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y"
          />
        </div>

        {/* Tệp bài chữa đính kèm */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Tải lên tệp bài chữa (PDF, Word, Ảnh đã ghi chú bài làm)
          </label>

          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-slate-400 mb-1" />
            <span className="text-xs text-slate-600 font-medium">Bấm để tải tệp bài chữa</span>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              disabled={isUploading}
              className="hidden"
            />
          </label>

          {isUploading && (
            <div className="space-y-1 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between text-xs text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tải lên bài chữa...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-1.5 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {uploadError}
            </p>
          )}

          {/* Danh sách tệp bài chữa mới upload */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-1.5">
              {uploadedFiles.map((f, idx) => (
                <div
                  key={f.storageKey}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate font-medium text-slate-700">{f.originalName}</span>
                    <span className="text-slate-400 text-[11px]">({formatBytes(f.sizeBytes)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeUploadedFile(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Danh sách bài chữa đã có từ trước */}
          {existingReview?.attachments && existingReview.attachments.length > 0 && (
            <div className="pt-1">
              <AttachmentList
                title="Tệp bài chữa đã đính kèm trước đó"
                attachments={existingReview.attachments}
                canToggleKeepForever={true}
                onToggleKeepForever={onToggleKeepForever}
              />
            </div>
          )}
        </div>

        {/* Gợi ý quy trình */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý:</strong> Khi chọn <em>&quot;Lưu bản nháp&quot;</em>, học sinh chưa nhìn thấy điểm và nhận xét.
            Chỉ khi chọn <em>&quot;Trả bài cho học sinh&quot;</em>, kết quả mới được công khai và gửi thông báo tới học sinh.
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmittingDraft || isSubmittingReturn}>
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmittingDraft || isSubmittingReturn || isUploading}
              onClick={handleSaveDraft}
              className="text-xs"
            >
              {isSubmittingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Đang lưu nháp...
                </>
              ) : (
                'Lưu bản nháp'
              )}
            </Button>

            <Button
              type="button"
              variant="primary"
              disabled={isSubmittingDraft || isSubmittingReturn || isUploading}
              onClick={handleOpenConfirmReturn}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
            >
              {isSubmittingReturn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Đang trả bài...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 mr-1.5" />
                  Trả bài cho học sinh
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal xác nhận trả bài */}
      <ConfirmModal
        isOpen={isConfirmReturnOpen}
        onClose={() => setIsConfirmReturnOpen(false)}
        onConfirm={handleConfirmReturn}
        title="Xác nhận trả bài cho học sinh"
        description={`Bạn có chắc chắn muốn công khai kết quả và trả bài cho học sinh ${submission.student?.fullName || ''}? Sau khi trả bài, học sinh sẽ nhận được thông báo và xem được điểm số (${score}/${maxScore}) cùng bài chữa.`}
        confirmLabel="Xác nhận trả bài"
        cancelLabel="Quay lại kiểm tra"
        variant="primary"
        isLoading={isSubmittingReturn}
      />
    </div>
  );
}

export function GradingModal({
  isOpen,
  onClose,
  submission,
  maxScore = 10,
  onSaveReview,
  onToggleKeepForever,
}: GradingModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chấm điểm & Nhận xét bài làm"
      description="Xem bài làm của học sinh, nhập điểm, nhận xét và đính kèm bài chữa chi tiết"
      maxWidth="lg"
    >
      {isOpen && submission && (
        <GradingFormInner
          key={submission.id}
          onClose={onClose}
          submission={submission}
          maxScore={maxScore}
          onSaveReview={onSaveReview}
          onToggleKeepForever={onToggleKeepForever}
        />
      )}
    </Modal>
  );
}
