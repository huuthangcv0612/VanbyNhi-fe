import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DocumentEditorPage } from './DocumentEditorPage';
import { teacherDocumentsService } from '../services/documents.service';

vi.mock('../services/documents.service', () => ({
  teacherDocumentsService: {
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    updateContent: vi.fn(),
    getVersions: vi.fn(),
    restoreVersion: vi.fn(),
    exportDocument: vi.fn(),
    getExportStatus: vi.fn(),
  },
}));

vi.mock('@/lib/storage', () => ({
  storage: {
    getUser: vi.fn().mockReturnValue({ id: 't-1', fullName: 'Cô Nhị' }),
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    showToast: vi.fn(),
  }),
}));

describe('DocumentEditorPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderWithRouter = (initialEntries: string[]) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/teacher/documents/:id/edit" element={<DocumentEditorPage />} />
            <Route path="/teacher/documents/new" element={<DocumentEditorPage />} />
            <Route path="/teacher/documents" element={<div>Thư viện tài liệu</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders existing document with title, revision and ready status', async () => {
    vi.mocked(teacherDocumentsService.getDocument).mockResolvedValueOnce({
      id: 'doc-123',
      title: 'Giáo án Chiếc thuyền ngoài xa',
      description: null,
      revision: 4,
      mimeType: 'application/vnd.tiptap+json',
      type: 'STRUCTURED_NOTE',
      status: 'PUBLISHED',
      sizeBytes: 1500,
      ownerId: 't-1',
      categoryId: null,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phân tích nhân vật' }] }],
      },
      createdAt: '2026-10-26T08:00:00.000Z',
      updatedAt: '2026-10-26T08:30:00.000Z',
    });

    renderWithRouter(['/teacher/documents/doc-123/edit']);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Giáo án Chiếc thuyền ngoài xa')).toBeInTheDocument();
      expect(screen.getByText('rev 4')).toBeInTheDocument();
      expect(screen.getByText('Sẵn sàng')).toBeInTheDocument();
    });
  });

  it('triggers immediate save when clicking "Lưu" button', async () => {
    const user = userEvent.setup();
    vi.mocked(teacherDocumentsService.getDocument).mockResolvedValueOnce({
      id: 'doc-123',
      title: 'Giáo án Tây Tiến',
      description: null,
      revision: 1,
      mimeType: 'application/vnd.tiptap+json',
      type: 'STRUCTURED_NOTE',
      status: 'DRAFT',
      sizeBytes: 100,
      ownerId: 't-1',
      categoryId: null,
      content: { type: 'doc', content: [] },
      createdAt: '2026-10-26',
      updatedAt: '2026-10-26',
    });

    vi.mocked(teacherDocumentsService.updateContent).mockResolvedValueOnce({
      message: 'Lưu thành công',
      revision: 2,
      updatedAt: '2026-10-26T09:00:00.000Z',
    });

    renderWithRouter(['/teacher/documents/doc-123/edit']);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Giáo án Tây Tiến')).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /^Lưu$/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(teacherDocumentsService.updateContent).toHaveBeenCalledWith(
        'doc-123',
        expect.objectContaining({
          expectedRevision: 1,
        }),
      );
    });
  });

  it('opens VersionHistoryDrawer when clicking "Lịch sử"', async () => {
    const user = userEvent.setup();
    vi.mocked(teacherDocumentsService.getDocument).mockResolvedValueOnce({
      id: 'doc-123',
      title: 'Giáo án Tây Tiến',
      description: null,
      revision: 2,
      mimeType: 'application/vnd.tiptap+json',
      type: 'STRUCTURED_NOTE',
      status: 'DRAFT',
      sizeBytes: 100,
      ownerId: 't-1',
      categoryId: null,
      content: { type: 'doc', content: [] },
      createdAt: '2026-10-26',
      updatedAt: '2026-10-26',
    });

    vi.mocked(teacherDocumentsService.getVersions).mockResolvedValueOnce({
      items: [
        {
          id: 'v-1',
          documentId: 'doc-123',
          revision: 1,
          title: 'Khởi tạo',
          reason: 'Khởi tạo tài liệu',
          createdAt: '2026-10-26',
          actor: { id: 't-1', fullName: 'Cô Nhị', role: 'TEACHER' },
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    renderWithRouter(['/teacher/documents/doc-123/edit']);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Giáo án Tây Tiến')).toBeInTheDocument();
    });

    const historyBtn = screen.getByRole('button', { name: /Lịch sử/i });
    await user.click(historyBtn);

    await waitFor(() => {
      expect(screen.getByText('Lịch sử phiên bản')).toBeInTheDocument();
      expect(screen.getByText('Khởi tạo tài liệu')).toBeInTheDocument();
    });
  });

  it('opens ExportModal when clicking "Xuất tệp"', async () => {
    const user = userEvent.setup();
    vi.mocked(teacherDocumentsService.getDocument).mockResolvedValueOnce({
      id: 'doc-123',
      title: 'Giáo án Tây Tiến',
      description: null,
      revision: 2,
      mimeType: 'application/vnd.tiptap+json',
      type: 'STRUCTURED_NOTE',
      status: 'DRAFT',
      sizeBytes: 100,
      ownerId: 't-1',
      categoryId: null,
      content: { type: 'doc', content: [] },
      createdAt: '2026-10-26',
      updatedAt: '2026-10-26',
    });

    renderWithRouter(['/teacher/documents/doc-123/edit']);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Giáo án Tây Tiến')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Xuất tệp/i });
    await user.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText('Xuất bản tài liệu (Export Document)')).toBeInTheDocument();
    });
  });
});
