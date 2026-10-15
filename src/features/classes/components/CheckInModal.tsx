import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useStudentCheckIn } from '../hooks/useStudentCheckIn';
import { CheckCircle2, Clock } from 'lucide-react';

export interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
}

export function CheckInModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
}: CheckInModalProps) {
  const [note, setNote] = useState('');
  const checkInMutation = useStudentCheckIn();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    checkInMutation.mutate(
      {
        sessionId,
        dto: note.trim() ? { note: note.trim() } : undefined,
      },
      {
        onSuccess: () => {
          setNote('');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận điểm danh buổi học"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-violet-50/80 border border-violet-200/80 p-4 space-y-2">
          <div className="flex items-center gap-2 text-violet-900 font-medium text-sm">
            <Clock className="w-4 h-4 text-violet-700 shrink-0" />
            <span>Buổi học:</span>
            <span className="font-bold truncate">{sessionTitle}</span>
          </div>
          <p className="text-xs text-violet-700 leading-relaxed">
            Hệ thống sẽ tự động tính trạng thái <strong>Có mặt (PRESENT)</strong> hoặc <strong>Đi muộn (LATE)</strong> dựa trên mốc thời gian bắt đầu buổi học.
          </p>
        </div>

        <div>
          <label
            htmlFor="checkin-note"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Ghi chú (Tùy chọn)
          </label>
          <textarea
            id="checkin-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={255}
            rows={3}
            placeholder="Nhập ghi chú nếu có (ví dụ: xin phép vào trễ 5 phút, vào bằng thiết bị cá nhân...)"
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-colors"
          />
          <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
            <span>Tối đa 255 ký tự</span>
            <span>{note.length}/255</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={checkInMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={checkInMutation.isPending}
            disabled={checkInMutation.isPending}
            className="bg-violet-700 hover:bg-violet-800 text-white"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Xác nhận điểm danh
          </Button>
        </div>
      </form>
    </Modal>
  );
}
