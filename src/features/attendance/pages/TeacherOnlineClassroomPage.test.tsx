/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TeacherOnlineClassroomPage } from './TeacherOnlineClassroomPage';
import { attendanceService } from '@/features/attendance/services/attendance.service';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import { teacherDocumentsService } from '@/features/documents/services/documents.service';
import { ToastProvider } from '@/components/ui/toast';

vi.mock('@/features/attendance/services/attendance.service', () => ({
  attendanceService: {
    getSessionAttendance: vi.fn(),
    getSessionSummary: vi.fn(),
    saveSingleAttendance: vi.fn(),
    batchSaveAttendance: vi.fn(),
    saveDraftAttendance: vi.fn(),
    markAllPresent: vi.fn(),
    closeAttendanceSession: vi.fn(),
    exportSessionAttendanceExcel: vi.fn(),
  },
}));

vi.mock('@/features/classes/services/classes.service', () => ({
  teacherClassesService: {
    getSessionDetail: vi.fn(),
    getTeacherMeetAccess: vi.fn(),
    updateTeacherMeetUrl: vi.fn(),
    startSession: vi.fn(),
    endSession: vi.fn(),
    getTeacherLessonRecord: vi.fn(),
    upsertTeacherLessonRecord: vi.fn(),
    getClassMembers: vi.fn(),
    getClassSessions: vi.fn(),
  },
}));

vi.mock('@/features/documents/services/documents.service', () => ({
  teacherDocumentsService: {
    getSessionMaterials: vi.fn(),
    getDocuments: vi.fn(),
    initSessionUpload: vi.fn(),
    uploadFileToR2: vi.fn(),
    completeSessionUpload: vi.fn(),
    shareDocumentToSession: vi.fn(),
    getMaterialDownloadUrl: vi.fn(),
    removeMaterial: vi.fn(),
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
      teacher: { id: 't1', fullName: 'Cô Đỗ Vân' },
    },
    attendanceSession: {
      status: 'OPEN' as const,
      openedAt: '2026-10-16T18:45:00Z',
    },
  },
  students: [
    {
      student: { id: 'u1', fullName: 'Nguyễn Văn An', phone: '0901234567', email: 'an@gmail.com' },
      enrollmentStatus: 'ACTIVE',
      attendance: { id: 'att-1', status: 'NOT_MARKED' as const, note: null },
    },
  ],
};

const mockSummary = {
  sessionId: 'sess-123',
  totalActiveStudents: 1,
  totalStudents: 1,
  totalMarked: 0,
  presentCount: 0,
  lateCount: 0,
  absentCount: 0,
  excusedAbsentCount: 0,
  unexcusedAbsentCount: 0,
  notMarkedCount: 1,
  unmarkedCount: 1,
  summary: {
    PRESENT: 0,
    LATE: 0,
    ABSENT: 0,
    EXCUSED_ABSENT: 0,
    UNEXCUSED_ABSENT: 0,
    NOT_MARKED: 1,
  },
};

describe('TeacherOnlineClassroomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(attendanceService.getSessionAttendance).mockResolvedValue(mockSessionData as any);
    vi.mocked(attendanceService.getSessionSummary).mockResolvedValue(mockSummary as any);
    vi.mocked(teacherClassesService.getSessionDetail).mockResolvedValue({
      ...mockSessionData.session,
      _count: { materials: 2, attendances: 1, assignments: 0 },
    } as any);
    vi.mocked(teacherClassesService.getTeacherMeetAccess).mockResolvedValue({
      sessionId: 'sess-123',
      title: 'Phân tích nhân vật Huấn Cao - Chữ người tử tù',
      classId: 'c1',
      className: 'Lớp 12 Chuyên Văn',
      status: 'IN_PROGRESS',
      startTime: '2026-10-16T19:00:00Z',
      endTime: '2026-10-16T21:00:00Z',
      isLive: true,
      canJoin: true,
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      effectiveMeetUrl: 'https://meet.google.com/abc-defg-hij',
      hasValidMeetUrl: true,
    } as any);
    vi.mocked(teacherDocumentsService.getSessionMaterials).mockResolvedValue({
      items: [
        {
          id: 'mat-1',
          classId: 'c1',
          sessionId: 'sess-123',
          documentId: 'doc-1',
          uploadedById: 't1',
          title: 'Đề cương ôn tập văn học lãng mạn',
          description: 'Tài liệu bắt buộc đọc trước giờ học',
          type: 'DOCUMENT',
          originalName: 'de-cuong.pdf',
          mimeType: 'application/pdf',
          fileSize: 1048576,
          isPublished: true,
          publishedAt: '2026-10-16T10:00:00Z',
          order: 0,
          accessStartTime: null,
          accessEndTime: null,
          createdAt: '2026-10-16T10:00:00Z',
          updatedAt: '2026-10-16T10:00:00Z',
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    } as any);
    vi.mocked(teacherClassesService.getTeacherLessonRecord).mockResolvedValue({
      id: 'lr-1',
      sessionId: 'sess-123',
      content: 'Nội dung phân tích vẻ đẹp hình tượng Huấn Cao trong chốn lao tù',
      coreKnowledge: 'Thiên lương trong sáng, khí phách hiên ngang',
      incompleteContent: null,
      homeworkSummary: 'Viết đoạn văn 200 chữ cảm nhận cảnh cho chữ',
      teacherNotes: 'Lớp tiếp thu tốt, học sinh An cần rèn thêm dẫn chứng',
      generalRemarks: 'Buổi học sôi nổi',
      createdAt: '2026-10-16T20:00:00Z',
      updatedAt: '2026-10-16T20:00:00Z',
    });
    vi.mocked(teacherClassesService.getClassMembers).mockResolvedValue({
      items: [
        {
          id: 'mem-1',
          classId: 'c1',
          studentId: 'u1',
          status: 'ACTIVE',
          joinedAt: '2026-09-01T00:00:00Z',
          student: {
            id: 'u1',
            fullName: 'Nguyễn Văn An',
            phone: '0901234567',
            email: 'an@gmail.com',
            avatarUrl: null,
          },
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    } as any);
    vi.mocked(teacherClassesService.getClassSessions).mockResolvedValue({
      items: [
        {
          id: 'sess-123',
          classId: 'c1',
          title: 'Phân tích nhân vật Huấn Cao - Chữ người tử tù',
          description: null,
          startTime: '2026-10-16T19:00:00Z',
          endTime: '2026-10-16T21:00:00Z',
          meetUrl: 'https://meet.google.com/abc-defg-hij',
          status: 'IN_PROGRESS',
          createdById: 't1',
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-16T00:00:00Z',
          class: { id: 'c1', name: 'Lớp 12 Chuyên Văn', defaultMeetUrl: null },
          lessonRecord: { id: 'lr-1', createdAt: '', updatedAt: '' },
          _count: { attendances: 1, materials: 1, assignments: 0 },
          effectiveMeetUrl: 'https://meet.google.com/abc-defg-hij',
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    } as any);
  });

  it('renders session header, stat cards, and attendance workspace', async () => {
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
      expect(screen.getByText(/Đang diễn ra \(LIVE\)/i)).toBeInTheDocument();
    });

    // Check Google Meet button
    const meetBtn = screen.getByRole('button', { name: /Tham gia Google Meet/i });
    expect(meetBtn).toBeInTheDocument();

    // Check stat cards rendered from summary API
    await waitFor(() => {
      expect(screen.getByText('Sĩ số lớp')).toBeInTheDocument();
      expect(screen.getAllByText('Có mặt').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Đi muộn').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Vắng có phép').length).toBeGreaterThan(0);
    });

    // Check student in attendance list
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('0901234567')).toBeInTheDocument();
  });

  it('allows joining Google Meet with new window verification', async () => {
    const mockWindowOpen = vi.fn().mockReturnValue({ location: { href: '' }, close: vi.fn() });
    window.open = mockWindowOpen;

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tham gia Google Meet/i })).toBeInTheDocument();
    });

    const meetBtn = screen.getByRole('button', { name: /Tham gia Google Meet/i });
    await userEvent.click(meetBtn);

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith('about:blank', '_blank');
      expect(teacherClassesService.getTeacherMeetAccess).toHaveBeenCalledWith('sess-123');
    });
  });

  it('allows single student attendance status update', async () => {
    vi.mocked(attendanceService.saveSingleAttendance).mockResolvedValue({
      message: 'Điểm danh thành công',
      attendance: {},
    });

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    // Bấm nút "Có mặt" cho học sinh An
    const presentBtn = screen.getByTitle('Đánh dấu Có mặt');
    await userEvent.click(presentBtn);

    await waitFor(() => {
      expect(attendanceService.saveSingleAttendance).toHaveBeenCalledWith(
        'sess-123',
        expect.objectContaining({
          studentId: 'u1',
          status: 'PRESENT',
        }),
      );
    });
  });

  it('handles mark all present and export excel', async () => {
    vi.mocked(attendanceService.markAllPresent).mockResolvedValue({
      message: 'Tất cả học sinh đã có mặt',
      count: 1,
    });
    vi.mocked(attendanceService.exportSessionAttendanceExcel).mockResolvedValue();

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tất cả có mặt/i })).toBeInTheDocument();
    });

    // Test mark all present
    const markAllBtn = screen.getByRole('button', { name: /Tất cả có mặt/i });
    await userEvent.click(markAllBtn);

    await waitFor(() => {
      expect(attendanceService.markAllPresent).toHaveBeenCalledWith(
        'sess-123',
        expect.objectContaining({ overrideExisting: true }),
      );
    });

    // Test export excel
    const exportBtn = screen.getByRole('button', { name: /Xuất Excel/i });
    await userEvent.click(exportBtn);

    await waitFor(() => {
      expect(attendanceService.exportSessionAttendanceExcel).toHaveBeenCalledWith('sess-123');
    });
  });

  it('switches between workspace tabs: materials, lesson-record, and class history', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Bảng điểm danh buổi học')).toBeInTheDocument();
    });

    // 1. Chuyển sang Tab Tài liệu buổi học
    const materialsTabBtn = screen.getByRole('button', { name: /Tài liệu buổi học/i });
    await userEvent.click(materialsTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Đề cương ôn tập văn học lãng mạn')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tải lên tài liệu mới/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gắn từ thư viện/i })).toBeInTheDocument();
    });

    // 2. Chuyển sang Tab Nhật ký giảng dạy
    const recordTabBtn = screen.getByRole('button', { name: /Nhật ký giảng dạy/i });
    await userEvent.click(recordTabBtn);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue(/Nội dung phân tích vẻ đẹp hình tượng Huấn Cao/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Lưu nhật ký buổi học/i })).toBeInTheDocument();
    });

    // 3. Chuyển sang Tab Học sinh & Lịch sử lớp
    const historyTabBtn = screen.getByRole('button', { name: /Học sinh & Lịch sử lớp/i });
    await userEvent.click(historyTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Tổng số thành viên:/i)).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });
  });
});
