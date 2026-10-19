import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-client';
import { googleService } from '@/features/google/services/google.service';
import type { ClassItem, TeacherCreateClassDto, TeacherUpdateClassDto } from '../types/class.types';

export interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeacherCreateClassDto | TeacherUpdateClassDto) => Promise<void>;
  classToEdit?: ClassItem | null;
  isLoading?: boolean;
}

interface ClassFormInnerProps {
  onClose: () => void;
  onSubmit: (data: TeacherCreateClassDto | TeacherUpdateClassDto) => Promise<void>;
  classToEdit?: ClassItem | null;
  isLoading: boolean;
}

function ClassFormInner({
  onClose,
  onSubmit,
  classToEdit,
  isLoading,
}: ClassFormInnerProps) {
  const isEdit = Boolean(classToEdit);

  const [name, setName] = useState(() => classToEdit?.name || '');
  const [description, setDescription] = useState(() => classToEdit?.description || '');
  const [maxStudents, setMaxStudents] = useState<string>(() =>
    classToEdit?.maxStudents !== null && classToEdit?.maxStudents !== undefined
      ? String(classToEdit.maxStudents)
      : '',
  );
  const [monthlyTuition, setMonthlyTuition] = useState<string>(() =>
    classToEdit?.monthlyTuition !== null && classToEdit?.monthlyTuition !== undefined
      ? String(classToEdit.monthlyTuition)
      : '0',
  );
  const [defaultMeetUrl, setDefaultMeetUrl] = useState(() => classToEdit?.defaultMeetUrl || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kiểm tra trạng thái Google connection khi tạo lớp mới
  const { data: googleConnection } = useQuery({
    queryKey: ['google-connection'],
    queryFn: () => googleService.getConnectionStatus(),
    enabled: !isEdit,
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Tên lớp học không được để trống';
    } else if (name.trim().length > 255) {
      errs.name = 'Tên lớp học không được vượt quá 255 ký tự';
    }

    if (description.length > 1000) {
      errs.description = 'Mô tả lớp học không được vượt quá 1000 ký tự';
    }

    if (maxStudents.trim() !== '') {
      const num = Number(maxStudents);
      if (isNaN(num) || !Number.isInteger(num) || num < 1) {
        errs.maxStudents = 'Sĩ số tối đa phải là số nguyên lớn hơn hoặc bằng 1';
      }
    }

    if (monthlyTuition.trim() !== '') {
      const tuition = Number(monthlyTuition);
      if (isNaN(tuition) || tuition < 0) {
        errs.monthlyTuition = 'Học phí hàng tháng không được âm';
      }
    }

    if (defaultMeetUrl.trim() !== '') {
      try {
        const url = new URL(defaultMeetUrl.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
          errs.defaultMeetUrl = 'Link Google Meet phải bắt đầu bằng http:// hoặc https://';
        }
      } catch {
        errs.defaultMeetUrl = 'Link Google Meet không đúng định dạng URL';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLoading) return;
    setApiError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: TeacherCreateClassDto | TeacherUpdateClassDto = {
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
        maxStudents: maxStudents.trim() !== '' ? Number(maxStudents) : isEdit ? null : undefined,
        monthlyTuition: monthlyTuition.trim() !== '' ? Number(monthlyTuition) : 0,
        defaultMeetUrl: defaultMeetUrl.trim() ? defaultMeetUrl.trim() : undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGoogleMissing =
    !isEdit && googleConnection && googleConnection.status !== 'CONNECTED';

  return (
    <form id="class-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Banner cảnh báo chưa liên kết Google Workspace */}
      {isGoogleMissing && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-amber-900">
              <p className="font-semibold">
                Bạn chưa liên kết tài khoản Google Workspace
              </p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Hệ thống yêu cầu giáo viên liên kết tài khoản Google Workspace trước khi tạo lớp để tự động khởi tạo phòng học Google Meet độc quyền cho lớp học.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-0.5">
            <Link
              to="/teacher/settings/google"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-700 underline"
            >
              <span>Đi đến trang liên kết Google Workspace</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {apiError && (
        <div className="rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200 space-y-1.5">
          <p className="font-medium">{apiError}</p>
          {apiError.toLowerCase().includes('google') && (
            <div className="pt-1">
              <Link
                to="/teacher/settings/google"
                onClick={onClose}
                className="inline-flex items-center gap-1 font-bold text-rose-900 hover:underline"
              >
                <span>Cài đặt liên kết tài khoản Google ngay</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tên lớp học <span className="text-rose-500">*</span>
        </label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="Ví dụ: Văn học 12 - Luyện thi THPT Quốc gia"
          error={errors.name}
          maxLength={255}
          disabled={isLoading || isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Mô tả lớp học
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
          }}
          rows={3}
          placeholder="Tóm tắt nội dung, đối tượng hoặc mục tiêu của lớp học..."
          maxLength={1000}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-rose-500">{errors.description}</p>
        )}
        <p className="mt-1 text-right text-xs text-slate-400">
          {description.length}/1000
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sĩ số tối đa
          </label>
          <Input
            type="number"
            min={1}
            value={maxStudents}
            onChange={(e) => {
              setMaxStudents(e.target.value);
              if (errors.maxStudents) setErrors((prev) => ({ ...prev, maxStudents: '' }));
            }}
            placeholder="Để trống nếu không giới hạn"
            error={errors.maxStudents}
          />
          <p className="mt-1 text-xs text-slate-500">
            Hệ thống sẽ không cho phép duyệt thêm khi lớp đã đầy.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Học phí hàng tháng (VNĐ)
          </label>
          <Input
            type="number"
            min={0}
            step={10000}
            value={monthlyTuition}
            onChange={(e) => {
              setMonthlyTuition(e.target.value);
              if (errors.monthlyTuition) setErrors((prev) => ({ ...prev, monthlyTuition: '' }));
            }}
            placeholder="0"
            error={errors.monthlyTuition}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Link Google Meet mặc định
        </label>
        <Input
          type="url"
          value={defaultMeetUrl}
          onChange={(e) => {
            setDefaultMeetUrl(e.target.value);
            if (errors.defaultMeetUrl) setErrors((prev) => ({ ...prev, defaultMeetUrl: '' }));
          }}
          placeholder="https://meet.google.com/xxx-yyyy-zzz"
          error={errors.defaultMeetUrl}
        />
        <p className="mt-1 text-xs text-slate-500">
          Link học trực tuyến cố định cho các buổi học của lớp này (tùy chọn).
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading || isSubmitting}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          isLoading={isLoading || isSubmitting}
          disabled={isLoading || isSubmitting}
        >
          {isEdit ? 'Lưu thay đổi' : 'Tạo lớp học'}
        </Button>
      </div>
    </form>
  );
}

export function ClassFormModal({
  isOpen,
  onClose,
  onSubmit,
  classToEdit,
  isLoading = false,
}: ClassFormModalProps) {
  const isEdit = Boolean(classToEdit);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}
      description={
        isEdit
          ? 'Cập nhật thông tin chi tiết của lớp học'
          : 'Tạo lớp học mới và hệ thống sẽ tự động tạo mã tham gia độc nhất'
      }
      maxWidth="lg"
    >
      <ClassFormInner
        key={classToEdit?.id || 'new-class'}
        onClose={onClose}
        onSubmit={onSubmit}
        classToEdit={classToEdit}
        isLoading={isLoading}
      />
    </Modal>
  );
}
