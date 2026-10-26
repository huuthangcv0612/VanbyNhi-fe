import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Share2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import { teacherDocumentsService } from '../services/documents.service';
import type { DocumentItem } from '../types/document.types';

export interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onSuccess: (message: string) => void;
}

export function ShareDocumentModal({
  isOpen,
  onClose,
  document,
  onSuccess,
}: ShareDocumentModalProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [accessStartTime, setAccessStartTime] = useState('');
  const [accessEndTime, setAccessEndTime] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch teacher's active classes
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['teacher-my-classes'],
    queryFn: () => teacherClassesService.getMyClasses({ limit: 50 }),
    enabled: isOpen,
  });

  // Fetch sessions of selected class if user wants to share to specific session
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['teacher-class-sessions', selectedClassId],
    queryFn: () =>
      teacherClassesService.getClassSessions(selectedClassId, { limit: 50 }),
    enabled: Boolean(selectedClassId),
  });

  const classes = classesData?.items || [];
  const sessions = sessionsData?.items || [];

  useEffect(() => {
    if (document && isOpen) {
      setCustomTitle(document.title);
      setCustomDescription(document.description || '');
      setSelectedClassId(classes.length > 0 ? classes[0].id : '');
      setSelectedSessionId('');
      setIsPublished(true);
      setAccessStartTime('');
      setAccessEndTime('');
      setErrorMsg(null);
    }
  }, [document, isOpen, classes.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    if (!selectedClassId) {
      setErrorMsg('Vui lòng chọn lớp học để chia sẻ tài liệu');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        documentId: document.id,
        title: customTitle.trim() || undefined,
        description: customDescription.trim() || undefined,
        isPublished,
        accessStartTime: accessStartTime
          ? new Date(accessStartTime).toISOString()
          : undefined,
        accessEndTime: accessEndTime
          ? new Date(accessEndTime).toISOString()
          : undefined,
      };

      if (selectedSessionId) {
        // Share to session
        const res = await teacherDocumentsService.shareDocumentToSession(
          selectedSessionId,
          payload,
        );
        onSuccess(res.message || 'Chia sẻ tài liệu vào buổi học thành công');
      } else {
        // Share to class
        const res = await teacherDocumentsService.shareDocumentToClass(
          selectedClassId,
          payload,
        );
        onSuccess(res.message || 'Chia sẻ tài liệu vào lớp học thành công');
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Không thể chia sẻ tài liệu. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chia sẻ tài liệu vào lớp học"
      description={`Tài liệu "${document.title}" sẽ được cấp quyền truy cập cho học sinh trong lớp.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Chọn lớp học tiếp nhận *
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSessionId('');
            }}
            disabled={isLoadingClasses || isSubmitting}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            required
          >
            <option value="">-- Chọn lớp học --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {selectedClassId && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phạm vi chia sẻ
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={isLoadingSessions || isSubmitting}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">Toàn bộ lớp học (Tài liệu chung của lớp)</option>
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  Buổi học: {sess.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Tiêu đề hiển thị cho học sinh"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder={document.title}
          disabled={isSubmitting}
        />

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Ghi chú / Hướng dẫn học sinh (tùy chọn)
          </label>
          <textarea
            rows={2}
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            disabled={isSubmitting}
            placeholder="Yêu cầu học sinh đọc trước hoặc làm bài tập..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isPublishedCheck"
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            disabled={isSubmitting}
            className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
          <label
            htmlFor="isPublishedCheck"
            className="text-xs text-slate-700 cursor-pointer select-none"
          >
            Xuất bản ngay (Học sinh có thể xem ngay sau khi chia sẻ)
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Thời gian mở truy cập (tùy chọn)
            </label>
            <input
              type="datetime-local"
              value={accessStartTime}
              onChange={(e) => setAccessStartTime(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Thời gian đóng truy cập (tùy chọn)
            </label>
            <input
              type="datetime-local"
              value={accessEndTime}
              onChange={(e) => setAccessEndTime(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
          >
            Xác nhận chia sẻ
          </Button>
        </div>
      </form>
    </Modal>
  );
}
