import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportModal } from './ExportModal';
import { teacherDocumentsService } from '../../services/documents.service';

vi.mock('../../services/documents.service', () => ({
  teacherDocumentsService: {
    exportDocument: vi.fn(),
    getExportStatus: vi.fn(),
  },
}));

describe('ExportModal', () => {
  const mockOnClose = vi.fn();
  const originalOpen = window.open;

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  it('renders modal with format options (PDF and DOCX)', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        documentId="doc-123"
        documentTitle="Giáo án Tây Tiến"
        currentRevision={3}
      />,
    );

    expect(screen.getByText('Xuất bản tài liệu (Export Document)')).toBeInTheDocument();
    expect(screen.getByText('Adobe PDF (.pdf)')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Word (.docx)')).toBeInTheDocument();
  });

  it('handles synchronous export response (status COMPLETED)', async () => {
    const user = userEvent.setup();
    vi.mocked(teacherDocumentsService.exportDocument).mockResolvedValueOnce({
      jobId: 'job-1',
      status: 'COMPLETED',
      format: 'PDF',
      revision: 3,
      downloadUrl: 'https://r2.storage/export.pdf',
      expiresInSeconds: 300,
    });

    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        documentId="doc-123"
        documentTitle="Giáo án Tây Tiến"
        currentRevision={3}
      />,
    );

    const startBtn = screen.getByRole('button', { name: /Bắt đầu xuất tệp/i });
    await user.click(startBtn);

    await waitFor(() => {
      expect(teacherDocumentsService.exportDocument).toHaveBeenCalledWith('doc-123', {
        format: 'PDF',
      });
      expect(screen.getByText(/Xuất tệp PDF thành công!/i)).toBeInTheDocument();
      expect(window.open).toHaveBeenCalledWith(
        'https://r2.storage/export.pdf',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  it('handles asynchronous export with polling until COMPLETED', async () => {
    const user = userEvent.setup();
    vi.mocked(teacherDocumentsService.exportDocument).mockResolvedValueOnce({
      jobId: 'job-async',
      status: 'PROCESSING',
      format: 'DOCX',
      revision: 3,
    });

    vi.mocked(teacherDocumentsService.getExportStatus).mockResolvedValueOnce({
      jobId: 'job-async',
      status: 'COMPLETED',
      format: 'DOCX',
      revision: 3,
      downloadUrl: 'https://r2.storage/export.docx',
      expiresInSeconds: 300,
    });

    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        documentId="doc-123"
        documentTitle="Giáo án Tây Tiến"
        currentRevision={3}
        pollIntervalMs={10}
      />,
    );

    // Select DOCX
    const docxOption = screen.getByText('Microsoft Word (.docx)');
    await user.click(docxOption);

    const startBtn = screen.getByRole('button', { name: /Bắt đầu xuất tệp/i });
    await user.click(startBtn);

    await waitFor(() => {
      expect(teacherDocumentsService.exportDocument).toHaveBeenCalledWith('doc-123', {
        format: 'DOCX',
      });
    });

    // Wait for polling resolution
    await waitFor(() => {
      expect(teacherDocumentsService.getExportStatus).toHaveBeenCalledWith(
        'doc-123',
        'job-async',
      );
      expect(screen.getByText(/Xuất tệp DOCX thành công!/i)).toBeInTheDocument();
    });
  });

  it('displays error message when export fails', async () => {
    const user = userEvent.setup();
    vi.mocked(teacherDocumentsService.exportDocument).mockResolvedValueOnce({
      jobId: 'job-err',
      status: 'FAILED',
      format: 'PDF',
      revision: 3,
      errorMessage: 'Lỗi bộ nhớ máy chủ khi kết xuất',
    });

    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        documentId="doc-123"
        documentTitle="Giáo án Tây Tiến"
        currentRevision={3}
      />,
    );

    const startBtn = screen.getByRole('button', { name: /Bắt đầu xuất tệp/i });
    await user.click(startBtn);

    await waitFor(() => {
      expect(screen.getByText('Lỗi bộ nhớ máy chủ khi kết xuất')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Thử lại/i })).toBeInTheDocument();
    });
  });
});
