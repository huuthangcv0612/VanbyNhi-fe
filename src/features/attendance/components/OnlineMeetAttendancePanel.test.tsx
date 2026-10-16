/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnlineMeetAttendancePanel } from './OnlineMeetAttendancePanel';
import { attendanceService } from '../services/attendance.service';

vi.mock('../services/attendance.service', () => ({
  attendanceService: {
    getSessionAttendance: vi.fn(),
    getSessionSummary: vi.fn(),
    batchSaveAttendance: vi.fn(),
    saveDraftAttendance: vi.fn(),
    markAllPresent: vi.fn(),
    closeAttendanceSession: vi.fn(),
  },
}));

import { ToastProvider } from '@/components/ui/toast';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const mockSessionData = {
  session: {
    id: 'sess-1',
    title: 'Phân tích Chí Phèo',
    startTime: '2026-10-16T19:00:00Z',
    endTime: '2026-10-16T21:00:00Z',
    attendanceSession: {
      status: 'OPEN' as const,
      openedAt: '2026-10-16T18:45:00Z',
    },
  },
  students: [
    {
      student: { id: 'u1', fullName: 'Nguyễn Văn An', phone: '0901234567' },
      attendance: { id: 'att-1', status: 'NOT_MARKED' as const, note: '' },
    },
    {
      student: { id: 'u2', fullName: 'Trần Thị Bình', phone: '0912345678' },
      attendance: { id: 'att-2', status: 'PRESENT' as const, note: 'Đúng giờ' },
    },
  ],
};

const mockSummaryData = {
  totalStudents: 2,
  markedCount: 1,
  presentCount: 1,
  lateCount: 0,
  excusedAbsentCount: 0,
  unexcusedAbsentCount: 0,
};

describe('OnlineMeetAttendancePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(attendanceService.getSessionAttendance).mockReturnValue(new Promise(() => {}));
    vi.mocked(attendanceService.getSessionSummary).mockReturnValue(new Promise(() => {}));

    renderWithClient(<OnlineMeetAttendancePanel sessionId="sess-1" />);
    // Check skeleton elements are present
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error state and handles retry', async () => {
    vi.mocked(attendanceService.getSessionAttendance).mockRejectedValueOnce(new Error('Lỗi máy chủ'));
    vi.mocked(attendanceService.getSessionSummary).mockRejectedValueOnce(new Error('Lỗi máy chủ'));

    renderWithClient(<OnlineMeetAttendancePanel sessionId="sess-1" />);

    await waitFor(() => {
      expect(screen.getByText('Không thể tải dữ liệu điểm danh')).toBeInTheDocument();
    });

    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValueOnce(mockSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValueOnce(mockSummaryData as any);

    const retryBtn = screen.getByText('Thử lại');
    await userEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Bảng điểm danh buổi học')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });
  });

  it('renders student list, quick stats and badges correctly', async () => {
    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValueOnce(mockSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValueOnce(mockSummaryData as any);

    renderWithClient(<OnlineMeetAttendancePanel sessionId="sess-1" />);

    await waitFor(() => {
      expect(screen.getByText('Bảng điểm danh buổi học')).toBeInTheDocument();
    });

    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
    expect(screen.getByText('0901234567')).toBeInTheDocument();
    expect(screen.getByText('0912345678')).toBeInTheDocument();

    // Stats: Sĩ số
    expect(screen.getByText('Sĩ số')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('filters students by search input', async () => {
    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValueOnce(mockSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValueOnce(mockSummaryData as any);

    renderWithClient(<OnlineMeetAttendancePanel sessionId="sess-1" />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Tìm theo tên hoặc số điện thoại...');
    await userEvent.type(searchInput, 'Bình');

    expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
  });

  it('marks all present when clicking "Tất cả có mặt"', async () => {
    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValueOnce(mockSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValueOnce(mockSummaryData as any);

    renderWithClient(<OnlineMeetAttendancePanel sessionId="sess-1" />);

    await waitFor(() => {
      expect(screen.getByText('Tất cả có mặt')).toBeInTheDocument();
    });

    const markAllBtn = screen.getByText('Tất cả có mặt');
    await userEvent.click(markAllBtn);

    // Should show dirty alert
    expect(screen.getByText('Có thay đổi chưa lưu')).toBeInTheDocument();
  });

  it('submits batch save attendance when clicking "Lưu điểm danh"', async () => {
    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValueOnce(mockSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValueOnce(mockSummaryData as any);
    vi.mocked(attendanceService.batchSaveAttendance).mockResolvedValueOnce({
      message: 'Lưu điểm danh thành công',
      count: 2,
      saved: [],
    });

    renderWithClient(<OnlineMeetAttendancePanel sessionId="sess-1" />);

    await waitFor(() => {
      expect(screen.getByText('Lưu điểm danh')).toBeInTheDocument();
    });

    const saveBtn = screen.getByText('Lưu điểm danh');
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(attendanceService.batchSaveAttendance).toHaveBeenCalledWith('sess-1', {
        records: expect.arrayContaining([
          expect.objectContaining({ studentId: 'u1' }),
          expect.objectContaining({ studentId: 'u2' }),
        ]),
      });
    });
  });

  it('submits save draft when clicking "Lưu nháp"', async () => {
    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValueOnce(mockSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValueOnce(mockSummaryData as any);
    vi.mocked(attendanceService.saveDraftAttendance).mockResolvedValueOnce({
      message: 'Lưu bản nháp thành công',
      count: 2,
    });

    renderWithClient(<OnlineMeetAttendancePanel sessionId="sess-1" />);

    await waitFor(() => {
      expect(screen.getByText('Lưu nháp')).toBeInTheDocument();
    });

    const draftBtn = screen.getByText('Lưu nháp');
    await userEvent.click(draftBtn);

    await waitFor(() => {
      expect(attendanceService.saveDraftAttendance).toHaveBeenCalledWith('sess-1', {
        records: expect.any(Array),
      });
    });
  });

  it('opens confirmation modal and closes attendance session', async () => {
    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValueOnce(mockSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValueOnce(mockSummaryData as any);
    vi.mocked(attendanceService.closeAttendanceSession).mockResolvedValueOnce({
      message: 'Chốt điểm danh thành công',
      attendanceSession: { status: 'CLOSED' },
    });

    renderWithClient(<OnlineMeetAttendancePanel sessionId="sess-1" />);

    await waitFor(() => {
      expect(screen.getByText('Chốt điểm danh')).toBeInTheDocument();
    });

    const closeBtn = screen.getByText('Chốt điểm danh');
    await userEvent.click(closeBtn);

    expect(screen.getByText('Chốt điểm danh buổi học?')).toBeInTheDocument();
    expect(screen.getByText(/Lưu ý quan trọng khi chốt điểm danh/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận chốt/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(attendanceService.closeAttendanceSession).toHaveBeenCalledWith('sess-1', {
        note: undefined,
      });
    });
  });

  it('disables controls and displays closed warning when session is CLOSED', async () => {
    const closedSessionData = {
      ...mockSessionData,
      session: {
        ...mockSessionData.session,
        attendanceSession: {
          status: 'CLOSED' as const,
          closedAt: '2026-10-16T21:15:00Z',
        },
      },
    };

    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValueOnce(closedSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValueOnce(mockSummaryData as any);

    renderWithClient(<OnlineMeetAttendancePanel sessionId="sess-1" />);

    await waitFor(() => {
      expect(screen.getByText('Phiên điểm danh đã được chốt (CLOSED)')).toBeInTheDocument();
    });

    expect(screen.queryByText('Tất cả có mặt')).not.toBeInTheDocument();
    expect(screen.queryByText('Lưu điểm danh')).not.toBeInTheDocument();
    expect(screen.getByText('Phiên điểm danh đã kết thúc & chốt')).toBeInTheDocument();

    // All status buttons are disabled
    const buttons = screen.getAllByRole('button');
    const presentButtons = buttons.filter((b) => b.textContent?.trim() === 'Có mặt');
    presentButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
