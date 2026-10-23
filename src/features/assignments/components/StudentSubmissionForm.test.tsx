import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentSubmissionForm } from './StudentSubmissionForm';
import type { AssignmentDetail } from '../types/assignment.types';

const mockShowToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe('StudentSubmissionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseAssignment: AssignmentDetail = {
    id: 'assign-1',
    classId: 'class-1',
    sessionId: null,
    title: 'Bài tập làm văn số 1',
    description: 'Đề bài',
    fileUrls: [],
    dueDate: '2026-11-01T00:00:00.000Z',
    maxScore: 10,
    allowResubmission: true,
    maxAttempts: 3,
    createdById: 'teacher-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    class: {
      id: 'class-1',
      name: 'Lớp Văn 12A',
      classCode: 'VAN12A',
    },
  };

  it('renders form inputs for first-time submission', () => {
    render(
      <StudentSubmissionForm
        assignment={baseAssignment}
        previousAttemptsCount={0}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('Nộp bài lần đầu')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Viết bài làm, đoạn văn/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/docs\.google\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gửi bài nộp/i })).toBeInTheDocument();
  });

  it('rejects submitting completely empty content', () => {
    const onSubmit = vi.fn();
    render(
      <StudentSubmissionForm
        assignment={baseAssignment}
        previousAttemptsCount={0}
        onSubmit={onSubmit}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /Gửi bài nộp/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(/Vui lòng nhập nội dung bài làm, đính kèm tệp hoặc liên kết/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks resubmission when allowResubmission is false and already submitted', () => {
    const noResubmitAssignment: AssignmentDetail = {
      ...baseAssignment,
      allowResubmission: false,
    };

    render(
      <StudentSubmissionForm
        assignment={noResubmitAssignment}
        previousAttemptsCount={1}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Không thể nộp lại bài/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Bài tập này không cho phép nộp lại sau khi đã nộp bài/i),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Viết bài làm/i)).not.toBeInTheDocument();
  });

  it('blocks resubmission when student reaches maxAttempts limit', () => {
    render(
      <StudentSubmissionForm
        assignment={baseAssignment}
        previousAttemptsCount={3} // maxAttempts là 3
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Không thể nộp lại bài/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Bạn đã đạt giới hạn tối đa 3 lần nộp cho bài tập này/i),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Viết bài làm/i)).not.toBeInTheDocument();
  });

  it('submits valid content after confirmation dialog', async () => {
    const onSubmit = vi.fn().mockResolvedValueOnce(undefined);

    render(
      <StudentSubmissionForm
        assignment={baseAssignment}
        previousAttemptsCount={1}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText(/Nộp lại \(Lần 2\)/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Viết bài làm, đoạn văn/i);
    fireEvent.change(textarea, { target: { value: 'Nội dung nộp lại đã chỉnh sửa' } });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận nộp lại bài/i });
    fireEvent.click(submitBtn);

    // Modal xác nhận xuất hiện
    expect(await screen.findByText('Xác nhận nộp lại bài tập')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    // Bấm nút đồng ý trong modal
    const confirmBtn = screen.getByRole('button', { name: 'Đồng ý gửi bài' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        content: 'Nội dung nộp lại đã chỉnh sửa',
        attachmentKeys: undefined,
        externalUrl: undefined,
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Nộp lại bài thành công (Lần nộp thứ 2)'),
        }),
      );
    });
  });
});
