import { useState } from 'react';
import { Video, ExternalLink, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';
import { teacherClassesService } from '@/features/classes/services/classes.service';

interface TeacherMeetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  currentMeetUrl?: string | null;
  onSuccess?: () => void;
}

const MEET_URL_REGEX = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i;

interface TeacherMeetFormProps {
  sessionId: string;
  initialMeetUrl: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function TeacherMeetForm({
  sessionId,
  initialMeetUrl,
  onClose,
  onSuccess,
}: TeacherMeetFormProps) {
  const { showToast } = useToast();
  const [meetUrl, setMeetUrl] = useState(initialMeetUrl);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!meetUrl) return;
    try {
      await navigator.clipboard.writeText(meetUrl);
      setIsCopied(true);
      showToast({
        type: 'success',
        title: 'Đã sao chép liên kết Google Meet',
        message: 'Đường dẫn phòng học đã được lưu vào clipboard.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast({
        type: 'error',
        title: 'Không thể sao chép liên kết',
        message: 'Trình duyệt không cho phép truy cập clipboard.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = meetUrl.trim();

    if (!trimmed) {
      setError('Vui lòng nhập đường dẫn Google Meet');
      return;
    }

    if (!MEET_URL_REGEX.test(trimmed)) {
      setError('URL phải có định dạng https://meet.google.com/xxx-yyyy-zzz');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await teacherClassesService.updateTeacherMeetUrl(sessionId, trimmed);
      showToast({
        type: 'success',
        title: 'Cập nhật liên kết Google Meet thành công',
        message: 'Học sinh và giáo viên đã có thể tham gia qua link mới.',
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="teacher-meet-url-input"
          className="block text-xs font-semibold text-slate-700"
        >
          Đường dẫn Google Meet <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Input
            id="teacher-meet-url-input"
            value={meetUrl}
            onChange={(e) => {
              setMeetUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://meet.google.com/abc-defg-hij"
            leftIcon={<Video className="w-4 h-4 text-emerald-600" />}
            className="pr-10"
            autoFocus
          />
          {meetUrl && (
            <button
              type="button"
              onClick={handleCopy}
              title="Sao chép"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : (
          <p className="text-[11px] text-slate-500">
            Định dạng yêu cầu: <code className="text-emerald-700 font-mono">https://meet.google.com/xxx-yyyy-zzz</code>
          </p>
        )}
      </div>

      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold">
          <LinkIcon className="w-3.5 h-3.5 text-emerald-700" />
          <span>Quy tắc phòng học trực tuyến:</span>
        </div>
        <p className="text-[11px] text-emerald-800 leading-relaxed">
          Hệ thống không nhúng iframe. Khi bấm tham gia, Google Meet sẽ mở trong tab mới để tối ưu chất lượng âm thanh, hình ảnh và micro.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          leftIcon={<ExternalLink className="w-4 h-4" />}
        >
          Lưu liên kết Meet
        </Button>
      </div>
    </form>
  );
}

export function TeacherMeetModal({
  isOpen,
  onClose,
  sessionId,
  currentMeetUrl,
  onSuccess,
}: TeacherMeetModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu hình phòng học Google Meet"
      description="Cung cấp đường dẫn Google Meet chính thức để giáo viên và học sinh kết nối vào buổi học."
      maxWidth="md"
    >
      <TeacherMeetForm
        sessionId={sessionId}
        initialMeetUrl={currentMeetUrl || ''}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}
