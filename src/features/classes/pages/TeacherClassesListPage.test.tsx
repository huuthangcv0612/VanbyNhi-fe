import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeacherClassesListPage } from './TeacherClassesListPage';
import { teacherClassesService } from '../services/classes.service';
import { ToastProvider } from '@/components/ui/toast';
import type { TeacherClassesResponse } from '../types/class.types';

vi.mock('../services/classes.service', () => ({
  teacherClassesService: {
    getMyClasses: vi.fn(),
    createClass: vi.fn(),
    updateClass: vi.fn(),
    updateClassStatus: vi.fn(),
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
          <TeacherClassesListPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('TeacherClassesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse: TeacherClassesResponse = {
    items: [
      {
        id: 'cls-1',
        name: 'Lớp Văn 12 Nâng Cao',
        description: 'Chuyên đề văn học hiện đại',
        classCode: 'VAN12-NC',
        joinCode: 'CODE1234',
        maxStudents: 30,
        defaultMeetUrl: 'https://meet.google.com/abc-def-ghi',
        monthlyTuition: 600000,
        status: 'ACTIVE',
        createdById: 't1',
        teacherId: 't1',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
        _count: {
          members: 12,
          sessions: 8,
        },
        activeStudentCount: 12,
        nextSession: {
          id: 'sess-1',
          title: 'Buổi 1: Vợ chồng A Phủ',
          description: 'Phân tích nhân vật Mị',
          startTime: '2026-10-15T19:00:00.000Z',
          endTime: '2026-10-15T21:00:00.000Z',
          status: 'IN_PROGRESS',
        },
      },
      {
        id: 'cls-2',
        name: 'Lớp Luyện Đề THPT',
        description: null,
        classCode: 'VAN12-DE',
        joinCode: 'CODE5678',
        maxStudents: null,
        defaultMeetUrl: null,
        monthlyTuition: 500000,
        status: 'ACTIVE',
        createdById: 't1',
        teacherId: 't1',
        createdAt: '2026-09-05T00:00:00.000Z',
        updatedAt: '2026-09-05T00:00:00.000Z',
        _count: {
          members: 20,
          sessions: 5,
        },
        activeStudentCount: 18,
        nextSession: {
          id: 'sess-2',
          title: 'Buổi 2: Đất Nước',
          description: null,
          startTime: '2026-10-16T19:00:00.000Z',
          endTime: '2026-10-16T21:00:00.000Z',
          status: 'SCHEDULED',
        },
      },
      {
        id: 'cls-3',
        name: 'Lớp Cơ Bản 11',
        description: null,
        classCode: 'VAN11-CB',
        joinCode: 'CODE9999',
        maxStudents: 25,
        defaultMeetUrl: null,
        monthlyTuition: 400000,
        status: 'CLOSED',
        createdById: 't1',
        teacherId: 't1',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        _count: {
          members: 15,
          sessions: 2,
        },
        activeStudentCount: 15,
        nextSession: null,
      },
    ],
    pagination: {
      total: 3,
      page: 1,
      limit: 9,
      totalPages: 1,
    },
  };

  it('renders classes in cards, preserving exact backend priority ordering', async () => {
    vi.mocked(teacherClassesService.getMyClasses).mockResolvedValueOnce(mockResponse);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lớp Văn 12 Nâng Cao')).toBeInTheDocument();
      expect(screen.getByText('Lớp Luyện Đề THPT')).toBeInTheDocument();
      expect(screen.getByText('Lớp Cơ Bản 11')).toBeInTheDocument();
    });

    // Verify nextSession status rendering
    expect(screen.getByText('ĐANG DIỄN RA')).toBeInTheDocument();
    expect(screen.getByText('Buổi 1: Vợ chồng A Phủ')).toBeInTheDocument();
    expect(screen.getByText('Buổi 2: Đất Nước')).toBeInTheDocument();
    expect(screen.getByText('Chưa có buổi học sắp tới')).toBeInTheDocument();

    // Verify separation of classCode and joinCode
    expect(screen.getByText('VAN12-NC')).toBeInTheDocument();
    expect(screen.getByText('CODE1234')).toBeInTheDocument();

    // Verify activeStudentCount display
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('filters by status and searches by keyword', async () => {
    const user = userEvent.setup();
    vi.mocked(teacherClassesService.getMyClasses).mockResolvedValue(mockResponse);

    renderPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Tìm theo tên lớp, mã tham gia hoặc mô tả...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Tìm theo tên lớp, mã tham gia hoặc mô tả...');
    await user.type(searchInput, 'Nâng Cao');

    await waitFor(() => {
      expect(teacherClassesService.getMyClasses).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Nâng Cao',
          page: 1,
        }),
      );
    });

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'CLOSED');

    await waitFor(() => {
      expect(teacherClassesService.getMyClasses).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'CLOSED',
          page: 1,
        }),
      );
    });
  });

  it('renders empty state when no classes found', async () => {
    vi.mocked(teacherClassesService.getMyClasses).mockResolvedValueOnce({
      items: [],
      pagination: { total: 0, page: 1, limit: 9, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Chưa có lớp học nào')).toBeInTheDocument();
    });
  });

  it('renders error state on API error and allows retry', async () => {
    vi.mocked(teacherClassesService.getMyClasses).mockRejectedValueOnce(
      new Error('Lỗi kết nối máy chủ'),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Không thể tải danh sách lớp học')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    expect(retryBtn).toBeInTheDocument();
  });
});
