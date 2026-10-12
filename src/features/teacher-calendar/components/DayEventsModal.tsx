import { Plus } from 'lucide-react';
import type { CalendarEvent } from '../types/teacher-calendar.types';
import { EventCard } from './EventCard';
import { formatFullDateVN } from '../utils/date-utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
}

export function DayEventsModal({
  isOpen,
  onClose,
  date,
  events,
  onSelectEvent,
  onCreateEventOnDate,
}: DayEventsModalProps) {
  if (!date) return null;

  const dateTitle = formatFullDateVN(date);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dateTitle}
      description={`Tổng cộng có ${events.length} ca giảng dạy trong ngày này.`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
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
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              onClose();
              onCreateEventOnDate(date);
            }}
          >
            Thêm ca dạy
          </Button>
        </div>
      }
    >
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            Chưa có ca giảng dạy nào trong ngày này.
          </p>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="cursor-pointer">
              <EventCard
                event={ev}
                variant="month"
                onClick={() => {
                  onClose();
                  onSelectEvent(ev);
                }}
              />
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
