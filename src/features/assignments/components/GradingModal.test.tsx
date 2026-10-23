import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GradingModal } from './GradingModal';
import type { AssignmentSubmissionItem } from '../types/assignment.types';

const mockShowToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe('GradingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSubmission: AssignmentSubmissionItem = {
    id: 'sub-1',
    assignmentId: 'assign-1',
    studentId: 'student-1',
    attemptNumber: 1,
    content: 'Bài văn phân tích nhân vật',
    fileUrls: [],
    externalUrl: null,
    isLate: false,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
    score: null,
    feedback: null,
    student: {
      id: 'student-1',
      fullName: 'Nguyễn Văn An',
      phone: '0901234567',
    },
    attachments: [],
    review: null,
  };

  it('renders student info, submission text, and score inputs when open', () => {
    render(
      <GradingModal
        isOpen={true}
        onClose={vi.fn()}
        submission={mockSubmission}
        maxScore={10}
        onSaveReview={vi.fn()}
      />,
    );

    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Bài văn phân tích nhân vật')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0 - 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu bản nháp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trả bài cho học sinh/i })).toBeInTheDocument();
  });

  it('rejects scores exceeding maxScore', async () => {
    const onSaveReview = vi.fn();
    render(
      <GradingModal
        isOpen={true}
        onClose={vi.fn()}
        submission={mockSubmission}
        maxScore={10}
        onSaveReview={onSaveReview}
      />,
    );

    const scoreInput = screen.getByPlaceholderText('0 - 10');
    fireEvent.change(scoreInput, { target: { value: '15' } });

    const draftBtn = screen.getByRole('button', { name: /Lưu bản nháp/i });
    fireEvent.click(draftBtn);

    expect(await screen.findByText(/Điểm số phải là số hợp lệ từ 0 đến 10/i)).toBeInTheDocument();
    expect(onSaveReview).not.toHaveBeenCalled();
  });

  it('saves draft review with score and feedback when clicking Lưu bản nháp', async () => {
    const onSaveReview = vi.fn().mockResolvedValueOnce(undefined);
    const onClose = vi.fn();

    render(
      <GradingModal
        isOpen={true}
        onClose={onClose}
        submission={mockSubmission}
        maxScore={10}
        onSaveReview={onSaveReview}
      />,
    );

    const scoreInput = screen.getByPlaceholderText('0 - 10');
    fireEvent.change(scoreInput, { target: { value: '8.5' } });

    const feedbackInput = screen.getByPlaceholderText(/Ghi nhận xét ưu điểm/i);
    fireEvent.change(feedbackInput, { target: { value: 'Phân tích rất tốt' } });

    const draftBtn = screen.getByRole('button', { name: /Lưu bản nháp/i });
    fireEvent.click(draftBtn);

    await waitFor(() => {
      expect(onSaveReview).toHaveBeenCalledWith({
        score: 8.5,
        feedback: 'Phân tích rất tốt',
        status: 'DRAFT',
        attachmentKeys: undefined,
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Đã lưu bản nháp'),
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('prompts confirmation modal before publicly returning review', async () => {
    const onSaveReview = vi.fn().mockResolvedValueOnce(undefined);

    render(
      <GradingModal
        isOpen={true}
        onClose={vi.fn()}
        submission={mockSubmission}
        maxScore={10}
        onSaveReview={onSaveReview}
      />,
    );

    const scoreInput = screen.getByPlaceholderText('0 - 10');
    fireEvent.change(scoreInput, { target: { value: '9' } });

    const returnBtn = screen.getByRole('button', { name: /Trả bài cho học sinh/i });
    fireEvent.click(returnBtn);

    // Modal xác nhận xuất hiện
    expect(await screen.findByText(/Xác nhận trả bài cho học sinh/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Bạn có chắc chắn muốn công khai kết quả và trả bài cho học sinh/i),
    ).toBeInTheDocument();

    // Chưa gọi onSaveReview khi chưa ấn xác nhận
    expect(onSaveReview).not.toHaveBeenCalled();

    // Bấm nút xác nhận trong ConfirmModal
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận trả bài' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onSaveReview).toHaveBeenCalledWith({
        score: 9,
        feedback: undefined,
        status: 'RETURNED',
        attachmentKeys: undefined,
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Đã trả bài thành công'),
        }),
      );
    });
  });
});
