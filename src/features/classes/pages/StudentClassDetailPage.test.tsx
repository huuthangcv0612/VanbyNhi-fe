import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentClassDetailPage } from './StudentClassDetailPage';
import { studentClassesService } from '../services/classes.service';
import { ToastProvider } from '@/components/ui/toast';
import type { StudentClassDetail, StudentClassSessionsResponse } from '../types/class.types';

vi.mock('../services/classes.service', () => ({
  studentClassesService: {
    getClassDetail: vi.fn(),
    getClassSessions: vi.fn(),
    leaveClass: vi.fn(),
    getMeetJoinUrl: vi.fn(),
  },
}));

function renderPage(classId = 'cls-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/student/classes/${classId}`]}>
          <Routes>
            <Route path="/student/classes/:classId" element={<StudentClassDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('StudentClassDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDetail: StudentClassDetail = {
    id: 'cls-1',
    name: 'Lớp Luyện Thi Ngữ Văn 12 Nâng Cao',
    description: 'Chương trình rèn luyện kỹ năng viết nghị luận xã hội và văn học',
    status: 'ACTIVE',
    defaultMeetUrl: 'https://meet.google.com/abc-xyz',
    teacher: {
      id: 'tea-1',
      fullName: 'Cô Đỗ Vân',
      email: 'van@vanbynhi.edu.vn',
      phone: '0912345678',
    },
    joinedAt: '2026-09-01T00:00:00.000Z',
    membershipId: 'mem-10',
    nextSession: {
      id: 'sess-10',
      title: 'Chữa bài tập làm văn số 2',
      startTime: '2026-10-15T19:00:00.000Z',
      endTime: '2026-10-15T21:00:00.000Z',
      status: 'SCHEDULED',
      canJoinMeet: true,
      meetUrl: 'https://meet.google.com/abc-xyz',
      opensAt: '2026-10-15T18:45:00.000Z',
      closesAt: '2026-10-15T21:00:00.000Z',
      isLive: false,
    },
    attendanceSummary: {
      totalCompletedSessions: 10,
      attendedCount: 9,
      attendanceRate: 90,
    },
  };

  const mockSessions: StudentClassSessionsResponse = {
    items: [],
    pagination: { total: 0, page: 1, limit: 8, totalPages: 1 },
  };

  it('renders class details, teacher info, and real attendance summary statistics', async () => {
    vi.mocked(studentClassesService.getClassDetail).mockResolvedValueOnce(mockDetail);
    vi.mocked(studentClassesService.getClassSessions).mockResolvedValueOnce(mockSessions);

    renderPage('cls-1');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Lớp Luyện Thi Ngữ Văn 12 Nâng Cao' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Cô Đỗ Vân/)).toBeInTheDocument();
    });

    // Attendance summary
    expect(screen.getByText('Buổi học đã hoàn thành')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent?.trim() === '10 buổi')).toBeInTheDocument();
    expect(screen.getByText('Số buổi đã tham dự')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent?.trim() === '9 buổi')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();

    // Next session spotlight
    expect(screen.getAllByText('Chữa bài tập làm văn số 2').length).toBeGreaterThanOrEqual(1);
  });

  it('renders error state when class is not found or student is forbidden', async () => {
    vi.mocked(studentClassesService.getClassDetail).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          message: 'Bạn không phải là thành viên đang hoạt động của lớp học này',
        },
      },
    });

    renderPage('cls-forbidden');

    await waitFor(() => {
      expect(
        screen.getByText(/Bạn không phải là thành viên đang hoạt động của lớp học này/i),
      ).toBeInTheDocument();
    });
  });
});
