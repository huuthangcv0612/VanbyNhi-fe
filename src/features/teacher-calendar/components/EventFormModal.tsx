import { useState, useMemo, type FormEvent } from 'react';
import {
  Video,
  MapPin,
  AlertTriangle,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type {
  CalendarEvent,
  CalendarLabel,
  CreateEventPayload,
  StudentOption,
  UpdateEventPayload,
} from '../types/teacher-calendar.types';
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '../hooks/useTeacherEvents';
import { teacherCalendarService } from '../services/teacher-calendar.service';
import {
  formatDateKey,
  parseIsoToVnParts,
  toVietnamIsoString,
} from '../utils/date-utils';
import { StudentSelector } from './StudentSelector';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  initialDate?: Date;
  initialHour?: number;
  labels: CalendarLabel[];
}

interface EventFormInnerProps {
  eventToEdit?: CalendarEvent | null;
  initialDate?: Date;
  initialHour: number;
  labels: CalendarLabel[];
  onClose: () => void;
}

function EventFormInner({
  eventToEdit,
  initialDate,
  initialHour,
  labels,
  onClose,
}: EventFormInnerProps) {
  const isEditMode = Boolean(eventToEdit);

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  // Khởi tạo state trực tiếp từ props
  const [title, setTitle] = useState(() => eventToEdit?.title || '');

  const [date, setDate] = useState(() => {
    if (eventToEdit?.startAt) {
      return parseIsoToVnParts(eventToEdit.startAt).date;
    }
    return formatDateKey(initialDate || new Date());
  });

  const [startTime, setStartTime] = useState(() => {
    if (eventToEdit?.startAt) {
      return parseIsoToVnParts(eventToEdit.startAt).time;
    }
    return `${initialHour.toString().padStart(2, '0')}:00`;
  });

  const [endTime, setEndTime] = useState(() => {
    if (eventToEdit?.endAt) {
      return parseIsoToVnParts(eventToEdit.endAt).time;
    }
    return `${(initialHour + 2).toString().padStart(2, '0')}:00`;
  });

  const [address, setAddress] = useState(
    () => eventToEdit?.address || eventToEdit?.location || '',
  );
  const [meetUrl, setMeetUrl] = useState(
    () => eventToEdit?.meetUrl || eventToEdit?.googleMeetUrl || '',
  );
  const [labelId, setLabelId] = useState(
    () => eventToEdit?.labelId || eventToEdit?.label?.id || '',
  );
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(
    () => (eventToEdit ? (eventToEdit.reminderMinutes ?? null) : 30),
  );
  const [notes, setNotes] = useState(
    () => eventToEdit?.note || eventToEdit?.notes || eventToEdit?.description || '',
  );
  const [studentIds, setStudentIds] = useState<string[]>(() => {
    return eventToEdit?.participants?.map((p) => p.studentId) || [];
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cảnh báo trùng lịch từ backend
  const [conflictWarning, setConflictWarning] = useState<{
    message: string;
    conflicts: Array<{ id: string; title: string; startAt: string; endAt: string }>;
  } | null>(null);

  // Danh sách học sinh đã biết
  const knownStudents: StudentOption[] = useMemo(() => {
    return (eventToEdit?.participants || [])
      .filter((p) => p.student)
      .map((p) => ({
        id: p.studentId,
        fullName: p.student!.fullName,
        email: p.student!.email || null,
        phone: p.student!.phone || '',
        avatarUrl: p.student!.avatarUrl,
      }));
  }, [eventToEdit]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề ca dạy.';
    }

    if (!date) {
      newErrors.date = 'Vui lòng chọn ngày học.';
    }

    if (!startTime) {
      newErrors.startTime = 'Vui lòng nhập giờ bắt đầu.';
    }

    if (!endTime) {
      newErrors.endTime = 'Vui lòng nhập giờ kết thúc.';
    } else if (startTime && endTime <= startTime) {
      newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.';
    }

    if (meetUrl && meetUrl.trim()) {
      try {
        const parsed = new URL(meetUrl.trim());
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          newErrors.meetUrl = 'Đường dẫn phải bắt đầu bằng http:// hoặc https://';
        }
      } catch {
        newErrors.meetUrl = 'Đường dẫn Google Meet không hợp lệ.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const startAt = toVietnamIsoString(date, startTime);
    const endAt = toVietnamIsoString(date, endTime);

    try {
      if (isEditMode && eventToEdit) {
        const payload: UpdateEventPayload = {
          title: title.trim(),
          startAt,
          endAt,
          address: address.trim() || undefined,
          meetUrl: meetUrl.trim() || undefined,
          labelId: labelId || null,
          reminderMinutes: reminderMinutes === null ? null : Number(reminderMinutes),
          note: notes.trim() || null,
        };

        const res = await updateMutation.mutateAsync({
          id: eventToEdit.id,
          payload,
        });

        // Đồng bộ học sinh nếu có thay đổi trong lúc chỉnh sửa qua participants API
        const currentStudentIds = (eventToEdit.participants || []).map((p) => p.studentId);
        const addedStudentIds = studentIds.filter((id) => !currentStudentIds.includes(id));
        const removedStudentIds = currentStudentIds.filter((id) => !studentIds.includes(id));

        for (const sId of addedStudentIds) {
          try {
            await teacherCalendarService.addParticipant(eventToEdit.id, sId);
          } catch {
            // Lỗi đã được xử lý
          }
        }
        for (const sId of removedStudentIds) {
          try {
            await teacherCalendarService.removeParticipant(eventToEdit.id, sId);
          } catch {
            // Lỗi đã được xử lý
          }
        }

        if (res.hasConflict && res.conflicts && res.conflicts.length > 0) {
          setConflictWarning({
            message: 'Đã lưu ca dạy, nhưng có ca khác bị trùng thời gian:',
            conflicts: res.conflicts,
          });
        } else {
          onClose();
        }
      } else {
        const payload: CreateEventPayload = {
          title: title.trim(),
          startAt,
          endAt,
          address: address.trim() || undefined,
          meetUrl: meetUrl.trim() || undefined,
          labelId: labelId || undefined,
          reminderMinutes: reminderMinutes === null ? undefined : Number(reminderMinutes),
          note: notes.trim() || undefined,
          studentIds: studentIds.length > 0 ? studentIds : undefined,
        };

        const res = await createMutation.mutateAsync(payload);

        if (res.hasConflict && res.conflicts && res.conflicts.length > 0) {
          setConflictWarning({
            message: 'Đã tạo ca dạy, nhưng có ca khác bị trùng thời gian:',
            conflicts: res.conflicts,
          });
        } else {
          onClose();
        }
      }
    } catch {
      // Error handled by mutation hook toasts
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
        {/* Conflict Warning Alert */}
        {conflictWarning && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{conflictWarning.message}</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-amber-700">
              {conflictWarning.conflicts.map((c) => (
                <li key={c.id}>
                  <span className="font-semibold">{c.title}</span> ({c.startAt} – {c.endAt})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Title */}
        <Input
          label="Tiêu đề ca dạy *"
          placeholder="VD: Phân tích bài thơ Tây Tiến - Lớp 12A1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        {/* Date and Time row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ngày học *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.date ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
              required
            />
            {errors.date && <p className="mt-1 text-xs text-rose-600">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Giờ bắt đầu *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.startTime ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
              required
            />
            {errors.startTime && (
              <p className="mt-1 text-xs text-rose-600">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Giờ kết thúc *
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.endTime ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
              required
            />
            {errors.endTime && (
              <p className="mt-1 text-xs text-rose-600">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* Label & Reminder Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nhãn màu cá nhân
            </label>
            <select
              value={labelId}
              onChange={(e) => setLabelId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Không gán nhãn</option>
              {labels.map((lbl) => (
                <option key={lbl.id} value={lbl.id}>
                  {lbl.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Thông báo nhắc trước
            </label>
            <select
              value={reminderMinutes === null ? '' : reminderMinutes}
              onChange={(e) => {
                const val = e.target.value;
                setReminderMinutes(val === '' ? null : Number(val));
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Không nhắc</option>
              <option value="10">Trước 10 phút</option>
              <option value="15">Trước 15 phút</option>
              <option value="30">Trước 30 phút</option>
              <option value="60">Trước 1 giờ</option>
              <option value="120">Trước 2 giờ</option>
              <option value="1440">Trước 1 ngày</option>
            </select>
          </div>
        </div>

        {/* Google Meet URL */}
        <Input
          label="Link phòng Google Meet"
          placeholder="https://meet.google.com/abc-defg-hij"
          value={meetUrl}
          onChange={(e) => setMeetUrl(e.target.value)}
          error={errors.meetUrl}
          leftIcon={<Video className="w-4 h-4" />}
        />

        {/* Address / Location */}
        <Input
          label="Địa chỉ phòng học / cơ sở"
          placeholder="VD: Phòng 204, Cơ sở Nguyễn Trãi, Q.5"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          leftIcon={<MapPin className="w-4 h-4" />}
        />

        {/* Student Selector */}
        <StudentSelector
          selectedStudentIds={studentIds}
          onChange={setStudentIds}
          knownStudents={knownStudents}
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ghi chú giáo án / nội dung chuẩn bị
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Yêu cầu học sinh đọc trước tài liệu..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Form Action Buttons Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          {isEditMode && eventToEdit && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={async () => {
                if (window.confirm('Bạn có chắc chắn muốn xóa ca giảng dạy này không?')) {
                  await deleteMutation.mutateAsync(eventToEdit.id);
                  onClose();
                }
              }}
            >
              Xóa ca
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={
              isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />
            }
          >
            {isEditMode ? 'Lưu thay đổi' : 'Tạo ca dạy'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function EventFormModal({
  isOpen,
  onClose,
  eventToEdit,
  initialDate,
  initialHour = 8,
  labels,
}: EventFormModalProps) {
  const isEditMode = Boolean(eventToEdit);
  const key = isOpen ? eventToEdit?.id || (initialDate ? formatDateKey(initialDate) : 'new') : 'closed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Chỉnh sửa Ca giảng dạy' : 'Tạo mới Ca giảng dạy'}
      description="Lên lịch buổi học văn, đính kèm phòng Google Meet và học sinh tham gia."
      maxWidth="xl"
    >
      {isOpen && (
        <EventFormInner
          key={key}
          eventToEdit={eventToEdit}
          initialDate={initialDate}
          initialHour={initialHour}
          labels={labels}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
