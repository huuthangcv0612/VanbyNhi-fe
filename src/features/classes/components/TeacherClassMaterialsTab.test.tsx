import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeacherClassMaterialsTab } from './TeacherClassMaterialsTab';
import { teacherDocumentsService } from '@/features/documents/services/documents.service';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/features/documents/services/documents.service', () => ({
  teacherDocumentsService: {
    getClassMaterials: vi.fn(),
    getDocuments: vi.fn(),
    shareDocumentToClass: vi.fn(),
    removeMaterial: vi.fn(),
    getMaterialDownloadUrl: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('TeacherClassMaterialsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders class materials list and allows opening share modal', async () => {
    vi.mocked(teacherDocumentsService.getClassMaterials).mockResolvedValueOnce({
      items: [
        {
          id: 'mat-1',
          classId: 'cls-1',
          sessionId: null,
          documentId: 'doc-1',
          uploadedById: 't-1',
          title: 'Đề cương ôn tập HK1',
          description: 'Học sinh tải về làm đề cương',
          type: 'DOCUMENT',
          originalName: 'de-cuong.pdf',
          mimeType: 'application/pdf',
          fileSize: 1048576,
          isPublished: true,
          publishedAt: '2026-01-01',
          order: 0,
          accessStartTime: null,
          accessEndTime: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    vi.mocked(teacherDocumentsService.getDocuments).mockResolvedValueOnce({
      items: [
        {
          id: 'doc-lib-1',
          title: 'Tài liệu trong thư viện',
          description: null,
          originalName: 'lib.pdf',
          storageKey: 'key',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          ownerId: 't-1',
          categoryId: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    renderWithClient(
      <TeacherClassMaterialsTab classId="cls-1" classNameTitle="Lớp 12A1" />,
    );

    await waitFor(() => {
      expect(screen.getByText('Đề cương ôn tập HK1')).toBeInTheDocument();
      expect(screen.getByText('Đã xuất bản')).toBeInTheDocument();
    });

    const shareBtn = screen.getByRole('button', { name: /Chia sẻ từ thư viện/i });
    await userEvent.click(shareBtn);

    expect(
      screen.getByText('Chia sẻ tài liệu từ thư viện vào lớp học'),
    ).toBeInTheDocument();
  });
});
