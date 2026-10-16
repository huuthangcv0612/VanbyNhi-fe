/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AttendancePage } from './AttendancePage';
import { attendanceService } from '../services/attendance.service';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import { ToastProvider } from '@/components/ui/toast';

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 't1', role: 'TEACHER', fullName: 'Cô Vân' },
  }),
}));

vi.mock('@/features/classes/services/classes.service', () => ({
  teacherClassesService: {
    getMyClasses: vi.fn(),
  },
  classesService: {
    findAll: vi.fn(),
  },
}));

vi.mock('../services/attendance.service', () => ({
  attendanceService: {
    getClassAttendanceSummary: vi.fn(),
    getCorrectionRequests: vi.fn(),
    getClassAttendanceHistory: vi.fn(),
    getMonthlySummary: vi.fn(),
    closeMonthlySummary: vi.fn(),
    reviewCorrectionRequest: vi.fn(),
    exportDetailExcel: vi.fn(),
    exportSummaryExcel: vi.fn(),
    getClassAttendanceConfig: vi.fn(),
    updateClassAttendanceConfig: vi.fn(),
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
          <AttendancePage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const mockClasses = {
  items: [
    { id: 'c1', name: 'Lớp 12 Chuyên Văn', activeStudentCount: 20 },
    { id: 'c2', name: 'Lớp 11 Cơ Bản', activeStudentCount: 15 },
  ],
};

const mockSummary = {
  totalRecords: 240,
  summary: {
    PRESENT: 220,
    LATE: 10,
    EXCUSED_ABSENT: 5,
    UNEXCUSED_ABSENT: 5,
    NOT_MARKED: 0,
    ABSENT: 0,
  },
};

const mockCorrectionRequests = {
  items: [
    {
      id: 'req-1',
      student: { id: 'u1', fullName: 'Lê Văn C', phone: '0988888888' },
      attendance: {
        session: { id: 's1', title: 'Buổi 1: Tổng quan', startTime: '2026-10-10T19:00:00Z' },
        status: 'UNEXCUSED_ABSENT' as const,
      },
      requestedStatus: 'PRESENT' as const,
      reason: 'Em có mặt suốt buổi học nhưng mạng chập chờn',
      status: 'PENDING' as const,
      createdAt: '2026-10-10T22:00:00Z',
    },
  ],
  pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

const mockHistory = {
  items: [
    {
      id: 'att-1',
      session: { id: 's1', title: 'Buổi 1: Mở đầu', startTime: '2026-10-12T19:00:00Z' },
      student: { id: 'u1', fullName: 'Lê Văn C', phone: '0988888888' },
      status: 'PRESENT' as const,
      note: 'Vào đúng giờ',
      markedAt: '2026-10-12T19:05:00Z',
    },
  ],
  pagination: { total: 1, page: 1, limit: 15, totalPages: 1 },
};

const mockMonthly = {
  month: 10,
  year: 2026,
  isClosed: false,
  items: [
    {
      id: 'm1',
      student: { id: 'u1', fullName: 'Lê Văn C' },
      totalSessions: 8,
      presentCount: 8,
      lateCount: 0,
      excusedAbsentCount: 0,
      unexcusedAbsentCount: 0,
      notMarkedCount: 0,
      chargeableSessions: 8,
      tuitionAmount: 500000,
      isClosed: false,
    },
  ],
};

const mockConfig = {
  classId: 'c1',
  chargePresent: true,
  chargeLate: true,
  chargeExcusedAbsent: false,
  chargeUnexcusedAbsent: false,
  allowMakeUpSession: true,
  retentionDays: 60,
};

describe('AttendancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(teacherClassesService.getMyClasses).mockResolvedValue(mockClasses as any);
    vi.mocked(attendanceService.getClassAttendanceSummary).mockResolvedValue(mockSummary as any);
    vi.mocked(attendanceService.getCorrectionRequests).mockResolvedValue(mockCorrectionRequests as any);
    vi.mocked(attendanceService.getClassAttendanceHistory).mockResolvedValue(mockHistory as any);
    vi.mocked(attendanceService.getMonthlySummary).mockResolvedValue(mockMonthly as any);
    vi.mocked(attendanceService.getClassAttendanceConfig).mockResolvedValue(mockConfig as any);
  });

  it('renders page header and tabs correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Quản lý Điểm danh/i)).toBeInTheDocument();
    });

    // Check all tab buttons exist
    expect(screen.getByRole('button', { name: /Tổng quan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lịch sử điểm danh/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tổng hợp tháng/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yêu cầu điều chỉnh/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xuất Excel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cấu hình tính phí/i })).toBeInTheDocument();
  });

  it('displays overview metrics when in overview tab', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Lớp 12 Chuyên Văn/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('240')).toBeInTheDocument(); // totalRecords
      expect(screen.getByText('220')).toBeInTheDocument(); // presentCount
    });
  });

  it('switches to History tab and displays history list', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Lớp 12 Chuyên Văn/i)).toBeInTheDocument();
    });

    const historyTabBtn = screen.getByRole('button', { name: /Lịch sử điểm danh/i });
    fireEvent.click(historyTabBtn);

    await waitFor(() => {
      expect(attendanceService.getClassAttendanceHistory).toHaveBeenCalled();
      expect(screen.getByText('Buổi 1: Mở đầu')).toBeInTheDocument();
      expect(screen.getByText('Vào đúng giờ')).toBeInTheDocument();
    });
  });

  it('switches to Monthly Summary tab and displays monthly table', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Lớp 12 Chuyên Văn/i)).toBeInTheDocument();
    });

    const monthlyTabBtn = screen.getByRole('button', { name: /Tổng hợp tháng/i });
    fireEvent.click(monthlyTabBtn);

    await waitFor(() => {
      expect(attendanceService.getMonthlySummary).toHaveBeenCalled();
      expect(screen.getByText('Lê Văn C')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Chốt tổng kết tháng/i })).toBeInTheDocument();
    });
  });

  it('switches to Correction Requests tab and displays pending requests', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Lớp 12 Chuyên Văn/i)).toBeInTheDocument();
    });

    const requestsTabBtn = screen.getByRole('button', { name: /Yêu cầu điều chỉnh/i });
    fireEvent.click(requestsTabBtn);

    await waitFor(() => {
      expect(attendanceService.getCorrectionRequests).toHaveBeenCalled();
      expect(screen.getByText(/Em có mặt suốt buổi học/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Xét duyệt/i })).toBeInTheDocument();
    });
  });

  it('opens review modal and approves correction request', async () => {
    vi.mocked(attendanceService.reviewCorrectionRequest).mockResolvedValueOnce({
      message: 'Duyệt thành công',
      request: {},
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Lớp 12 Chuyên Văn/i)).toBeInTheDocument();
    });

    const requestsTabBtn = screen.getByRole('button', { name: /Yêu cầu điều chỉnh/i });
    fireEvent.click(requestsTabBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Xét duyệt/i })).toBeInTheDocument();
    });

    const reviewBtn = screen.getByRole('button', { name: /Xét duyệt/i });
    fireEvent.click(reviewBtn);

    expect(screen.getByText(/Xét duyệt yêu cầu điều chỉnh điểm danh/i)).toBeInTheDocument();

    const submitReviewBtn = screen.getByRole('button', { name: /Xác nhận duyệt/i });
    fireEvent.click(submitReviewBtn);

    await waitFor(() => {
      expect(attendanceService.reviewCorrectionRequest).toHaveBeenCalledWith('req-1', {
        status: 'APPROVED',
        reviewNote: undefined,
      });
    });
  });

  it('switches to Excel Export tab and allows triggering export', async () => {
    vi.mocked(attendanceService.exportDetailExcel).mockResolvedValueOnce(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Lớp 12 Chuyên Văn/i)).toBeInTheDocument();
    });

    const exportTabBtn = screen.getByRole('button', { name: /Xuất Excel/i });
    fireEvent.click(exportTabBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tải file Excel chi tiết/i })).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Tải file Excel chi tiết/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(attendanceService.exportDetailExcel).toHaveBeenCalledWith('c1', {
        year: expect.any(Number),
        month: expect.any(Number),
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  it('switches to Config tab and allows updating attendance policy', async () => {
    vi.mocked(attendanceService.updateClassAttendanceConfig).mockResolvedValueOnce({
      message: 'Cập nhật cấu hình thành công',
      config: mockConfig,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Lớp 12 Chuyên Văn/i)).toBeInTheDocument();
    });

    const configTabBtn = screen.getByRole('button', { name: /Cấu hình tính phí/i });
    fireEvent.click(configTabBtn);

    await waitFor(() => {
      expect(attendanceService.getClassAttendanceConfig).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /Lưu cấu hình lớp học/i })).toBeInTheDocument();
    });

    const saveConfigBtn = screen.getByRole('button', { name: /Lưu cấu hình lớp học/i });
    fireEvent.click(saveConfigBtn);

    await waitFor(() => {
      expect(attendanceService.updateClassAttendanceConfig).toHaveBeenCalledWith('c1', expect.any(Object));
    });
  });
});
