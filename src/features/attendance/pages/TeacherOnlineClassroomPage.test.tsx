/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TeacherOnlineClassroomPage } from './TeacherOnlineClassroomPage';
import { attendanceService } from '../services/attendance.service';
import { ToastProvider } from '@/components/ui/toast';

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

function renderWithRoute(sessionId = 'sess-123') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/teacher/sessions/${sessionId}`]}>
          <Routes>
            <Route
              path="/teacher/sessions/:sessionId"
              element={<TeacherOnlineClassroomPage />}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const mockSessionData = {
  session: {
    id: 'sess-123',
    title: 'Phân tích nhân vật Huấn Cao - Chữ người tử tù',
    startTime: '2026-10-16T19:00:00Z',
    endTime: '2026-10-16T21:00:00Z',
    status: 'IN_PROGRESS' as const,
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    class: {
      id: 'c1',
      name: 'Lớp 12 Chuyên Văn',
      teacher: { fullName: 'Cô Đỗ Vân' },
    },
    attendanceSession: {
      status: 'OPEN' as const,
      openedAt: '2026-10-16T18:45:00Z',
    },
  },
  students: [
    {
      student: { id: 'u1', fullName: 'Nguyễn Văn An', phone: '0901234567' },
      attendance: { id: 'att-1', status: 'NOT_MARKED' as const },
    },
  ],
};

const mockSummary = {
  totalStudents: 1,
  markedCount: 0,
  presentCount: 0,
  lateCount: 0,
  excusedAbsentCount: 0,
  unexcusedAbsentCount: 0,
};

describe('TeacherOnlineClassroomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValue(mockSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValue(mockSummary as any);
  });

  it('renders session header, meet link, and attendance panel', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Phân tích nhân vật Huấn Cao/i,
        }),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Lớp 12 Chuyên Văn/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Cô Đỗ Vân/i)).toBeInTheDocument();
    });

    // Check Google Meet open button
    const meetBtn = screen.getAllByRole('link', { name: /Mở Google Meet/i })[0];
    expect(meetBtn).toHaveAttribute('href', 'https://meet.google.com/abc-defg-hij');

    // Check attendance panel is rendered
    expect(screen.getByText('Bảng điểm danh buổi học')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
  });

  it('toggles desktop attendance panel collapse', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Phân tích nhân vật Huấn Cao/i,
        }),
      ).toBeInTheDocument();
    });

    const collapseBtn = screen.getByRole('button', { name: /Ẩn điểm danh/i });
    await userEvent.click(collapseBtn);

    expect(screen.getByRole('button', { name: /Mở điểm danh/i })).toBeInTheDocument();

    const expandBtn = screen.getByRole('button', { name: /Mở điểm danh/i });
    await userEvent.click(expandBtn);

    expect(screen.getByRole('button', { name: /Ẩn điểm danh/i })).toBeInTheDocument();
  });

  it('switches between meet and attendance tabs on mobile view', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Phân tích nhân vật Huấn Cao/i,
        }),
      ).toBeInTheDocument();
    });

    const mobileTabBtn = screen.getByRole('button', { name: /Bảng điểm danh \(1\)/i });
    await userEvent.click(mobileTabBtn);

    expect(screen.getByText('Bảng điểm danh buổi học')).toBeInTheDocument();
  });
});
