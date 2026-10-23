import { useState, type FormEvent } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle, Send, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/features/classes/components/ConfirmModal';
import { useFileUpload, type UploadedFileItem } from '../hooks/useFileUpload';
import { formatBytes } from '../utils/assignment.utils';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import type { AssignmentDetail, SubmitAssignmentDto } from '../types/assignment.types';

export interface StudentSubmissionFormProps {
  assignment: AssignmentDetail;
  previousAttemptsCount: number;
  onSubmit: (dto: SubmitAssignmentDto) => Promise<void>;
  disabled?: boolean;
}

export function StudentSubmissionForm({
  assignment,
  previousAttemptsCount,
  onSubmit,
  disabled = false,
}: StudentSubmissionFormProps) {
  const { showToast } = useToast();

  const [content, setContent] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Kiểm tra chính sách nộp lại
  const hasSubmitted = previousAttemptsCount > 0;
  const canResubmit =
    !hasSubmitted ||
    (assignment.allowResubmission &&
      (assignment.maxAttempts === null ||
        assignment.maxAttempts === undefined ||
        previousAttemptsCount < assignment.maxAttempts));

  const isMaxAttemptsReached =
    assignment.maxAttempts !== null &&
    assignment.maxAttempts !== undefined &&
    previousAttemptsCount >= assignment.maxAttempts;

  // Upload tệp bài nộp của học sinh (targetType: SUBMISSION)
  const { uploadFile, isUploading, progress, error: uploadError } = useFileUpload({
    targetType: 'SUBMISSION',
    targetId: assignment.id,
    onSuccess: (uploaded) => {
      setUploadedFiles((prev) => [...prev, uploaded]);
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

  const validate = (): boolean => {
    const hasContent = content.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;
    const hasUrl = externalUrl.trim().length > 0;

    if (!hasContent && !hasFiles && !hasUrl) {
      setApiError('Vui lòng nhập nội dung bài làm, đính kèm tệp hoặc liên kết bài viết');
      return false;
    }

    if (externalUrl.trim()) {
      try {
        new URL(externalUrl.trim());
      } catch {
        setApiError('Đường dẫn liên kết ngoài không hợp lệ (cần bắt đầu bằng http:// hoặc https://)');
        return false;
      }
    }

    return true;
  };

  const handleOpenConfirm = (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const payload: SubmitAssignmentDto = {
        content: content.trim() || undefined,
        externalUrl: externalUrl.trim() || undefined,
        attachmentKeys:
          uploadedFiles.length > 0 ? uploadedFiles.map((f) => f.storageKey) : undefined,
      };

      await onSubmit(payload);
      showToast({
        type: 'success',
        message: hasSubmitted
          ? `Nộp lại bài thành công (Lần nộp thứ ${previousAttemptsCount + 1})`
          : 'Nộp bài tập thành công!',
      });
      setContent('');
      setExternalUrl('');
      setUploadedFiles([]);
      setIsConfirmOpen(false);
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canResubmit) {
    return (
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 space-y-1">
        <p className="font-semibold flex items-center gap-1.5 text-sm text-amber-950">
          <AlertCircle className="w-4 h-4 text-amber-700" />
          Không thể nộp lại bài
        </p>
        <p>
          {isMaxAttemptsReached
            ? `Bạn đã đạt giới hạn tối đa ${assignment.maxAttempts} lần nộp cho bài tập này.`
            : 'Bài tập này không cho phép nộp lại sau khi đã nộp bài.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleOpenConfirm} className="space-y-4">
      {/* Thông tin số lần nộp */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div>
          <span className="font-semibold text-slate-800">
            {hasSubmitted ? `Nộp lại (Lần ${previousAttemptsCount + 1})` : 'Nộp bài lần đầu'}
          </span>
          {assignment.maxAttempts && (
            <span className="text-slate-500 ml-1.5">
              (Tối đa: {assignment.maxAttempts} lần)
            </span>
          )}
        </div>
        {hasSubmitted && (
          <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
            Đã nộp {previousAttemptsCount} lần
          </span>
        )}
      </div>

      {apiError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Nội dung bài làm */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Nội dung bài làm trực tiếp
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={disabled || isSubmitting}
          rows={5}
          placeholder="Viết bài làm, đoạn văn hoặc dàn ý của em tại đây..."
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y"
        />
      </div>

      {/* Liên kết ngoài */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Liên kết bài viết ngoài (Google Docs, Canva, Notion - tùy chọn)
        </label>
        <div className="relative">
          <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            disabled={disabled || isSubmitting}
            placeholder="https://docs.google.com/document/d/..."
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Upload tệp bài làm */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Đính kèm tệp bài làm (Word, PDF, Ảnh bài viết tay - tối đa 100MB)
        </label>

        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
          <Upload className="w-5 h-5 text-slate-400 mb-1" />
          <span className="text-xs text-slate-600 font-medium">Bấm để tải tệp bài làm lên</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Tối đa 100MB mỗi tệp</span>
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            disabled={disabled || isUploading || isSubmitting}
            className="hidden"
          />
        </label>

        {isUploading && (
          <div className="space-y-1 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
            <div className="flex items-center justify-between text-amber-900 font-medium">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang tải tệp bài làm lên đám mây...
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

        {uploadedFiles.length > 0 && (
          <div className="space-y-1.5 mt-2">
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
      </div>

      {/* Nút gửi bài */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={disabled || isSubmitting || isUploading}
          className="w-full py-2.5 cursor-pointer font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Đang gửi bài...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {hasSubmitted ? 'Xác nhận nộp lại bài' : 'Gửi bài nộp'}
            </>
          )}
        </Button>
      </div>

      {/* Modal xác nhận nộp bài */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title={hasSubmitted ? 'Xác nhận nộp lại bài tập' : 'Xác nhận nộp bài tập'}
        description={
          hasSubmitted
            ? `Bạn sắp nộp lại bài (lần ${previousAttemptsCount + 1}). Giáo viên sẽ nhận được bài nộp mới nhất của bạn để chấm.`
            : 'Bạn có chắc chắn muốn nộp bài tập này? Vui lòng kiểm tra kỹ nội dung và các tệp đính kèm trước khi gửi.'
        }
        confirmLabel="Đồng ý gửi bài"
        cancelLabel="Kiểm tra lại"
        variant="primary"
        isLoading={isSubmitting}
      />
    </form>
  );
}
