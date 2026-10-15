import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeacherClassDetailPage } from './TeacherClassDetailPage';
import { teacherClassesService } from '../services/classes.service';
import { ToastProvider } from '@/components/ui/toast';
import type { ClassMemberItem } from '../types/class.types';

vi.mock('../services/classes.service', () => ({
  teacherClassesService: {
    getClassDetail: vi.fn(),
    getClassMembers: vi.fn(),
    getJoinRequests: vi.fn(),
    getClassSessions: vi.fn(),
    startSession: vi.fn(),
    endSession: vi.fn(),
    approveJoinRequest: vi.fn(),
    rejectJoinRequest: vi.fn(),
    removeMember: vi.fn(),
    regenerateJoinCode: vi.fn(),
    updateClassStatus: vi.fn(),
    updateClass: vi.fn(),
  },
}));

function renderPage(classId = 'cls-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/teacher/classes/${classId}`]}>
          <Routes>
            <Route path="/teacher/classes/:classId" element={<TeacherClassDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('TeacherClassDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDetail = {
    id: 'cls-1',
    name: 'Lớp Văn 12 Chuyên Sâu',
    description: 'Chuyên đề nâng cao THPT Quốc Gia',
    classCode: 'VAN12-CS',
    joinCode: 'CODE1234',
    maxStudents: 30,
    defaultMeetUrl: 'https://meet.google.com/abc-def-ghi',
    monthlyTuition: 800000,
    status: 'ACTIVE' as const,
    createdById: 't1',
    teacherId: 't1',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activeStudentCount: 15,
    pendingRequestsCount: 2,
    totalSessionsCount: 6,
    nextSession: {
      id: 'sess-1',
      title: 'Buổi 1: Tổng ôn kiến thức',
      description: 'Lý thuyết trọng tâm',
      startTime: '2026-10-15T19:00:00.000Z',
      endTime: '2026-10-15T21:00:00.000Z',
      status: 'IN_PROGRESS' as const,
    },
  };

  const mockMembers = {
    items: [
      {
        id: 'mem-1',
        classId: 'cls-1',
        studentId: 'stu-1',
        status: 'ACTIVE' as const,
        joinedAt: '2026-09-02T00:00:00.000Z',
        student: {
          id: 'stu-1',
          fullName: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          phone: '0912345678',
        },
      },
    ],
    pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
  };

  const mockRequests = {
    items: [
      {
        id: 'req-1',
        classId: 'cls-1',
        studentId: 'stu-2',
        status: 'PENDING' as const,
        requestedAt: '2026-10-14T00:00:00.000Z',
        student: {
          id: 'stu-2',
          fullName: 'Trần Thị B',
          email: 'tranthib@example.com',
          phone: '0987654321',
        },
      },
    ],
    pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
  };

  const mockSessions = {
    items: [
      {
        id: 'sess-1',
        classId: 'cls-1',
        title: 'Buổi 1: Tổng ôn kiến thức',
        description: 'Lý thuyết trọng tâm',
        startTime: '2026-10-15T19:00:00.000Z',
        endTime: '2026-10-15T21:00:00.000Z',
        meetUrl: 'https://meet.google.com/abc-def-ghi',
        status: 'IN_PROGRESS' as const,
        createdById: 't1',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
        class: { id: 'cls-1', name: 'Lớp Văn 12 Chuyên Sâu', defaultMeetUrl: null },
        lessonRecord: null,
        _count: { attendances: 15, materials: 2, assignments: 1 },
        effectiveMeetUrl: 'https://meet.google.com/abc-def-ghi',
      },
    ],
    pagination: { total: 1, page: 1, limit: 8, totalPages: 1 },
  };

  it('renders class detail information, nextSession spotlight, and members', async () => {
    vi.mocked(teacherClassesService.getClassDetail).mockResolvedValue(mockDetail);
    vi.mocked(teacherClassesService.getClassMembers).mockResolvedValue(mockMembers);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lớp Văn 12 Chuyên Sâu')).toBeInTheDocument();
      expect(screen.getByText('CODE1234')).toBeInTheDocument();
      expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('6').length).toBeGreaterThanOrEqual(1);
    });

    // Spotlight next session
    expect(screen.getByText('Buổi học đang diễn ra')).toBeInTheDocument();
    expect(screen.getAllByText('Buổi 1: Tổng ôn kiến thức').length).toBeGreaterThanOrEqual(1);

    // Members list
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('nguyenvana@example.com')).toBeInTheDocument();
    });
  });

  it('switches tabs to requests and sessions', async () => {
    const user = userEvent.setup();
    vi.mocked(teacherClassesService.getClassDetail).mockResolvedValue(mockDetail);
    vi.mocked(teacherClassesService.getClassMembers).mockResolvedValue(mockMembers);
    vi.mocked(teacherClassesService.getJoinRequests).mockResolvedValue(mockRequests);
    vi.mocked(teacherClassesService.getClassSessions).mockResolvedValue(mockSessions);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lớp Văn 12 Chuyên Sâu')).toBeInTheDocument();
    });

    // Click tab Yêu cầu tham gia
    const requestsTab = screen.getByRole('button', { name: /^Yêu cầu tham gia/i });
    await user.click(requestsTab);

    await waitFor(() => {
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
      expect(screen.getByText('tranthib@example.com')).toBeInTheDocument();
    });

    // Click tab Buổi học
    const sessionsTab = screen.getByRole('button', { name: /^Buổi học/i });
    await user.click(sessionsTab);

    await waitFor(() => {
      expect(teacherClassesService.getClassSessions).toHaveBeenCalledWith('cls-1', expect.anything());
    });
  });

  it('approves a join request and triggers mutation', async () => {
    const user = userEvent.setup();
    vi.mocked(teacherClassesService.getClassDetail).mockResolvedValue(mockDetail);
    vi.mocked(teacherClassesService.getClassMembers).mockResolvedValue(mockMembers);
    vi.mocked(teacherClassesService.getJoinRequests).mockResolvedValue(mockRequests);
    vi.mocked(teacherClassesService.approveJoinRequest).mockResolvedValueOnce({
      message: 'Duyệt thành công',
      membership: mockRequests.items[0] as unknown as ClassMemberItem,
    });

    renderPage();

    const requestsTab = await screen.findByRole('button', { name: /^Yêu cầu tham gia/i });
    await user.click(requestsTab);

    await waitFor(() => {
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole('button', { name: /Duyệt/i });
    await user.click(approveBtn);

    await waitFor(() => {
      expect(teacherClassesService.approveJoinRequest).toHaveBeenCalledWith('cls-1', 'req-1');
    });
  });
});
