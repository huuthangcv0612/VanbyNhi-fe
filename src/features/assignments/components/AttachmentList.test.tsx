import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AttachmentList } from './AttachmentList';
import { assignmentsService } from '../services/assignments.service';
import type { AttachmentItem } from '../types/assignment.types';

const mockShowToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('../services/assignments.service', () => ({
  assignmentsService: {
    getAttachmentDownloadUrl: vi.fn(),
  },
}));

describe('AttachmentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAttachment: AttachmentItem = {
    id: 'att-1',
    storageKey: 'assignments/att-1',
    originalName: 'de_thi.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024 * 1024 * 2, // 2MB
    uploadedById: 'user-1',
    retentionExpiresAt: null,
    isKeepForever: false,
    cleanupStatus: 'PENDING',
    cleanedAt: null,
    createdAt: new Date().toISOString(),
  };

  it('renders nothing when attachments array is empty', () => {
    const { container } = render(<AttachmentList attachments={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders attachment item with name, size and download button', () => {
    render(<AttachmentList attachments={[mockAttachment]} />);
    expect(screen.getByText('de_thi.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tải xuống/i })).toBeInTheDocument();
  });

  it('downloads attachment when clicking download button', async () => {
    (assignmentsService.getAttachmentDownloadUrl as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      downloadUrl: 'https://r2.example.com/download/de_thi.pdf',
      expiresInSeconds: 300,
      originalName: 'de_thi.pdf',
      mimeType: 'application/pdf',
    });

    render(<AttachmentList attachments={[mockAttachment]} />);
    const downloadBtn = screen.getByRole('button', { name: /Tải xuống/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(assignmentsService.getAttachmentDownloadUrl).toHaveBeenCalledWith('att-1');
    });
  });

  it('displays friendly warning when backend reports attachment has been cleaned', async () => {
    const error = new Error('Tệp đính kèm đã hết hạn lưu trữ và được dọn dẹp theo chính sách hệ thống');
    (assignmentsService.getAttachmentDownloadUrl as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

    render(<AttachmentList attachments={[mockAttachment]} />);
    const downloadBtn = screen.getByRole('button', { name: /Tải xuống/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('hết hạn lưu trữ'),
        }),
      );
    });

    // Sau khi báo lỗi dọn dẹp, nút tải xuống bị vô hiệu hóa, không gọi lại API
    expect(downloadBtn).toBeDisabled();
    fireEvent.click(downloadBtn);
    expect(assignmentsService.getAttachmentDownloadUrl).toHaveBeenCalledTimes(1);
  });

  it('renders cleaned state directly when cleanupStatus is CLEANED and prevents downloading', () => {
    const cleanedAttachment: AttachmentItem = {
      ...mockAttachment,
      id: 'att-cleaned',
      cleanupStatus: 'CLEANED',
    };

    render(<AttachmentList attachments={[cleanedAttachment]} />);
    expect(screen.getByText(/Đã hết hạn lưu trữ/i)).toBeInTheDocument();
    const downloadBtn = screen.getByRole('button', { name: /Tải xuống/i });
    expect(downloadBtn).toBeDisabled();

    fireEvent.click(downloadBtn);
    expect(assignmentsService.getAttachmentDownloadUrl).not.toHaveBeenCalled();
  });

  it('shows keep forever toggle button when canToggleKeepForever is true', () => {
    const onToggle = vi.fn();
    render(
      <AttachmentList
        attachments={[mockAttachment]}
        canToggleKeepForever={true}
        onToggleKeepForever={onToggle}
      />,
    );

    const toggleBtn = screen.getByRole('button', { name: /Giữ tệp/i });
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledWith('att-1', true);
  });
});
