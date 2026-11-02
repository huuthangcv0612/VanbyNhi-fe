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
      expect(screen.getByText('Sẵn sàng')).toBeInTheDocument();
      expect(screen.getByText('Phân tích nhân vật')).toBeInTheDocument();
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

  it('shows error state and prevents autosave when content is null', async () => {
    vi.mocked(teacherDocumentsService.getDocument).mockResolvedValueOnce({
      id: 'doc-null',
      title: 'Tài liệu lỗi R2',
      description: null,
      revision: 1,
      mimeType: 'application/vnd.tiptap+json',
      type: 'STRUCTURED_NOTE',
      status: 'PUBLISHED',
      sizeBytes: 0,
      ownerId: 't-1',
      categoryId: null,
      content: null,
      createdAt: '2026-10-26',
      updatedAt: '2026-10-26',
    });

    renderWithRouter(['/teacher/documents/doc-null/edit']);

    await waitFor(() => {
      expect(screen.getByText('Không thể tải nội dung văn bản')).toBeInTheDocument();
      expect(screen.getByText(/Để bảo vệ dữ liệu gốc và tránh ghi đè/i)).toBeInTheDocument();
    });

    // Editor không được mount và autosave không được kích hoạt
    expect(screen.queryByText('Sẵn sàng')).not.toBeInTheDocument();
    expect(teacherDocumentsService.updateContent).not.toHaveBeenCalled();
  });

  it('shows error state when API fails and does not render editor or autosave', async () => {
    vi.mocked(teacherDocumentsService.getDocument).mockRejectedValueOnce(
      new Error('Mạng bị gián đoạn'),
    );

    renderWithRouter(['/teacher/documents/doc-err/edit']);

    await waitFor(() => {
      expect(screen.getByText('Không thể tải nội dung tài liệu')).toBeInTheDocument();
      expect(screen.getByText('Mạng bị gián đoạn')).toBeInTheDocument();
    });

    expect(screen.queryByText('Sẵn sàng')).not.toBeInTheDocument();
    expect(teacherDocumentsService.updateContent).not.toHaveBeenCalled();
  });

  it('shows error state when content is invalid Tiptap JSON schema', async () => {
    vi.mocked(teacherDocumentsService.getDocument).mockResolvedValueOnce({
      id: 'doc-invalid',
      title: 'Tài liệu JSON hỏng',
      description: null,
      revision: 1,
      mimeType: 'application/vnd.tiptap+json',
      type: 'STRUCTURED_NOTE',
      status: 'PUBLISHED',
      sizeBytes: 50,
      ownerId: 't-1',
      categoryId: null,
      content: { invalidKey: 'not a doc' } as any,
      createdAt: '2026-10-26',
      updatedAt: '2026-10-26',
    });

    renderWithRouter(['/teacher/documents/doc-invalid/edit']);

    await waitFor(() => {
      expect(screen.getByText('Định dạng dữ liệu không hợp lệ')).toBeInTheDocument();
    });

    expect(teacherDocumentsService.updateContent).not.toHaveBeenCalled();
  });

  it('does not autosave on mount while loading initial content', async () => {
    vi.mocked(teacherDocumentsService.getDocument).mockResolvedValueOnce({
      id: 'doc-no-autosave-mount',
      title: 'Tài liệu kiểm tra autosave',
      description: null,
      revision: 2,
      mimeType: 'application/vnd.tiptap+json',
      type: 'STRUCTURED_NOTE',
      status: 'PUBLISHED',
      sizeBytes: 120,
      ownerId: 't-1',
      categoryId: null,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nội dung nguyên bản' }] }],
      },
      createdAt: '2026-10-26',
      updatedAt: '2026-10-26',
    });

    renderWithRouter(['/teacher/documents/doc-no-autosave-mount/edit']);

    await waitFor(() => {
      expect(screen.getByText('Nội dung nguyên bản')).toBeInTheDocument();
      expect(screen.getByText('Sẵn sàng')).toBeInTheDocument();
    });

    // Không được gọi updateContent trong lúc mount và nạp initialContent
    expect(teacherDocumentsService.updateContent).not.toHaveBeenCalled();
  });

  it('handles slow API with skeleton before content is ready', async () => {
    let resolveDoc!: (val: any) => void;
    const slowPromise = new Promise((resolve) => {
      resolveDoc = resolve;
    });

    vi.mocked(teacherDocumentsService.getDocument).mockReturnValueOnce(slowPromise as any);

    renderWithRouter(['/teacher/documents/doc-slow/edit']);

    // Trong khi API chưa trả về, không có editor hoặc nút Lưu
    expect(screen.queryByText('Sẵn sàng')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Lưu$/i })).not.toBeInTheDocument();

    // Giả lập API phản hồi thành công sau độ trễ
    resolveDoc({
      id: 'doc-slow',
      title: 'Tài liệu tải chậm',
      description: null,
      revision: 1,
      mimeType: 'application/vnd.tiptap+json',
      type: 'STRUCTURED_NOTE',
      status: 'PUBLISHED',
      sizeBytes: 150,
      ownerId: 't-1',
      categoryId: null,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nội dung sau khi tải chậm' }] }],
      },
      createdAt: '2026-10-26',
      updatedAt: '2026-10-26',
    });

    await waitFor(() => {
      expect(screen.getByText('Nội dung sau khi tải chậm')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tài liệu tải chậm')).toBeInTheDocument();
      expect(screen.getByText('Sẵn sàng')).toBeInTheDocument();
    });
  });
});
