import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClassSessionsList } from './ClassSessionsList';
import { studentClassesService } from '../services/classes.service';
import type { StudentClassSessionsResponse } from '../types/class.types';

vi.mock('../services/classes.service', () => ({
  studentClassesService: {
    getClassSessions: vi.fn(),
    checkIn: vi.fn(),
    getMeetJoinUrl: vi.fn(),
  },
}));

import { ToastProvider } from '@/components/ui/toast';

function renderComponent(classId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <ClassSessionsList classId={classId} />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('ClassSessionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse: StudentClassSessionsResponse = {
    items: [
      {
        id: 'sess-1',
        title: 'Buổi 1: Tổng quan văn học hiện đại',
        description: 'Khái quát các giai đoạn văn học 1945-1975',
        startTime: '2026-10-15T19:00:00.000Z',
        endTime: '2026-10-15T21:00:00.000Z',
        status: 'SCHEDULED',
        canJoinMeet: true,
        meetUrl: 'https://meet.google.com/abc-xyz',
        joinWindow: {
          opensAt: '2026-10-15T18:45:00.000Z',
          closesAt: '2026-10-15T21:00:00.000Z',
          isOpen: true,
        },
        myAttendance: {
          id: 'att-1',
          status: 'PRESENT',
          checkedInAt: '2026-10-15T18:50:00.000Z',
          note: null,
        },
        hasLessonRecord: true,
        lessonRecordSummary: {
          homeworkSummary: 'Làm đề cương ôn tập trang 45',
        },
        materialsCount: 2,
        assignmentsCount: 1,
      },
      {
        id: 'sess-2',
        title: 'Buổi 2: Chiếc thuyền ngoài xa',
        description: null,
        startTime: '2026-10-17T19:00:00.000Z',
        endTime: '2026-10-17T21:00:00.000Z',
        status: 'SCHEDULED',
        canJoinMeet: false,
        meetUrl: null,
        joinWindow: {
          opensAt: '2026-10-17T18:45:00.000Z',
          closesAt: '2026-10-17T21:00:00.000Z',
          isOpen: false,
          reason: 'Chưa đến thời gian mở phòng',
        },
        myAttendance: null,
        hasLessonRecord: false,
        lessonRecordSummary: null,
        materialsCount: 0,
        assignmentsCount: 0,
      },
    ],
    pagination: {
      total: 2,
      page: 1,
      limit: 8,
      totalPages: 1,
    },
  };

  it('renders sessions list with attendance status and materials/assignments count', async () => {
    vi.mocked(studentClassesService.getClassSessions).mockResolvedValueOnce(mockResponse);

    renderComponent('cls-1');

    await waitFor(() => {
      expect(screen.getByText('Buổi 1: Tổng quan văn học hiện đại')).toBeInTheDocument();
      expect(screen.getByText('Buổi 2: Chiếc thuyền ngoài xa')).toBeInTheDocument();
    });

    expect(screen.getByText('Có mặt')).toBeInTheDocument();
    expect(screen.getByText('Chưa điểm danh')).toBeInTheDocument();
    expect(screen.getByText('2 tài liệu')).toBeInTheDocument();
    expect(screen.getByText('1 bài tập')).toBeInTheDocument();
  });

  it('filters sessions when user selects a different status', async () => {
    const user = userEvent.setup();
    vi.mocked(studentClassesService.getClassSessions).mockResolvedValue(mockResponse);

    renderComponent('cls-1');

    await waitFor(() => {
      expect(screen.getByText('Buổi 1: Tổng quan văn học hiện đại')).toBeInTheDocument();
    });

    const filterSelect = screen.getByRole('combobox');
    await user.selectOptions(filterSelect, 'COMPLETED');

    await waitFor(() => {
      expect(studentClassesService.getClassSessions).toHaveBeenCalledWith('cls-1', {
        page: 1,
        limit: 8,
        status: 'COMPLETED',
      });
    });
  });

  it('displays empty state when no sessions are returned', async () => {
    vi.mocked(studentClassesService.getClassSessions).mockResolvedValueOnce({
      items: [],
      pagination: { total: 0, page: 1, limit: 8, totalPages: 1 },
    });

    renderComponent('cls-1');

    await waitFor(() => {
      expect(screen.getByText('Chưa có buổi học nào')).toBeInTheDocument();
    });
  });
});
