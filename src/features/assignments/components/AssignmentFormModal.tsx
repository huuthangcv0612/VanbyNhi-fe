import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import { useFileUpload, type UploadedFileItem } from '../hooks/useFileUpload';
import { formatBytes } from '../utils/assignment.utils';
import type {
  AssignmentItem,
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from '../types/assignment.types';
import { getApiErrorMessage } from '@/lib/api-client';

export interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAssignmentDto | UpdateAssignmentDto) => Promise<void>;
  assignmentToEdit?: AssignmentItem | null;
  defaultClassId?: string;
}

interface FormInnerProps {
  onClose: () => void;
  onSubmit: (data: CreateAssignmentDto | UpdateAssignmentDto) => Promise<void>;
  assignmentToEdit?: AssignmentItem | null;
  defaultClassId?: string;
}

function AssignmentFormInner({
  onClose,
  onSubmit,
  assignmentToEdit,
  defaultClassId,
}: FormInnerProps) {
  const isEdit = Boolean(assignmentToEdit);

  const [classId, setClassId] = useState(
    () => assignmentToEdit?.classId || defaultClassId || '',
  );
  const [sessionId, setSessionId] = useState(
    () => assignmentToEdit?.sessionId || '',
  );
  const [title, setTitle] = useState(() => assignmentToEdit?.title || '');
  const [description, setDescription] = useState(
    () => assignmentToEdit?.description || '',
  );
  const [dueDate, setDueDate] = useState(() => {
    if (!assignmentToEdit?.dueDate) return '';
    try {
      const d = new Date(assignmentToEdit.dueDate);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset)
        .toISOString()
        .slice(0, 16);
      return localISOTime;
    } catch {
      return '';
    }
  });
  const [maxScore, setMaxScore] = useState<string>(() =>
    assignmentToEdit?.maxScore !== undefined
      ? String(assignmentToEdit.maxScore)
      : '10',
  );
  const [allowResubmission, setAllowResubmission] = useState(
    () => assignmentToEdit?.allowResubmission ?? true,
  );
  const [maxAttempts, setMaxAttempts] = useState<string>(() =>
    assignmentToEdit?.maxAttempts ? String(assignmentToEdit.maxAttempts) : '',
  );

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy danh sách lớp học của giáo viên
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['teacher-classes-options'],
    queryFn: () => teacherClassesService.getMyClasses({ limit: 100 }),
    enabled: !isEdit,
  });

  const classes = classesData?.items || [];

  // Lấy danh sách buổi học của lớp nếu có classId
  const { data: sessionsData } = useQuery({
    queryKey: ['class-sessions-for-assignment', classId],
    queryFn: () => teacherClassesService.getClassSessions(classId, { limit: 100 }),
    enabled: Boolean(classId),
  });
  const sessions = sessionsData?.items || [];

  // Hook upload file đề bài lên Cloudflare R2
  const { uploadFile, isUploading, progress, error: uploadError } = useFileUpload({
    targetType: 'ASSIGNMENT',
    onSuccess: (uploadedItem) => {
      setUploadedFiles((prev) => [...prev, uploadedItem]);
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
    const errs: Record<string, string> = {};

    if (!isEdit && !classId) {
      errs.classId = 'Vui lòng chọn lớp học';
    }

    if (!title.trim()) {
      errs.title = 'Tiêu đề bài tập không được để trống';
    }

    const numScore = Number(maxScore);
    if (isNaN(numScore) || numScore <= 0) {
      errs.maxScore = 'Thang điểm tối đa phải là số lớn hơn 0';
    }

    if (maxAttempts && (isNaN(Number(maxAttempts)) || Number(maxAttempts) < 1)) {
      errs.maxAttempts = 'Số lần nộp tối đa phải từ 1 trở lên';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const attachmentKeys = uploadedFiles.map((f) => f.storageKey);

      if (isEdit) {
        const payload: UpdateAssignmentDto = {
          title: title.trim(),
          description: description.trim() || undefined,
          sessionId: sessionId || null,
          maxScore: Number(maxScore),
          allowResubmission,
          maxAttempts: maxAttempts ? Number(maxAttempts) : null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          attachmentKeys: attachmentKeys.length > 0 ? attachmentKeys : undefined,
        };
        await onSubmit(payload);
      } else {
        const payload: CreateAssignmentDto = {
          classId,
          sessionId: sessionId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          maxScore: Number(maxScore),
          allowResubmission,
          maxAttempts: maxAttempts ? Number(maxAttempts) : undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          attachmentKeys: attachmentKeys.length > 0 ? attachmentKeys : undefined,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Chọn lớp học (chỉ khi tạo mới) */}
      {!isEdit && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lớp học <span className="text-rose-500">*</span>
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={isLoadingClasses || Boolean(defaultClassId)}
            className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="">-- Chọn lớp học --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.classCode})
              </option>
            ))}
          </select>
          {errors.classId && <p className="text-xs text-rose-600 mt-1">{errors.classId}</p>}
        </div>
      )}

      {/* Buổi học (nếu lớp có buổi học) */}
      {sessions.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Gắn với buổi học (Tùy chọn)
          </label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="">-- Không gắn với buổi học nào --</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tiêu đề bài tập */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Tiêu đề bài tập <span className="text-rose-500">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Phân tích bài thơ Tây Tiến - Quang Dũng"
          error={errors.title}
        />
      </div>

      {/* Mô tả / Hướng dẫn */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Đề bài & Hướng dẫn làm bài
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Nhập nội dung đề bài, yêu cầu cụ thể, gợi ý lập dàn ý..."
          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y"
        />
      </div>

      {/* Hạn nộp & Thang điểm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Hạn nộp bài
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Thang điểm tối đa
          </label>
          <Input
            type="number"
            step="0.5"
            min="1"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            error={errors.maxScore}
          />
        </div>
      </div>

      {/* Chính sách nộp bài */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Chính sách nộp bài
        </p>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowResubmission"
            checked={allowResubmission}
            onChange={(e) => setAllowResubmission(e.target.checked)}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
          />
          <label htmlFor="allowResubmission" className="text-xs text-slate-700 cursor-pointer font-medium">
            Cho phép học sinh nộp lại bài
          </label>
        </div>

        {allowResubmission && (
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Giới hạn số lần nộp (để trống nếu không giới hạn)
            </label>
            <Input
              type="number"
              min="1"
              placeholder="VD: 3"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              error={errors.maxAttempts}
              className="max-w-xs"
            />
          </div>
        )}
      </div>

      {/* Đính kèm tệp đề bài */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Tệp đính kèm đề bài (PDF, Word, Ảnh, Zip - tối đa 100MB)
        </label>

        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
          <Upload className="w-5 h-5 text-slate-400 mb-1" />
          <span className="text-xs text-slate-600 font-medium">Bấm để chọn tệp tải lên</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ tối đa 100MB</span>
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            disabled={isUploading}
            className="hidden"
          />
        </label>

        {isUploading && (
          <div className="space-y-1 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-amber-900 font-medium">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang tải tệp lên R2...
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

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Đang lưu...
            </>
          ) : isEdit ? (
            'Lưu thay đổi'
          ) : (
            'Tạo bài tập'
          )}
        </Button>
      </div>
    </form>
  );
}

export function AssignmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  assignmentToEdit,
  defaultClassId,
}: AssignmentFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignmentToEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
      description="Điền thông tin đề bài, hạn nộp và chính sách nộp bài cho học sinh"
    >
      {isOpen && (
        <AssignmentFormInner
          key={assignmentToEdit?.id || 'new'}
          onClose={onClose}
          onSubmit={onSubmit}
          assignmentToEdit={assignmentToEdit}
          defaultClassId={defaultClassId}
        />
      )}
    </Modal>
  );
}
