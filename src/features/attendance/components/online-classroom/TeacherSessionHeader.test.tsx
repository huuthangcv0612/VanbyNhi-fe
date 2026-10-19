import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeacherSessionHeader } from './TeacherSessionHeader';
import { teacherClassesService } from '@/features/classes/services/classes.service';

vi.mock('@/features/classes/services/classes.service', () => ({
  teacherClassesService: {
    startSession: vi.fn(),
    endSession: vi.fn(),
    getTeacherMeetAccess: vi.fn(),
    updateSessionMeetUrl: vi.fn(),
  },
}));

const mockShowToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

function renderHeader(props: Partial<Parameters<typeof TeacherSessionHeader>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    sessionId: 'session-123',
    title: 'Buổi 1: Giới thiệu khóa học',
    status: 'SCHEDULED' as const,
    startTime: '2026-10-20T09:00:00Z',
    endTime: '2026-10-20T11:00:00Z',
    classInfo: {
      id: 'class-456',
      name: 'Toán nâng cao 10',
      defaultMeetUrl: 'https://meet.google.com/abc-defg-hij',
      teacher: {
        id: 'teacher-1',
        fullName: 'Thầy Văn',
      },
    },
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TeacherSessionHeader {...defaultProps} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TeacherSessionHeader', () => {
  let mockWindowOpen: ReturnType<typeof vi.fn>;
  let mockTab: { location: { href: string }; close: ReturnType<typeof vi.fn>; closed: boolean };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTab = {
      location: { href: '' },
      close: vi.fn(),
      closed: false,
    };
    mockWindowOpen = vi.fn().mockReturnValue(mockTab);
    window.open = mockWindowOpen as unknown as typeof window.open;
  });

  it('renders header with title, class name, and start session button when SCHEDULED', () => {
    renderHeader();

    expect(screen.getByRole('heading', { level: 1, name: 'Buổi 1: Giới thiệu khóa học' })).toBeInTheDocument();
    expect(screen.getAllByText('Toán nâng cao 10').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Chưa bắt đầu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bắt đầu buổi học/i })).toBeInTheDocument();
  });

  it('calls startSession and navigates new tab to meetingUri on confirmation', async () => {
    vi.mocked(teacherClassesService.startSession).mockResolvedValue({
      message: 'Buổi học đã bắt đầu',
      meetingUri: 'https://meet.google.com/xyz-uvwx-rst',
      session: {
        id: 'session-123',
        classId: 'class-456',
        title: 'Buổi 1',
        startTime: '2026-10-20T09:00:00Z',
        endTime: '2026-10-20T11:00:00Z',
        status: 'IN_PROGRESS',
        createdAt: '2026-10-20T08:00:00Z',
        updatedAt: '2026-10-20T09:00:00Z',
      } as unknown as import('@/features/classes/types/class.types').TeacherClassSessionItem,
    });

    renderHeader({ status: 'SCHEDULED' });

    // Open confirm modal
    fireEvent.click(screen.getByRole('button', { name: /bắt đầu buổi học/i }));
    expect(screen.getByText('Bắt đầu buổi học trực tuyến')).toBeInTheDocument();

    // Confirm start modal button
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ngay' }));

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith('about:blank', '_blank');
      expect(teacherClassesService.startSession).toHaveBeenCalledWith('session-123');
      expect(mockTab.location.href).toBe('https://meet.google.com/xyz-uvwx-rst');
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: expect.stringContaining('Buổi học đã bắt đầu'),
        }),
      );
    });
  });

  it('closes pre-opened tab when startSession fails', async () => {
    vi.mocked(teacherClassesService.startSession).mockRejectedValue(new Error('Internal Server Error'));

    renderHeader({ status: 'SCHEDULED' });

    fireEvent.click(screen.getByRole('button', { name: /bắt đầu buổi học/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ngay' }));

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith('about:blank', '_blank');
      expect(mockTab.close).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Không thể bắt đầu buổi học',
        }),
      );
    });
  });

  it('closes pre-opened tab and shows info toast when startSession returns no meet URL', async () => {
    vi.mocked(teacherClassesService.startSession).mockResolvedValue({
      message: 'Buổi học đã bắt đầu',
      meetingUri: null,
      session: {
        id: 'session-123',
        classId: 'class-456',
        title: 'Buổi 1',
        startTime: '2026-10-20T09:00:00Z',
        endTime: '2026-10-20T11:00:00Z',
        status: 'IN_PROGRESS',
        createdAt: '2026-10-20T08:00:00Z',
        updatedAt: '2026-10-20T09:00:00Z',
      } as unknown as import('@/features/classes/types/class.types').TeacherClassSessionItem,
    });

    renderHeader({ status: 'SCHEDULED' });

    fireEvent.click(screen.getByRole('button', { name: /bắt đầu buổi học/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ngay' }));

    await waitFor(() => {
      expect(mockTab.close).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
        }),
      );
    });
  });

  it('renders "Kết thúc buổi học" button when IN_PROGRESS and handles end session', async () => {
    vi.mocked(teacherClassesService.endSession).mockResolvedValue({
      message: 'Buổi học đã kết thúc',
      session: {
        id: 'session-123',
        classId: 'class-456',
        title: 'Buổi 1',
        startTime: '2026-10-20T09:00:00Z',
        endTime: '2026-10-20T11:00:00Z',
        status: 'COMPLETED',
        createdAt: '2026-10-20T08:00:00Z',
        updatedAt: '2026-10-20T11:00:00Z',
      } as unknown as import('@/features/classes/types/class.types').TeacherClassSessionItem,
    });

    renderHeader({ status: 'IN_PROGRESS' });

    expect(screen.getByText('Đang diễn ra (LIVE)')).toBeInTheDocument();
    const endBtn = screen.getByRole('button', { name: /kết thúc buổi học/i });
    expect(endBtn).toBeInTheDocument();

    fireEvent.click(endBtn);
    expect(screen.getByText('Kết thúc buổi học trực tuyến')).toBeInTheDocument();

    // Confirm end in modal
    const allEndButtons = screen.getAllByRole('button', { name: /kết thúc buổi học/i });
    fireEvent.click(allEndButtons[allEndButtons.length - 1]);

    await waitFor(() => {
      expect(teacherClassesService.endSession).toHaveBeenCalledWith('session-123');
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Buổi học đã kết thúc',
        }),
      );
    });
  });

  it('handles "Tham gia Google Meet" by querying getTeacherMeetAccess and navigating tab', async () => {
    vi.mocked(teacherClassesService.getTeacherMeetAccess).mockResolvedValue({
      sessionId: 'session-123',
      title: 'Buổi 1',
      classId: 'class-456',
      className: 'Toán nâng cao 10',
      status: 'IN_PROGRESS',
      startTime: '2026-10-20T09:00:00Z',
      endTime: '2026-10-20T11:00:00Z',
      isLive: true,
      canJoin: true,
      meetUrl: 'https://meet.google.com/live-teach-meet',
      effectiveMeetUrl: 'https://meet.google.com/live-teach-meet',
      hasValidMeetUrl: true,
    });

    renderHeader({ status: 'IN_PROGRESS' });

    const joinButtons = screen.getAllByRole('button', { name: /tham gia google meet/i });
    fireEvent.click(joinButtons[0]);

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith('about:blank', '_blank');
      expect(teacherClassesService.getTeacherMeetAccess).toHaveBeenCalledWith('session-123');
      expect(mockTab.location.href).toBe('https://meet.google.com/live-teach-meet');
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Đang mở Google Meet trong tab mới',
        }),
      );
    });
  });
});
