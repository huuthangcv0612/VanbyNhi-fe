import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentSessionDetailPage } from './StudentSessionDetailPage';
import { studentClassesService } from '../services/classes.service';
import { ToastProvider } from '@/components/ui/toast';
import type { StudentSessionDetail } from '../types/class.types';

vi.mock('../services/classes.service', () => ({
  studentClassesService: {
    getSessionDetail: vi.fn(),
    checkIn: vi.fn(),
    getMeetJoinUrl: vi.fn(),
  },
}));

function renderPage(sessionId = 'sess-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/student/sessions/${sessionId}`]}>
          <Routes>
            <Route path="/student/sessions/:sessionId" element={<StudentSessionDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('StudentSessionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDetail: StudentSessionDetail = {
    id: 'sess-1',
    title: 'Buổi 3: Luyện kỹ năng viết mở bài và kết bài',
    description: 'Hướng dẫn kỹ năng viết mở bài gián tiếp và kết bài mở',
    startTime: '2026-10-15T19:00:00.000Z',
    endTime: '2026-10-15T21:00:00.000Z',
    status: 'SCHEDULED',
    class: {
      id: 'cls-1',
      name: 'Lớp Luyện Thi Ngữ Văn 12',
      teacher: {
        id: 'tea-1',
        fullName: 'Cô Đỗ Vân',
        phone: '0912345678',
        email: 'van@vanbynhi.edu.vn',
      },
    },
    meetAccess: {
      canJoin: true,
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      opensAt: '2026-10-15T18:45:00.000Z',
      closesAt: '2026-10-15T21:00:00.000Z',
      isLive: false,
    },
    myAttendance: {
      id: 'att-1',
      status: 'PRESENT',
      checkedInAt: '2026-10-15T18:55:00.000Z',
      note: 'Tham dự đúng giờ',
    },
    lessonRecord: {
      id: 'rec-1',
      content: '1. Khái niệm mở bài gián tiếp\n2. Các phương pháp đặt vấn đề',
      homeworkSummary: 'Viết 3 mở bài theo đề bài đã cho',
      notes: 'Học sinh chuẩn bị bài số 4 trước khi đến lớp',
      createdAt: '2026-10-15T21:05:00.000Z',
    },
    materials: [
      {
        id: 'mat-1',
        title: 'Tài liệu hướng dẫn viết mở bài hay',
        type: 'DOCUMENT',
        fileUrl: 'https://storage.vanbynhi.edu.vn/materials/mo-bai.pdf',
        originalName: 'mo-bai-nang-cao.pdf',
        fileSize: 1024 * 512,
        createdAt: '2026-10-14T00:00:00.000Z',
      },
    ],
    assignments: [
      {
        id: 'asm-1',
        title: 'Bài tập rèn luyện viết mở bài',
        description: 'Thực hành viết 3 đoạn mở bài gián tiếp theo đề số 2',
        dueDate: '2026-10-18T23:59:00.000Z',
        fileUrls: ['https://storage.vanbynhi.edu.vn/assignments/de-so-2.pdf'],
      },
    ],
  };

  it('renders session header, meet access card, attendance info, lesson record, materials, and assignments', async () => {
    vi.mocked(studentClassesService.getSessionDetail).mockResolvedValueOnce(mockDetail);

    renderPage('sess-1');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Buổi 3: Luyện kỹ năng viết mở bài và kết bài' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Cô Đỗ Vân/)).toBeInTheDocument();
    });

    // Meet Access
    expect(
      screen.getByText(/Buổi học đã mở cửa sổ tham gia/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Tham gia Google Meet/i }),
    ).toBeEnabled();

    // Attendance
    expect(
      screen.getByText(/Bạn đã hoàn tất điểm danh cho buổi học này/i),
    ).toBeInTheDocument();

    // Lesson Record
    expect(screen.getByText(/1\. Khái niệm mở bài gián tiếp/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Viết 3 mở bài theo đề bài đã cho/i),
    ).toBeInTheDocument();

    // Material
    expect(
      screen.getByText('Tài liệu hướng dẫn viết mở bài hay'),
    ).toBeInTheDocument();

    // Assignment
    expect(screen.getByText('Bài tập rèn luyện viết mở bài')).toBeInTheDocument();
  });

  it('displays reason when meet access is not available yet', async () => {
    const notReadyDetail: StudentSessionDetail = {
      ...mockDetail,
      meetAccess: {
        canJoin: false,
        reason: 'Chưa đến thời gian mở phòng học. Cửa sổ tham gia mở trước giờ học 15 phút.',
        meetUrl: null,
        opensAt: '2026-10-15T18:45:00.000Z',
        closesAt: '2026-10-15T21:00:00.000Z',
        isLive: false,
      },
      myAttendance: null,
    };

    vi.mocked(studentClassesService.getSessionDetail).mockResolvedValueOnce(notReadyDetail);

    renderPage('sess-1');

    await waitFor(() => {
      expect(
        screen.getByText(/Chưa đến thời gian mở phòng học\. Cửa sổ tham gia mở trước giờ học 15 phút\./i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /Tham gia Google Meet/i }),
    ).toBeDisabled();
    expect(screen.getByText(/Xác nhận điểm danh ngay/i)).toBeInTheDocument();
  });
});
