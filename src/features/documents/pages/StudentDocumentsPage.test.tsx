import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentDocumentsPage } from './StudentDocumentsPage';
import { studentClassesService } from '@/features/classes/services/classes.service';
import { studentDocumentsService } from '../services/documents.service';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/features/classes/services/classes.service', () => ({
  studentClassesService: {
    getMyClasses: vi.fn(),
  },
}));

vi.mock('../services/documents.service', () => ({
  studentDocumentsService: {
    getClassMaterials: vi.fn(),
    getMaterialDownloadUrl: vi.fn(),
  },
  teacherDocumentsService: {
    getDownloadUrl: vi.fn(),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StudentDocumentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StudentDocumentsPage', () => {
  const mockEnrolledClasses = {
    items: [
      {
        membershipId: 'm-1',
        joinedAt: '2026-09-01',
        effectiveTuition: 500000,
        class: {
          id: 'cls-1',
          name: 'Lớp Ngữ Văn 12 Nâng Cao',
          description: 'Luyện thi đại học',
          status: 'ACTIVE' as const,
          teacher: {
            id: 't-1',
            fullName: 'Cô Nguyễn Thị Nhi',
            email: 'nhi@example.com',
            phone: '0901234567',
          },
        },
      },
      {
        membershipId: 'm-2',
        joinedAt: '2026-09-05',
        effectiveTuition: 400000,
        class: {
          id: 'cls-2',
          name: 'Lớp Luyện Đề THPT',
          description: null,
          status: 'ACTIVE' as const,
          teacher: {
            id: 't-1',
            fullName: 'Cô Nguyễn Thị Nhi',
            phone: '0901234567',
          },
        },
      },
    ],
    pagination: { total: 2, page: 1, limit: 100, totalPages: 1 },
  };

  const mockMaterialsResponse = {
    items: [
      {
        id: 'mat-1',
        classId: 'cls-1',
        sessionId: null,
        documentId: 'doc-1',
        uploadedById: 't-1',
        title: 'Chuyên đề Tùy bút Sông Đà',
        description: 'Phân tích phong cách nghệ thuật tài hoa uyên bác',
        type: 'DOCUMENT',
        originalName: 'song-da.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048576,
        isPublished: true,
        publishedAt: '2026-10-15',
        order: 0,
        accessStartTime: null,
        accessEndTime: null,
        createdAt: '2026-10-15T08:00:00.000Z',
        updatedAt: '2026-10-15T08:00:00.000Z',
      },
    ],
    pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(studentClassesService.getMyClasses).mockResolvedValue(mockEnrolledClasses as any);
    vi.mocked(studentDocumentsService.getClassMaterials).mockResolvedValue(mockMaterialsResponse as any);
  });

  it('renders student documents page with enrolled classes and materials from API', async () => {
    renderPage();

    expect(screen.getByText('Tài liệu học tập')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Lớp Ngữ Văn 12 Nâng Cao')).toBeInTheDocument();
      expect(screen.getByText('Lớp Luyện Đề THPT')).toBeInTheDocument();
      expect(screen.getByText('Chuyên đề Tùy bút Sông Đà')).toBeInTheDocument();
      expect(screen.getByText('song-da.pdf')).toBeInTheDocument();
    });
  });

  it('switches active class and loads materials for selected class', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lớp Luyện Đề THPT')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Lớp Luyện Đề THPT'));

    await waitFor(() => {
      expect(studentDocumentsService.getClassMaterials).toHaveBeenCalledWith(
        'cls-2',
        expect.objectContaining({ page: 1 }),
      );
    });
  });

  it('downloads file when clicking "Tải xuống"', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    vi.mocked(studentDocumentsService.getMaterialDownloadUrl).mockResolvedValueOnce({
      downloadUrl: 'https://r2.cloudflarestorage.com/presigned-get',
      expiresInSeconds: 300,
      title: 'Chuyên đề Tùy bút Sông Đà',
      originalName: 'song-da.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048576,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Chuyên đề Tùy bút Sông Đà')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Tải xuống/i });
    await user.click(downloadBtn);

    await waitFor(() => {
      expect(studentDocumentsService.getMaterialDownloadUrl).toHaveBeenCalledWith('mat-1');
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://r2.cloudflarestorage.com/presigned-get',
        '_blank',
        'noopener,noreferrer',
      );
    });

    windowOpenSpy.mockRestore();
  });
});
