import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssignDocumentsModal } from './AssignDocumentsModal';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import { teacherDocumentsService } from '../services/documents.service';
import type { DocumentItem } from '../types/document.types';

vi.mock('@/features/classes/services/classes.service', () => ({
  teacherClassesService: {
    getMyClasses: vi.fn(),
  },
}));

vi.mock('../services/documents.service', () => ({
  teacherDocumentsService: {
    assignDocumentsToClasses: vi.fn(),
  },
}));

function renderModal(
  props: React.ComponentProps<typeof AssignDocumentsModal>,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AssignDocumentsModal {...props} />
    </QueryClientProvider>,
  );
}

describe('AssignDocumentsModal', () => {
  const mockDocuments: DocumentItem[] = [
    {
      id: 'doc-1',
      title: 'Đề cương ôn tập THPT',
      description: null,
      originalName: 'de-cuong.pdf',
      storageKey: 'key-1',
      mimeType: 'application/pdf',
      sizeBytes: 1048576,
      ownerId: 't-1',
      categoryId: null,
      createdAt: '2026-10-15',
      updatedAt: '2026-10-15',
    },
    {
      id: 'doc-2',
      title: 'Văn mẫu NLXH',
      description: null,
      originalName: 'van-mau.docx',
      storageKey: 'key-2',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 524288,
      ownerId: 't-1',
      categoryId: null,
      createdAt: '2026-10-15',
      updatedAt: '2026-10-15',
    },
  ];

  const mockClasses = {
    items: [
      {
        id: 'cls-1',
        name: 'Lớp 12A1 Văn',
        classCode: 'VAN12-A1',
        status: 'ACTIVE' as const,
        activeStudentCount: 25,
      },
      {
        id: 'cls-2',
        name: 'Lớp 12A2 Chuyên Văn',
        classCode: 'VAN12-A2',
        status: 'ACTIVE' as const,
        activeStudentCount: 28,
      },
    ],
    pagination: { total: 2, page: 1, limit: 100, totalPages: 1 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(teacherClassesService.getMyClasses).mockResolvedValue(mockClasses as any);
  });

  it('renders modal with selected documents and fetched classes', async () => {
    renderModal({
      isOpen: true,
      onClose: vi.fn(),
      documents: mockDocuments,
      onSuccess: vi.fn(),
    });

    expect(screen.getByText('Cấp quyền tài liệu cho lớp học')).toBeInTheDocument();
    expect(screen.getByText('Đề cương ôn tập THPT')).toBeInTheDocument();
    expect(screen.getByText('Văn mẫu NLXH')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Lớp 12A1 Văn')).toBeInTheDocument();
      expect(screen.getByText('Lớp 12A2 Chuyên Văn')).toBeInTheDocument();
    });
  });

  it('selects multiple classes and submits batch assignment', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.mocked(teacherDocumentsService.assignDocumentsToClasses).mockResolvedValueOnce({
      message: 'Cấp quyền thành công',
      assignedCount: 4,
      materials: [],
    });

    renderModal({
      isOpen: true,
      onClose: vi.fn(),
      documents: mockDocuments,
      onSuccess,
    });

    await waitFor(() => {
      expect(screen.getByText('Lớp 12A1 Văn')).toBeInTheDocument();
    });

    // Click both classes
    await user.click(screen.getByText('Lớp 12A1 Văn'));
    await user.click(screen.getByText('Lớp 12A2 Chuyên Văn'));

    // Submit button should now say "Cấp quyền cho 2 lớp"
    const submitBtn = screen.getByRole('button', { name: /Cấp quyền cho 2 lớp/i });
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);

    await waitFor(() => {
      expect(teacherDocumentsService.assignDocumentsToClasses).toHaveBeenCalledWith({
        documentIds: ['doc-1', 'doc-2'],
        classIds: ['cls-1', 'cls-2'],
        isPublished: true,
        accessStartTime: undefined,
        accessEndTime: undefined,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
