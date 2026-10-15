import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentClassMaterialsTab } from './StudentClassMaterialsTab';
import { studentDocumentsService } from '@/features/documents/services/documents.service';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/features/documents/services/documents.service', () => ({
  studentDocumentsService: {
    getClassMaterials: vi.fn(),
    getMaterialDownloadUrl: vi.fn(),
  },
}));

function renderTab(classId = 'cls-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StudentClassMaterialsTab classId={classId} />
    </QueryClientProvider>,
  );
}

describe('StudentClassMaterialsTab', () => {
  const mockMaterialsResponse = {
    items: [
      {
        id: 'mat-1',
        classId: 'cls-1',
        sessionId: null,
        documentId: 'doc-1',
        uploadedById: 't-1',
        title: 'Chuyên đề Nghị luận xã hội',
        description: 'Tài liệu hướng dẫn viết bài văn đạt điểm cao',
        type: 'DOCUMENT',
        originalName: 'nlxh.pdf',
        mimeType: 'application/pdf',
        fileSize: 1048576,
        isPublished: true,
        order: 0,
        createdAt: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ],
    pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(studentDocumentsService.getClassMaterials).mockResolvedValue(mockMaterialsResponse as any);
  });

  it('renders materials list for the class', async () => {
    renderTab('cls-1');

    await waitFor(() => {
      expect(screen.getByText('Chuyên đề Nghị luận xã hội')).toBeInTheDocument();
      expect(screen.getByText('nlxh.pdf')).toBeInTheDocument();
      expect(screen.getByText(/1 MB/i)).toBeInTheDocument();
    });
  });

  it('triggers download when clicking "Tải về"', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    vi.mocked(studentDocumentsService.getMaterialDownloadUrl).mockResolvedValueOnce({
      downloadUrl: 'https://r2.cloudflarestorage.com/download-url',
      expiresInSeconds: 300,
      title: 'Chuyên đề Nghị luận xã hội',
      originalName: 'nlxh.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1048576,
    });

    renderTab('cls-1');

    await waitFor(() => {
      expect(screen.getByText('Chuyên đề Nghị luận xã hội')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Tải về/i });
    await user.click(downloadBtn);

    await waitFor(() => {
      expect(studentDocumentsService.getMaterialDownloadUrl).toHaveBeenCalledWith('mat-1');
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://r2.cloudflarestorage.com/download-url',
        '_blank',
        'noopener,noreferrer',
      );
    });

    windowOpenSpy.mockRestore();
  });
});
