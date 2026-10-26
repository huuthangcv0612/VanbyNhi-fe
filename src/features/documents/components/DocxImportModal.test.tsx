import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocxImportModal } from './DocxImportModal';
import { teacherDocumentsService } from '../services/documents.service';

vi.mock('../services/documents.service', () => ({
  teacherDocumentsService: {
    importDocxFlow: vi.fn(),
  },
}));

describe('DocxImportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Ngữ Văn 12',
      description: null,
      parentId: null,
      sortOrder: 0,
      teacherId: 't-1',
      documentCount: 0,
      subCategoryCount: 0,
      children: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title and drag-and-drop zone', () => {
    render(
      <DocxImportModal
        isOpen={true}
        onClose={mockOnClose}
        categoriesTree={mockCategories}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByText('Nhập tài liệu từ Microsoft Word (.docx)')).toBeInTheDocument();
    expect(screen.getByText(/Kéo thả file \.docx vào đây/i)).toBeInTheDocument();
  });

  it('rejects files that do not have .docx extension', async () => {
    render(
      <DocxImportModal
        isOpen={true}
        onClose={mockOnClose}
        categoriesTree={mockCategories}
        onSuccess={mockOnSuccess}
      />,
    );

    const file = new File(['dummy content'], 'tailieu.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(
      screen.getByText('Vui lòng chỉ chọn tệp văn bản Word định dạng .docx'),
    ).toBeInTheDocument();
  });

  it('rejects files larger than 25MB', async () => {
    render(
      <DocxImportModal
        isOpen={true}
        onClose={mockOnClose}
        categoriesTree={mockCategories}
        onSuccess={mockOnSuccess}
      />,
    );

    // Create a dummy file with size > 25MB
    const bigFile = new File(['x'], 'large.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    Object.defineProperty(bigFile, 'size', { value: 26 * 1024 * 1024 });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(
      screen.getByText(/Kích thước tệp vượt quá giới hạn tối đa cho phép của hệ thống/i),
    ).toBeInTheDocument();
  });

  it('submits valid .docx file through importDocxFlow and triggers onSuccess', async () => {
    const user = userEvent.setup();
    const mockCreatedDoc = {
      id: 'doc-imported',
      title: 'Chuyên đề Sông Đà',
      description: null,
      revision: 1,
      type: 'STRUCTURED_NOTE' as const,
      sizeBytes: 1234,
      mimeType: 'application/vnd.tiptap+json',
      ownerId: 't-1',
      categoryId: 'cat-1',
      createdAt: '2026-10-26',
      updatedAt: '2026-10-26',
    };

    vi.mocked(teacherDocumentsService.importDocxFlow).mockResolvedValueOnce({
      message: 'Nhập thành công',
      document: mockCreatedDoc,
      warnings: ['SmartArt đã được giản lược'],
    });

    render(
      <DocxImportModal
        isOpen={true}
        onClose={mockOnClose}
        categoriesTree={mockCategories}
        onSuccess={mockOnSuccess}
      />,
    );

    const validFile = new File(['valid docx bytes'], 'song-da.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, validFile);

    // Title should be prefilled
    expect(screen.getByDisplayValue('song-da')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Nhập và mở soạn thảo/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(teacherDocumentsService.importDocxFlow).toHaveBeenCalledWith(
        expect.objectContaining({
          file: validFile,
          title: 'song-da',
        }),
        expect.any(Function),
      );
      expect(mockOnSuccess).toHaveBeenCalledWith(mockCreatedDoc, ['SmartArt đã được giản lược']);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
