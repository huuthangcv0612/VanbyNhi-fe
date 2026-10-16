/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { StudentAttendancePage } from './StudentAttendancePage';
import { attendanceService } from '../services/attendance.service';
import { studentClassesService } from '@/features/classes/services/classes.service';
import { ToastProvider } from '@/components/ui/toast';

vi.mock('@/features/classes/services/classes.service', () => ({
  studentClassesService: {
    getMyClasses: vi.fn(),
  },
}));

vi.mock('../services/attendance.service', () => ({
  attendanceService: {
    getMyAttendanceSummary: vi.fn(),
    getMyAttendanceHistory: vi.fn(),
    createCorrectionRequest: vi.fn(),
    getMyCorrectionRequests: vi.fn(),
  },
}));

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <StudentAttendancePage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const mockClasses = {
  items: [
    {
      class: {
        id: 'c1',
        name: 'Lớp 12 Chuyên Văn',
      },
      status: 'ACTIVE',
    },
  ],
};

const mockSummary = {
  totalSessions: 10,
  summary: {
    PRESENT: 8,
    LATE: 1,
    EXCUSED_ABSENT: 1,
    UNEXCUSED_ABSENT: 0,
    NOT_MARKED: 0,
    ABSENT: 0,
  },
};

const mockHistory = {
  items: [
    {
      id: 'att-1',
      session: {
        id: 's1',
        title: 'Buổi 1: Giới thiệu khóa học',
        startTime: '2026-10-14T19:00:00Z',
        class: { id: 'c1', name: 'Lớp 12 Chuyên Văn' },
      },
      status: 'UNEXCUSED_ABSENT' as const,
      note: 'Vắng không phép',
      checkedInAt: null,
      correctionRequests: [],
    },
  ],
  pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

const mockMyRequests = {
  items: [
    {
      id: 'req-1',
      attendance: {
        id: 'att-1',
        session: { id: 's1', title: 'Buổi 1: Giới thiệu khóa học' },
        status: 'UNEXCUSED_ABSENT' as const,
      },
      requestedStatus: 'PRESENT' as const,
      reason: 'Em có mặt suốt buổi học',
      status: 'PENDING' as const,
      createdAt: '2026-10-14T21:00:00Z',
      reviewNote: null,
    },
  ],
  pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

describe('StudentAttendancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(studentClassesService.getMyClasses).mockResolvedValue(mockClasses as any);
    vi.mocked(attendanceService.getMyAttendanceSummary).mockResolvedValue(mockSummary as any);
    vi.mocked(attendanceService.getMyAttendanceHistory).mockResolvedValue(mockHistory as any);
    vi.mocked(attendanceService.getMyCorrectionRequests).mockResolvedValue(mockMyRequests as any);
  });

  it('renders page header and metric cards', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Điểm danh của tôi/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // totalSessions
      expect(screen.getByText('8')).toBeInTheDocument(); // PRESENT count
    });
  });

  it('renders attendance history table', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Buổi 1: Giới thiệu khóa học')).toBeInTheDocument();
      expect(screen.getAllByText('Lớp 12 Chuyên Văn').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Báo điểm danh sai/i })).toBeInTheDocument();
    });
  });

  it('opens correction modal and validates empty reason', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Buổi 1: Giới thiệu khóa học')).toBeInTheDocument();
    });

    const reportBtn = screen.getByRole('button', { name: /Báo điểm danh sai/i });
    fireEvent.click(reportBtn);

    expect(screen.getByText('Báo điểm danh sai & Xin điều chỉnh')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu điều chỉnh/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập lý do xin điều chỉnh điểm danh')).toBeInTheDocument();
    });
    expect(attendanceService.createCorrectionRequest).not.toHaveBeenCalled();
  });

  it('submits correction request when valid', async () => {
    vi.mocked(attendanceService.createCorrectionRequest).mockResolvedValueOnce({
      message: 'Gửi yêu cầu thành công',
      request: {},
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Buổi 1: Giới thiệu khóa học')).toBeInTheDocument();
    });

    const reportBtn = screen.getByRole('button', { name: /Báo điểm danh sai/i });
    fireEvent.click(reportBtn);

    expect(screen.getByText('Báo điểm danh sai & Xin điều chỉnh')).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/Ví dụ: Em có tham gia đầy đủ buổi học/i);
    await userEvent.type(reasonInput, 'Em có vào học đúng giờ từ đầu');

    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu điều chỉnh/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(attendanceService.createCorrectionRequest).toHaveBeenCalledWith({
        attendanceId: 'att-1',
        requestedStatus: 'PRESENT',
        reason: 'Em có vào học đúng giờ từ đầu',
        evidenceUrl: undefined,
      });
    });
  });

  it('switches to My Requests tab and displays submitted requests', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Buổi 1: Giới thiệu khóa học')).toBeInTheDocument();
    });

    const requestsTabBtn = screen.getByRole('button', { name: /Yêu cầu điều chỉnh của tôi/i });
    fireEvent.click(requestsTabBtn);

    await waitFor(() => {
      expect(attendanceService.getMyCorrectionRequests).toHaveBeenCalled();
      expect(screen.getByText('Em có mặt suốt buổi học')).toBeInTheDocument();
      expect(screen.getByText('Chờ xử lý')).toBeInTheDocument();
    });
  });
});
