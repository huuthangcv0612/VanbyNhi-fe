import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StudentAssignmentDetailPage } from './StudentAssignmentDetailPage';
import * as hooks from '../hooks/useAssignments';
import type { AssignmentDetail, AssignmentSubmissionItem } from '../types/assignment.types';

vi.mock('../hooks/useAssignments', () => ({
  useAssignmentDetail: vi.fn(),
  useAssignmentSubmissions: vi.fn(),
  useSubmitAssignment: vi.fn(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const mockAssignment: AssignmentDetail = {
  id: 'asg-1',
  classId: 'cls-1',
  sessionId: null,
  title: 'Phân tích nhân vật Huấn Cao trong Chữ người tử tù',
  description: 'Hãy phân tích vẻ đẹp thiên lương và khí phách của nhân vật Huấn Cao.',
  dueDate: '2026-12-31T23:59:59.000Z',
  maxScore: 10,
  allowResubmission: true,
  maxAttempts: 3,
  createdById: 'tch-1',
  fileUrls: [],
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  class: {
    id: 'cls-1',
    name: 'Văn 12 Nâng Cao',
    classCode: 'VAN12-NC',
    teacherId: 'tch-1',
  },
  attachments: [],
};

describe('StudentAssignmentDetailPage', () => {
  const mockSubmitMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooks.useSubmitAssignment).mockReturnValue(
      mockSubmitMutation as unknown as ReturnType<typeof hooks.useSubmitAssignment>
    );
  });

  it('hides score and feedback when submission review is in DRAFT state', () => {
    const draftSubmission: AssignmentSubmissionItem = {
      id: 'sub-1',
      assignmentId: 'asg-1',
      studentId: 'std-1',
      attemptNumber: 1,
      content: 'Bài làm văn của em...',
      fileUrls: [],
      externalUrl: null,
      status: 'SUBMITTED',
      isLate: false,
      submittedAt: '2026-03-02T10:00:00.000Z',
      score: 9.5, // Even if draft score is present on object
      feedback: 'Lời phê tuyệt mật nháp',
      review: {
        id: 'rev-1',
        score: 9.5,
        feedback: 'Lời phê tuyệt mật nháp',
        status: 'DRAFT', // DRAFT state!
        returnedAt: null,
      },
      attachments: [],
    };

    vi.mocked(hooks.useAssignmentDetail).mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useAssignmentDetail>);

    vi.mocked(hooks.useAssignmentSubmissions).mockReturnValue({
      data: [draftSubmission],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useAssignmentSubmissions>);

    render(
      <MemoryRouter initialEntries={['/student/assignments/asg-1']}>
        <Routes>
          <Route
            path="/student/assignments/:assignmentId"
            element={<StudentAssignmentDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    // Verify title and prompt are rendered
    expect(screen.getByText('Phân tích nhân vật Huấn Cao trong Chữ người tử tù')).toBeInTheDocument();

    // Verify DRAFT score and feedback are NOT rendered
    expect(screen.queryByText('9.5')).not.toBeInTheDocument();
    expect(screen.queryByText('Lời phê tuyệt mật nháp')).not.toBeInTheDocument();

    // Verify pending review state is displayed
    expect(screen.getByText('Bài làm đang chờ giáo viên chấm bài')).toBeInTheDocument();
  });

  it('renders score and feedback when submission review is in RETURNED state', () => {
    const returnedSubmission: AssignmentSubmissionItem = {
      id: 'sub-2',
      assignmentId: 'asg-1',
      studentId: 'std-1',
      attemptNumber: 1,
      content: 'Bài làm văn chính thức của em...',
      fileUrls: [],
      externalUrl: null,
      status: 'RETURNED',
      isLate: false,
      submittedAt: '2026-03-02T10:00:00.000Z',
      score: 9.0,
      feedback: 'Bài viết sắc sảo, dẫn chứng thuyết phục!',
      review: {
        id: 'rev-2',
        score: 9.0,
        feedback: 'Bài viết sắc sảo, dẫn chứng thuyết phục!',
        status: 'RETURNED', // RETURNED state!
        returnedAt: '2026-03-03T15:00:00.000Z',
      },
      attachments: [],
    };

    vi.mocked(hooks.useAssignmentDetail).mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useAssignmentDetail>);

    vi.mocked(hooks.useAssignmentSubmissions).mockReturnValue({
      data: [returnedSubmission],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useAssignmentSubmissions>);

    render(
      <MemoryRouter initialEntries={['/student/assignments/asg-1']}>
        <Routes>
          <Route
            path="/student/assignments/:assignmentId"
            element={<StudentAssignmentDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    // Score and feedback MUST be rendered
    expect(screen.getByText('Bài viết sắc sảo, dẫn chứng thuyết phục!')).toBeInTheDocument();
    expect(screen.getByText(/Điểm bài thi/)).toBeInTheDocument();
    expect(screen.getByText(/\/ 10 điểm/)).toBeInTheDocument();
  });

  it('renders cleaned attachment notification without crashing', () => {
    const assignmentWithCleanedAttachment: AssignmentDetail = {
      ...mockAssignment,
      attachments: [
        {
          id: 'att-cleaned',
          originalName: 'de_thi_cu.pdf',
          sizeBytes: 1024 * 1024,
          mimeType: 'application/pdf',
          storageKey: 'assignments/de_thi_cu.pdf',
          uploadedById: 'tch-1',
          retentionExpiresAt: null,
          isKeepForever: false,
          cleanupStatus: 'CLEANED',
          cleanedAt: '2025-01-02T00:00:00.000Z',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    };

    vi.mocked(hooks.useAssignmentDetail).mockReturnValue({
      data: assignmentWithCleanedAttachment,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useAssignmentDetail>);

    vi.mocked(hooks.useAssignmentSubmissions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useAssignmentSubmissions>);

    render(
      <MemoryRouter initialEntries={['/student/assignments/asg-1']}>
        <Routes>
          <Route
            path="/student/assignments/:assignmentId"
            element={<StudentAssignmentDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    // Verify filename is shown with expired notice and disabled download button
    expect(screen.getByText('de_thi_cu.pdf')).toBeInTheDocument();
    expect(screen.getByText('Đã hết hạn lưu trữ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tải xuống/i })).toBeDisabled();
  });
});
