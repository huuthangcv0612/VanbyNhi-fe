import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleCard } from './schedule-card';
import { ScheduleMonthView } from './schedule-month-view';
import { ScheduleWeekView } from './schedule-week-view';
import { ScheduleDayView } from './schedule-day-view';
import { ScheduleEmptyState } from './schedule-empty-state';
import { ScheduleDetailModal } from './schedule-detail-modal';
import type { StudentSchedule } from '../types/student-schedule.types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Student Schedule Components', () => {
  const baseSchedule: StudentSchedule = {
    id: 's-1',
    title: 'Ôn tập tác phẩm Vợ chồng A Phủ',
    description: 'Đọc kỹ phần trích đoạn đêm tình mùa xuân',
    startAt: '2026-11-10T08:00:00.000Z',
    endAt: '2026-11-10T10:00:00.000Z',
    timezone: 'Asia/Ho_Chi_Minh',
    meetingType: 'ONLINE_MEET',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    location: 'Phòng học Google Meet',
    status: 'SCHEDULED',
    teacher: {
      id: 't-1',
      fullName: 'Cô Nguyễn Thị Nhi',
      email: 'teacher@vanbynhi.vn',
      phone: '0987654321',
      avatarUrl: null,
    },
    class: {
      id: 'c-1',
      name: 'Chuyên đề Văn 12',
      classCode: 'VAN12',
    },
  };

  describe('ScheduleCard', () => {
    it('renders schedule title, time, teacher, and class', () => {
      render(<ScheduleCard schedule={baseSchedule} />);

      expect(screen.getByText('Ôn tập tác phẩm Vợ chồng A Phủ')).toBeInTheDocument();
      expect(screen.getByText('Cô Nguyễn Thị Nhi')).toBeInTheDocument();
      expect(screen.getByText('Chuyên đề Văn 12')).toBeInTheDocument();
      expect(screen.getByText('Google Meet')).toBeInTheDocument();
    });

    it('renders schedule without class gracefully', () => {
      const scheduleWithoutClass: StudentSchedule = {
        ...baseSchedule,
        class: null,
      };

      render(<ScheduleCard schedule={scheduleWithoutClass} />);
      expect(screen.getByText('Lịch kèm riêng / Chỉ định')).toBeInTheDocument();
    });

    it('renders distinct styling for CANCELLED status', () => {
      const cancelledSchedule: StudentSchedule = {
        ...baseSchedule,
        status: 'CANCELLED',
      };

      render(<ScheduleCard schedule={cancelledSchedule} />);
      expect(screen.getByText('Đã hủy')).toBeInTheDocument();
    });

    it('displays Google Meet join button with target="_blank" when showJoinButton is true', () => {
      // Đặt thời gian trong tương lai
      const futureSchedule: StudentSchedule = {
        ...baseSchedule,
        startAt: '2030-01-01T08:00:00.000Z',
        endAt: '2030-01-01T10:00:00.000Z',
      };

      render(<ScheduleCard schedule={futureSchedule} showJoinButton />);
      const link = screen.getByRole('link', { name: /Tham gia Google Meet/i });
      expect(link).toHaveAttribute('href', 'https://meet.google.com/abc-defg-hij');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does NOT display join button when meetingUrl is missing', () => {
      const scheduleNoUrl: StudentSchedule = {
        ...baseSchedule,
        meetingUrl: null,
      };

      render(<ScheduleCard schedule={scheduleNoUrl} showJoinButton />);
      expect(screen.queryByRole('link', { name: /Tham gia Google Meet/i })).not.toBeInTheDocument();
    });

    it('does NOT display join button for CANCELLED or COMPLETED schedules', () => {
      const cancelled: StudentSchedule = {
        ...baseSchedule,
        status: 'CANCELLED',
      };
      const completed: StudentSchedule = {
        ...baseSchedule,
        status: 'COMPLETED',
      };

      const { rerender } = render(<ScheduleCard schedule={cancelled} showJoinButton />);
      expect(screen.queryByRole('link', { name: /Tham gia Google Meet/i })).not.toBeInTheDocument();

      rerender(<ScheduleCard schedule={completed} showJoinButton />);
      expect(screen.queryByRole('link', { name: /Tham gia Google Meet/i })).not.toBeInTheDocument();
    });

    it('fires onClick callback when card is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ScheduleCard schedule={baseSchedule} onClick={handleClick} />);
      await user.click(screen.getByText('Ôn tập tác phẩm Vợ chồng A Phủ'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('ScheduleMonthView', () => {
    it('renders 7 columns from Monday to Sunday', () => {
      render(
        <ScheduleMonthView
          currentDate={new Date(2026, 9, 14)}
          schedules={[baseSchedule]}
          onSelectSchedule={vi.fn()}
        />,
      );

      expect(screen.getByText('Thứ Hai')).toBeInTheDocument();
      expect(screen.getByText('Chủ Nhật')).toBeInTheDocument();
    });
  });

  describe('ScheduleWeekView', () => {
    it('renders week days and hour time axis', () => {
      render(
        <ScheduleWeekView
          currentDate={new Date(2026, 9, 14)}
          schedules={[baseSchedule]}
          onSelectSchedule={vi.fn()}
        />,
      );

      expect(screen.getByText('Giờ')).toBeInTheDocument();
      expect(screen.getByText('06:00')).toBeInTheDocument();
      expect(screen.getByText('08:00')).toBeInTheDocument();
    });
  });

  describe('ScheduleDayView', () => {
    it('renders day title and empty state when no schedules on that day', () => {
      render(
        <ScheduleDayView
          currentDate={new Date(2026, 9, 1)}
          schedules={[]}
          onSelectSchedule={vi.fn()}
        />,
      );

      expect(
        screen.getByText('Không có buổi học nào vào ngày này'),
      ).toBeInTheDocument();
    });
  });

  describe('ScheduleEmptyState', () => {
    it('renders custom title and action button', async () => {
      const user = userEvent.setup();
      const handleAction = vi.fn();

      render(
        <ScheduleEmptyState
          title="Không tìm thấy lịch"
          description="Thử đổi bộ lọc ngày"
          onGoToday={handleAction}
        />,
      );

      expect(screen.getByText('Không tìm thấy lịch')).toBeInTheDocument();
      expect(screen.getByText('Thử đổi bộ lọc ngày')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /Xem lịch hôm nay/i });
      await user.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ScheduleDetailModal', () => {
    it('renders full schedule details and join button', () => {
      const futureSchedule: StudentSchedule = {
        ...baseSchedule,
        startAt: '2030-01-01T08:00:00.000Z',
        endAt: '2030-01-01T10:00:00.000Z',
      };

      renderWithQueryClient(
        <ScheduleDetailModal
          isOpen={true}
          scheduleId="s-1"
          initialSchedule={futureSchedule}
          onClose={vi.fn()}
        />,
      );

      expect(screen.getByText('Chi tiết buổi học')).toBeInTheDocument();
      expect(screen.getByText('Ôn tập tác phẩm Vợ chồng A Phủ')).toBeInTheDocument();
      expect(screen.getByText('Đọc kỹ phần trích đoạn đêm tình mùa xuân')).toBeInTheDocument();
      expect(screen.getByText('Cô Nguyễn Thị Nhi')).toBeInTheDocument();
      expect(screen.getByText('Chuyên đề Văn 12')).toBeInTheDocument();

      const joinBtn = screen.getByRole('link', { name: /Tham gia Google Meet/i });
      expect(joinBtn).toHaveAttribute('href', 'https://meet.google.com/abc-defg-hij');
      expect(joinBtn).toHaveAttribute('target', '_blank');
    });

    it('does NOT render online join button for IN_PERSON meeting', () => {
      const inPersonSchedule: StudentSchedule = {
        ...baseSchedule,
        meetingType: 'IN_PERSON',
        location: 'Tầng 3, phòng 302, cơ sở 1',
        meetingUrl: null,
      };

      renderWithQueryClient(
        <ScheduleDetailModal
          isOpen={true}
          scheduleId="s-1"
          initialSchedule={inPersonSchedule}
          onClose={vi.fn()}
        />,
      );

      expect(screen.getByText('Tầng 3, phòng 302, cơ sở 1')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Tham gia Google Meet/i })).not.toBeInTheDocument();
    });
  });
});
