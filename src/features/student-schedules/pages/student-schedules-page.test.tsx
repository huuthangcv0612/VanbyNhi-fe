import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentSchedulesPage } from './student-schedules-page';
import { studentSchedulesApi } from '../api/student-schedules.api';
import type { StudentSchedule } from '../types/student-schedule.types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../api/student-schedules.api', () => ({
  studentSchedulesApi: {
    getAllSchedulesInRange: vi.fn(),
    getScheduleById: vi.fn(),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StudentSchedulesPage />
    </QueryClientProvider>,
  );
}

describe('StudentSchedulesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSchedules: StudentSchedule[] = [
    {
      id: 'sch-1',
      title: 'Luyện đề thi THPT Quốc gia',
      description: 'Chữa đề số 3 môn Ngữ Văn',
      startAt: '2026-10-13T08:00:00.000Z',
      endAt: '2026-10-13T10:00:00.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
      meetingType: 'ONLINE_MEET',
      meetingUrl: 'https://meet.google.com/abc',
      status: 'SCHEDULED',
      teacher: { id: 't-1', fullName: 'Cô Vân' },
      class: { id: 'c-1', name: 'Lớp Luyện Thi', classCode: 'LT12' },
    },
    {
      id: 'sch-2',
      title: 'Nghị luận tác phẩm Chiếc thuyền ngoài xa',
      startAt: '2026-10-14T08:00:00.000Z',
      endAt: '2026-10-14T10:00:00.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
      meetingType: 'ONLINE_WEB',
      status: 'COMPLETED',
      teacher: { id: 't-1', fullName: 'Cô Vân' },
      class: { id: 'c-1', name: 'Lớp Luyện Thi', classCode: 'LT12' },
    },
    {
      id: 'sch-3',
      title: 'Chuyên đề Rèn kỹ năng viết đoạn 200 chữ',
      startAt: '2026-10-15T08:00:00.000Z',
      endAt: '2026-10-15T10:00:00.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
      meetingType: 'IN_PERSON',
      status: 'CANCELLED',
      teacher: { id: 't-2', fullName: 'Thầy Hùng' },
      class: null,
    },
  ];

  it('loads and renders schedules successfully on the page', async () => {
    vi.mocked(studentSchedulesApi.getAllSchedulesInRange).mockResolvedValue(mockSchedules);

    renderPage();

    expect(screen.getByText('Lịch học của tôi')).toBeInTheDocument();
    expect(
      screen.getByText(/Theo dõi lịch học các lớp văn, ca học trực tiếp/i),
    ).toBeInTheDocument();

    const elements = await screen.findAllByText('Luyện đề thi THPT Quốc gia');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('switches between Month, Week, and Day view modes', async () => {
    const user = userEvent.setup();
    vi.mocked(studentSchedulesApi.getAllSchedulesInRange).mockResolvedValue(mockSchedules);

    renderPage();

    // Click Tuần
    const weekBtn = screen.getByRole('button', { name: 'Tuần' });
    await user.click(weekBtn);
    expect(screen.getByText('Giờ')).toBeInTheDocument();

    // Click Ngày
    const dayBtn = screen.getByRole('button', { name: 'Ngày' });
    await user.click(dayBtn);
    expect(screen.getByRole('button', { name: 'Ngày' })).toHaveClass('font-semibold');

    // Click Tháng
    const monthBtn = screen.getByRole('button', { name: 'Tháng' });
    await user.click(monthBtn);
    expect(screen.getByRole('button', { name: 'Tháng' })).toHaveClass('font-semibold');
  });

  it('filters by status: Đã hoàn thành and Đã hủy', async () => {
    const user = userEvent.setup();
    vi.mocked(studentSchedulesApi.getAllSchedulesInRange).mockResolvedValue(mockSchedules);

    renderPage();

    // Click "Đã hoàn thành"
    const completedBtn = screen.getByRole('button', { name: 'Đã hoàn thành' });
    await user.click(completedBtn);

    await waitFor(() => {
      expect(studentSchedulesApi.getAllSchedulesInRange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'COMPLETED' }),
      );
    });
  });

  it('filters by search keyword', async () => {
    const user = userEvent.setup();
    vi.mocked(studentSchedulesApi.getAllSchedulesInRange).mockResolvedValue(mockSchedules);

    renderPage();

    await screen.findAllByText('Luyện đề thi THPT Quốc gia');

    const searchInput = screen.getByPlaceholderText(/Tìm theo tên buổi, giáo viên.../i);
    await user.type(searchInput, 'Chiếc thuyền ngoài xa');

    const filtered = await screen.findAllByText('Nghị luận tác phẩm Chiếc thuyền ngoài xa');
    expect(filtered.length).toBeGreaterThan(0);
    expect(screen.queryByText('Luyện đề thi THPT Quốc gia')).not.toBeInTheDocument();
  });

  it('renders ErrorState with retry button when API fails', async () => {
    const user = userEvent.setup();
    vi.mocked(studentSchedulesApi.getAllSchedulesInRange).mockRejectedValueOnce(
      new Error('Máy chủ gặp sự cố'),
    );

    renderPage();

    const errorTitle = await screen.findByText('Không thể tải lịch học');
    expect(errorTitle).toBeInTheDocument();

    // Retry
    vi.mocked(studentSchedulesApi.getAllSchedulesInRange).mockResolvedValueOnce(mockSchedules);
    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    await user.click(retryBtn);

    const successItems = await screen.findAllByText('Luyện đề thi THPT Quốc gia');
    expect(successItems.length).toBeGreaterThan(0);
  });

  it('opens detail modal when clicking a schedule card', async () => {
    const user = userEvent.setup();
    vi.mocked(studentSchedulesApi.getAllSchedulesInRange).mockResolvedValue(mockSchedules);
    vi.mocked(studentSchedulesApi.getScheduleById).mockResolvedValue(mockSchedules[0]);

    renderPage();

    const cards = await screen.findAllByText('Luyện đề thi THPT Quốc gia');
    await user.click(cards[0]);

    expect(await screen.findByText('Chi tiết buổi học')).toBeInTheDocument();
  });
});
