import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentClassesPage } from './StudentClassesPage';
import { studentClassesService } from '../services/classes.service';
import { ToastProvider } from '@/components/ui/toast';
import type { StudentClassesResponse } from '../types/class.types';

vi.mock('../services/classes.service', () => ({
  studentClassesService: {
    getMyClasses: vi.fn(),
    getMyRequests: vi.fn(),
    joinClass: vi.fn(),
    leaveClass: vi.fn(),
    getMeetJoinUrl: vi.fn(),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <StudentClassesPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('StudentClassesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockClassesResponse: StudentClassesResponse = {
    items: [
      {
        membershipId: 'mem-1',
        joinedAt: '2026-09-01T00:00:00.000Z',
        effectiveTuition: 800000,
        class: {
          id: 'cls-1',
          name: 'Lớp Luyện Thi Văn 12 - Cô Vân',
          description: 'Luyện thi tốt nghiệp THPT Quốc gia môn Ngữ Văn',
          status: 'ACTIVE',
          monthlyTuition: 800000,
          teacher: {
            id: 'teacher-1',
            fullName: 'ThS. Nguyễn Thị Vân',
            email: 'van@vanbynhi.edu.vn',
            phone: '0987654321',
          },
          nextSession: {
            id: 'sess-1',
            title: 'Chuyên đề: Phân tích Vợ Nhặt',
            startTime: '2026-10-15T19:00:00.000Z',
            endTime: '2026-10-15T21:00:00.000Z',
            status: 'SCHEDULED',
            canJoinMeet: true,
            meetUrl: 'https://meet.google.com/abc-defg-hij',
            opensAt: '2026-10-15T18:45:00.000Z',
            closesAt: '2026-10-15T21:00:00.000Z',
            isLive: false,
          },
        },
      },
    ],
    pagination: {
      total: 1,
      page: 1,
      limit: 9,
      totalPages: 1,
    },
  };

  it('renders enrolled classes and spotlights the nearest upcoming session', async () => {
    vi.mocked(studentClassesService.getMyClasses).mockResolvedValueOnce(mockClassesResponse);

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Lớp Luyện Thi Văn 12 - Cô Vân').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/ThS\. Nguyễn Thị Vân/)).toBeInTheDocument();
      expect(screen.getByText(/800\.000\s*₫/)).toBeInTheDocument();
    });

    // Spotlight section
    expect(screen.getByText(/Buổi học tiếp theo/i)).toBeInTheDocument();
    expect(screen.getAllByText('Chuyên đề: Phân tích Vợ Nhặt').length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when student is not in any class', async () => {
    vi.mocked(studentClassesService.getMyClasses).mockResolvedValueOnce({
      items: [],
      pagination: { total: 0, page: 1, limit: 9, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bạn chưa tham gia lớp học nào')).toBeInTheDocument();
    });
  });

  it('submits joinCode when student fills join box', async () => {
    const user = userEvent.setup();
    vi.mocked(studentClassesService.getMyClasses).mockResolvedValue(mockClassesResponse);
    vi.mocked(studentClassesService.joinClass).mockResolvedValueOnce({
      message: 'Gửi yêu cầu tham gia lớp học thành công',
      membership: {},
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('NHẬP MÃ (VD: 8AK29P)')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('NHẬP MÃ (VD: 8AK29P)');
    await user.type(input, '8AK29P');

    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(studentClassesService.joinClass).toHaveBeenCalledWith({
        joinCode: '8AK29P',
      });
    });
  });

  it('renders error state on API failure with retry action', async () => {
    vi.mocked(studentClassesService.getMyClasses).mockRejectedValueOnce(
      new Error('Lỗi máy chủ nội bộ'),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Không thể tải danh sách lớp học')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    expect(retryBtn).toBeInTheDocument();
  });
});
