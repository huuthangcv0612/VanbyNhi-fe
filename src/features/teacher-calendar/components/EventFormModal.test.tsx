import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventFormModal } from './EventFormModal';
import { teacherCalendarService } from '../services/teacher-calendar.service';
import type { CalendarEvent, CalendarLabel } from '../types/teacher-calendar.types';

vi.mock('../services/teacher-calendar.service', () => ({
  teacherCalendarService: {
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    addParticipant: vi.fn(),
    removeParticipant: vi.fn(),
    searchStudents: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/features/classes/services/classes.service', () => ({
  teacherClassesService: {
    getMyClasses: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

function renderModal(props: {
  isOpen?: boolean;
  onClose?: () => void;
  eventToEdit?: CalendarEvent | null;
  initialDate?: Date;
  initialHour?: number;
  labels?: CalendarLabel[];
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    eventToEdit: null,
    initialDate: new Date('2026-10-27T08:00:00+07:00'),
    initialHour: 15,
    labels: [],
    ...props,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <EventFormModal {...defaultProps} />
      </QueryClientProvider>,
    ),
    onClose: defaultProps.onClose,
  };
}

describe('EventFormModal - Recurrence feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders creation mode with default single session ("Chỉ thêm một buổi")', () => {
    renderModal({});

    expect(screen.getByText('Tạo mới Ca giảng dạy')).toBeInTheDocument();
    expect(screen.getByText('Chỉ thêm một buổi')).toBeInTheDocument();
    expect(screen.getByText('Lặp lại hàng tuần trong 1 tháng')).toBeInTheDocument();

    // In single session mode, preview container must not be visible
    expect(screen.queryByText(/Danh sách các buổi dự kiến/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tạo ca dạy/i })).toBeInTheDocument();
  });

  it('shows explanation and 5 scheduled occurrences preview when choosing weekly recurrence for 27/10/2026', async () => {
    const user = userEvent.setup();
    renderModal({
      initialDate: new Date('2026-10-27T08:00:00+07:00'),
      initialHour: 15, // default starts at 15:00 and ends at 17:00
    });

    // Change end time to 16:30 for exact 90-minute session in prompt example
    const endTimeInput = screen.getByLabelText(/Giờ kết thúc \*/i);
    await user.clear(endTimeInput);
    await user.type(endTimeInput, '16:30');

    // Click "Lặp lại hàng tuần trong 1 tháng"
    const repeatBtn = screen.getByRole('button', { name: /Lặp lại hàng tuần trong 1 tháng/i });
    await user.click(repeatBtn);

    // Explanation should be shown
    expect(
      screen.getByText(/Lịch sẽ được tạo hàng tuần vào cùng thứ, cùng khung giờ, trong một tháng/i),
    ).toBeInTheDocument();

    // Preview should show 5 sessions
    expect(screen.getByText('Tổng cộng: 5 buổi')).toBeInTheDocument();
    expect(screen.getByText('27/10/2026', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('03/11/2026', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('10/11/2026', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('17/11/2026', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('24/11/2026', { exact: false })).toBeInTheDocument();

    // Check submit button text shows the occurrences count
    expect(screen.getByRole('button', { name: /Tạo chuỗi ca dạy \(5 buổi\)/i })).toBeInTheDocument();
  });

  it('hides preview and sends single payload without recurrence when toggled back to single session', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({});

    // Enter title
    const titleInput = screen.getByLabelText(/Tiêu đề ca dạy \*/i);
    await user.type(titleInput, 'Chữa đề thi');

    // Toggle to recurrence
    await user.click(screen.getByRole('button', { name: /Lặp lại hàng tuần trong 1 tháng/i }));
    expect(screen.getByText(/Danh sách các buổi dự kiến/i)).toBeInTheDocument();

    // Toggle back to single session
    await user.click(screen.getByRole('button', { name: /Chỉ thêm một buổi/i }));
    expect(screen.queryByText(/Danh sách các buổi dự kiến/i)).not.toBeInTheDocument();

    // Mock createEvent response
    vi.mocked(teacherCalendarService.createEvent).mockResolvedValueOnce({
      id: 'ev-single',
      title: 'Chữa đề thi',
      startAt: '2026-10-27T15:00:00+07:00',
      endAt: '2026-10-27T17:00:00+07:00',
    });

    // Submit form
    await user.click(screen.getByRole('button', { name: /Tạo ca dạy/i }));

    await waitFor(() => {
      expect(teacherCalendarService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Chữa đề thi',
          recurrence: undefined,
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('submits recurring payload with recurrence = WEEKLY_FOR_MONTH', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({});

    const titleInput = screen.getByLabelText(/Tiêu đề ca dạy \*/i);
    await user.type(titleInput, 'Chuyên đề Rèn luyện kỹ năng viết');

    // Select weekly for month
    await user.click(screen.getByRole('button', { name: /Lặp lại hàng tuần trong 1 tháng/i }));

    const mockEvents = [
      { id: 'ev-1', title: 'Chuyên đề Rèn luyện kỹ năng viết', startAt: '2026-10-27T15:00:00+07:00', endAt: '2026-10-27T17:00:00+07:00' },
      { id: 'ev-2', title: 'Chuyên đề Rèn luyện kỹ năng viết', startAt: '2026-11-03T15:00:00+07:00', endAt: '2026-11-03T17:00:00+07:00' },
    ];

    vi.mocked(teacherCalendarService.createEvent).mockResolvedValueOnce({
      id: 'ev-1',
      title: 'Chuyên đề Rèn luyện kỹ năng viết',
      startAt: '2026-10-27T15:00:00+07:00',
      endAt: '2026-10-27T17:00:00+07:00',
      events: mockEvents,
      totalOccurrences: 5,
    });

    await user.click(screen.getByRole('button', { name: /Tạo chuỗi ca dạy/i }));

    await waitFor(() => {
      expect(teacherCalendarService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Chuyên đề Rèn luyện kỹ năng viết',
          recurrence: 'WEEKLY_FOR_MONTH',
        }),
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('5 ca giảng dạy (5 buổi)'),
        'Thành công',
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays conflict warning and does NOT close modal when backend detects conflicts', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({});

    const titleInput = screen.getByLabelText(/Tiêu đề ca dạy \*/i);
    await user.type(titleInput, 'Buổi học nhóm');

    await user.click(screen.getByRole('button', { name: /Lặp lại hàng tuần trong 1 tháng/i }));

    vi.mocked(teacherCalendarService.createEvent).mockResolvedValueOnce({
      id: 'ev-1',
      title: 'Buổi học nhóm',
      startAt: '2026-10-27T15:00:00+07:00',
      endAt: '2026-10-27T17:00:00+07:00',
      totalOccurrences: 5,
      hasConflict: true,
      conflicts: [
        {
          id: 'conf-1',
          title: 'Ca dạy cố định Lớp 11A',
          startAt: '2026-11-03T15:00:00+07:00',
          endAt: '2026-11-03T16:30:00+07:00',
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: /Tạo chuỗi ca dạy/i }));

    await waitFor(() => {
      expect(screen.getByText(/có 1 ca khác bị trùng thời gian:/i)).toBeInTheDocument();
      expect(screen.getByText('Ca dạy cố định Lớp 11A')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('keeps form data intact and displays error message when API fails', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({});

    const titleInput = screen.getByLabelText(/Tiêu đề ca dạy \*/i);
    await user.type(titleInput, 'Bài học bị lỗi kết nối');

    await user.click(screen.getByRole('button', { name: /Lặp lại hàng tuần trong 1 tháng/i }));

    vi.mocked(teacherCalendarService.createEvent).mockRejectedValueOnce(
      new Error('Lỗi máy chủ nội bộ'),
    );

    await user.click(screen.getByRole('button', { name: /Tạo chuỗi ca dạy/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
      // Title input still has the user-entered text
      expect(titleInput).toHaveValue('Bài học bị lỗi kết nối');
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('does NOT display recurrence option in Edit mode', () => {
    const sampleEvent: CalendarEvent = {
      id: 'ev-edit-1',
      title: 'Ca giảng dạy đang sửa',
      startAt: '2026-10-27T15:00:00+07:00',
      endAt: '2026-10-27T17:00:00+07:00',
    };

    renderModal({ eventToEdit: sampleEvent });

    expect(screen.getByText('Chỉnh sửa Ca giảng dạy')).toBeInTheDocument();
    // Recurrence buttons must NOT be present
    expect(screen.queryByText('Lặp lại hàng tuần trong 1 tháng')).not.toBeInTheDocument();
    expect(screen.queryByText('Chỉ thêm một buổi')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu thay đổi/i })).toBeInTheDocument();
  });
});
