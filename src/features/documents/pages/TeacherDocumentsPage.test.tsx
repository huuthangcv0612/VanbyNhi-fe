import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeacherDocumentsPage } from './TeacherDocumentsPage';
import { teacherDocumentsService } from '../services/documents.service';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/features/classes/services/classes.service', () => ({
  teacherClassesService: {
    getMyClasses: vi.fn().mockResolvedValue({
      items: [
        { id: 'cls-1', name: 'Lớp 12A1 Văn', status: 'ACTIVE', classCode: 'VAN12-A1' },
      ],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    }),
  },
}));

vi.mock('../services/documents.service', () => ({
  teacherDocumentsService: {
    getCategories: vi.fn(),
    getDocuments: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDownloadUrl: vi.fn(),
    uploadDocumentFlow: vi.fn(),
    shareDocumentToClass: vi.fn(),
    assignDocumentsToClasses: vi.fn(),
    getClassMaterials: vi.fn().mockResolvedValue({
      items: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    }),
    removeMaterial: vi.fn(),
    getMaterialDownloadUrl: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TeacherDocumentsPage', () => {
  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Giáo án điện tử',
      description: 'Giáo án các khối',
      parentId: null,
      sortOrder: 0,
      teacherId: 't-1',
      documentCount: 3,
      subCategoryCount: 0,
      children: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const mockDocumentsResponse = {
    items: [
      {
        id: 'doc-1',
        title: 'Chuyên đề Tùy bút Sông Đà',
        description: 'Phân tích phong cách nghệ thuật Nguyễn Tuân',
        originalName: 'song-da.pdf',
        storageKey: 'teachers/key-1',
        mimeType: 'application/pdf',
        sizeBytes: 2048576,
        ownerId: 't-1',
        categoryId: 'cat-1',
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
        category: { id: 'cat-1', name: 'Giáo án điện tử' },
        usedInCount: 2,
      },
    ],
    pagination: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(teacherDocumentsService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(teacherDocumentsService.getDocuments).mockResolvedValue(mockDocumentsResponse);
  });

  it('renders teacher documents page with category tree and documents from API', async () => {
    renderWithClient(<TeacherDocumentsPage />);

    expect(screen.getByText('Quản lý tài liệu giảng dạy')).toBeInTheDocument();
    expect(screen.getByText('Tải tài liệu mới')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Giáo án điện tử').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Chuyên đề Tùy bút Sông Đà')).toBeInTheDocument();
      expect(screen.getByText('song-da.pdf')).toBeInTheDocument();
      expect(screen.getByText('Đang chia sẻ ở 2 lớp/buổi học')).toBeInTheDocument();
    });
  });

  it('filters documents when search text is typed', async () => {
    renderWithClient(<TeacherDocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Chuyên đề Tùy bút Sông Đà')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tiêu đề tài liệu/i);
    await userEvent.type(searchInput, 'Sông Đà');

    expect(teacherDocumentsService.getDocuments).toHaveBeenCalled();
  });

  it('opens upload modal when clicking "Tải tài liệu mới"', async () => {
    renderWithClient(<TeacherDocumentsPage />);

    const uploadBtn = screen.getByRole('button', { name: /Tải tài liệu mới/i });
    await userEvent.click(uploadBtn);

    expect(
      screen.getByText('Tải tài liệu mới lên thư viện'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Kéo thả file vào đây/i),
    ).toBeInTheDocument();
  });

  it('opens category creation modal when clicking "Tạo thư mục"', async () => {
    renderWithClient(<TeacherDocumentsPage />);

    const createFolderBtn = await screen.findByRole('button', { name: /Tạo thư mục/i });
    await userEvent.click(createFolderBtn);

    expect(screen.getByText('Tạo danh mục mới')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên danh mục/i)).toBeInTheDocument();
  });

  it('selects a document and opens assign modal via "Cấp quyền"', async () => {
    const user = userEvent.setup();
    renderWithClient(<TeacherDocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Chuyên đề Tùy bút Sông Đà')).toBeInTheDocument();
    });

    const assignBtn = screen.getByTitle('Cấp quyền cho lớp học');
    await user.click(assignBtn);

    await waitFor(() => {
      expect(screen.getByText('Cấp quyền tài liệu cho lớp học')).toBeInTheDocument();
    });
  });

  it('switches between "Thư viện tài liệu" and "Đã cấp quyền theo lớp"', async () => {
    const user = userEvent.setup();
    renderWithClient(<TeacherDocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Đã cấp quyền theo lớp')).toBeInTheDocument();
    });

    const assignedTab = screen.getByText('Đã cấp quyền theo lớp');
    await user.click(assignedTab);

    await waitFor(() => {
      expect(screen.getByText(/Chọn lớp học để xem tài liệu đã cấp quyền/i)).toBeInTheDocument();
    });
  });
});

