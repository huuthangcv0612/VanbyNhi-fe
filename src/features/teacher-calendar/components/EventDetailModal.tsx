import { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Bell,
  FileText,
  Users,
  Edit2,
  Trash2,
  ExternalLink,
  AlertTriangle,
  X,
  UserCheck,
} from 'lucide-react';
import type { CalendarEvent } from '../types/teacher-calendar.types';
import {
  useDeleteEvent,
  useTeacherEventDetail,
} from '../hooks/useTeacherEvents';
import {
  useEventParticipants,
  useRemoveParticipant,
} from '../hooks/useEventParticipants';
import {
  formatFullDateVN,
  formatTimeVN,
} from '../utils/date-utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
}

export function EventDetailModal({
  isOpen,
  onClose,
  event: initialEvent,
  onEdit,
}: EventDetailModalProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Fetch fresh event details and participants
  const eventId = initialEvent?.id;
  const { data: freshEvent } = useTeacherEventDetail(eventId);
  const { data: participantsList } = useEventParticipants(eventId);

  const event = freshEvent || initialEvent;

  const deleteMutation = useDeleteEvent();
  const removeParticipantMutation = useRemoveParticipant(eventId || '');

  if (!event) return null;

  const startTimeStr = formatTimeVN(event.startAt);
  const endTimeStr = formatTimeVN(event.endAt);
  const fullDateStr = formatFullDateVN(event.startAt);

  const meetUrl = event.meetUrl || event.googleMeetUrl;
  const address = event.address || event.location;
  const reminderMinutes = event.reminderMinutes ?? event.remindBeforeMinutes ?? null;
  const notes = event.note || event.notes || event.description;

  // Hợp nhất danh sách học sinh từ participants hoặc event.participants
  const participants = participantsList || event.participants || [];

  const handleDelete = async () => {
    if (!eventId) return;
    try {
      await deleteMutation.mutateAsync(eventId);
      setIsConfirmingDelete(false);
      onClose();
    } catch {
      // Mutation handles error toast
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!eventId) return;
    await removeParticipantMutation.mutateAsync(studentId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsConfirmingDelete(false);
        onClose();
      }}
      title="Chi tiết Ca giảng dạy"
      description="Thông tin chi tiết buổi dạy, phòng trực tuyến và học sinh tham gia."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {/* Delete Action with inline confirm */}
          <div>
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-xl border border-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs text-rose-800 font-medium">
                  Xác nhận xóa ca dạy này?
                </span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={deleteMutation.isPending}
                  onClick={handleDelete}
                  className="py-1 px-2.5 text-xs"
                >
                  Xóa
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="py-1 px-2 text-xs"
                >
                  Hủy
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Xóa ca dạy
              </Button>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose();
                onEdit(event);
              }}
            >
              Chỉnh sửa
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Title and Label Banner */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {event.title}
            </h3>
            {event.label ? (
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: event.label.color }}
                />
                <span
                  className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
                  style={{
                    backgroundColor: `${event.label.color}15`,
                    color: event.label.color,
                  }}
                >
                  {event.label.name}
                </span>
              </div>
            ) : (
              <span className="inline-block mt-1 text-xs text-slate-400">
                (Không có nhãn màu)
              </span>
            )}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Ngày học</p>
              <p className="font-semibold text-slate-800">{fullDateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Thời gian</p>
              <p className="font-semibold text-slate-800">
                {startTimeStr} – {endTimeStr}
              </p>
            </div>
          </div>
        </div>

        {/* Google Meet Link */}
        {meetUrl && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 border border-sky-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <Video className="w-5 h-5 text-sky-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-sky-900">Google Meet</p>
                <p className="text-xs text-sky-700 truncate">{meetUrl}</p>
              </div>
            </div>
            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
            >
              <span>Vào lớp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Location / Address */}
        {address && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Địa chỉ học</p>
              <p className="text-xs text-slate-800 font-semibold">{address}</p>
            </div>
          </div>
        )}

        {/* Reminder */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
          <Bell className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {reminderMinutes !== null && reminderMinutes !== undefined && reminderMinutes > 0
              ? `Nhắc trước ca dạy: ${reminderMinutes} phút`
              : 'Không cài đặt thông báo nhắc trước'}
          </span>
        </div>

        {/* Participants / Students */}
        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-800">
                Học sinh tham gia ({participants.length})
              </span>
            </div>
          </div>

          {participants.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              Chưa có học sinh nào được thêm vào ca dạy này.
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {participants.map((p) => {
                const sName = p.student?.fullName || `Học sinh #${p.studentId.slice(0, 6)}`;
                const sContact = p.student?.email || p.student?.phone || '';
                return (
                  <div
                    key={p.studentId}
                    className="flex items-center justify-between pt-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 truncate block">
                          {sName}
                        </span>
                        {sContact && (
                          <span className="text-[11px] text-slate-400 truncate block">
                            {sContact}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveStudent(p.studentId)}
                      disabled={removeParticipantMutation.isPending}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                      title="Loại học sinh khỏi ca dạy"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Ghi chú bài giảng:</span>
            </div>
            <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
              {notes}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
