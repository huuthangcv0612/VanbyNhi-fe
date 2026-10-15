import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { teacherDocumentsService, studentDocumentsService } from './documents.service';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('teacherDocumentsService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ==================== CATEGORIES ====================
  it('getCategories calls GET /teacher/document-categories with asTree=true', async () => {
    const mockTree = [
      {
        id: 'cat-1',
        name: 'Giáo án',
        description: null,
        parentId: null,
        sortOrder: 0,
        teacherId: 't-1',
        documentCount: 5,
        subCategoryCount: 1,
        children: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTree });

    const result = await teacherDocumentsService.getCategories(true);

    expect(apiClient.get).toHaveBeenCalledWith('/teacher/document-categories', {
      params: { asTree: true },
    });
    expect(result).toEqual(mockTree);
  });

  it('createCategory calls POST /teacher/document-categories', async () => {
    const mockCreated = {
      message: 'Tạo danh mục tài liệu thành công',
      category: {
        id: 'cat-new',
        name: 'Khối 12',
        description: 'Tài liệu khối 12',
        parentId: 'cat-1',
        sortOrder: 1,
        teacherId: 't-1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockCreated });

    const result = await teacherDocumentsService.createCategory({
      name: '  Khối 12  ',
      description: 'Tài liệu khối 12',
      parentId: 'cat-1',
      sortOrder: 1,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/teacher/document-categories', {
      name: 'Khối 12',
      description: 'Tài liệu khối 12',
      parentId: 'cat-1',
      sortOrder: 1,
    });
    expect(result).toEqual(mockCreated);
  });

  it('updateCategory calls PATCH /teacher/document-categories/:id', async () => {
    const mockUpdated = {
      message: 'Cập nhật danh mục thành công',
      category: { id: 'cat-1', name: 'Giáo án mới' },
    };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockUpdated });

    const result = await teacherDocumentsService.updateCategory('cat-1', {
      name: 'Giáo án mới',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/teacher/document-categories/cat-1',
      { name: 'Giáo án mới' },
    );
    expect(result).toEqual(mockUpdated);
  });

  it('deleteCategory calls DELETE /teacher/document-categories/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({
      data: { message: 'Xóa danh mục thành công' },
    });

    const result = await teacherDocumentsService.deleteCategory('cat-1');

    expect(apiClient.delete).toHaveBeenCalledWith(
      '/teacher/document-categories/cat-1',
    );
    expect(result.message).toBe('Xóa danh mục thành công');
  });

  // ==================== DOCUMENTS LIBRARY ====================
  it('getDocuments calls GET /teacher/documents with correct query params', async () => {
    const mockList = {
      items: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockList });

    await teacherDocumentsService.getDocuments({
      page: 2,
      limit: 20,
      search: 'Người lái đò',
      categoryId: 'cat-1',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/teacher/documents', {
      params: {
        page: 2,
        limit: 20,
        search: 'Người lái đò',
        categoryId: 'cat-1',
      },
    });
  });

  it('getDocuments sends unclassifiedOnly when unclassifiedOnly is true', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { items: [] } });

    await teacherDocumentsService.getDocuments({ unclassifiedOnly: true });

    expect(apiClient.get).toHaveBeenCalledWith('/teacher/documents', {
      params: {
        page: 1,
        limit: 10,
        unclassifiedOnly: true,
      },
    });
  });

  it('getDownloadUrl calls GET /teacher/documents/:id/download-url', async () => {
    const mockUrl = {
      downloadUrl: 'https://r2.cloudflarestorage.com/presigned-get-url',
      expiresInSeconds: 300,
      title: 'Đề cương',
      originalName: 'de-cuong.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockUrl });

    const result = await teacherDocumentsService.getDownloadUrl('doc-1');

    expect(apiClient.get).toHaveBeenCalledWith('/teacher/documents/doc-1/download-url');
    expect(result).toEqual(mockUrl);
  });

  it('updateDocument calls PATCH /teacher/documents/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      data: { message: 'OK', document: { id: 'doc-1' } },
    });

    await teacherDocumentsService.updateDocument('doc-1', {
      title: 'Tiêu đề mới',
      description: 'Mô tả mới',
      categoryId: 'cat-2',
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/teacher/documents/doc-1', {
      title: 'Tiêu đề mới',
      description: 'Mô tả mới',
      categoryId: 'cat-2',
    });
  });

  it('deleteDocument calls DELETE /teacher/documents/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({
      data: { message: 'Đã xóa tài liệu' },
    });

    const res = await teacherDocumentsService.deleteDocument('doc-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/teacher/documents/doc-1');
    expect(res.message).toBe('Đã xóa tài liệu');
  });

  // ==================== UPLOAD PIPELINE ====================
  it('initUpload calls POST /teacher/documents/upload-url with correct body', async () => {
    const mockInit = {
      uploadUrl: 'https://r2.cloudflarestorage.com/upload-put',
      storageKey: 'teachers/2026/03/uuid',
      uploadSessionId: 'sess-1',
      expiresInSeconds: 300,
      requiredHeaders: { 'Content-Type': 'application/pdf' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockInit });

    const res = await teacherDocumentsService.initUpload({
      title: 'Tài liệu Văn',
      originalName: 'van.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      categoryId: 'cat-1',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/teacher/documents/upload-url', {
      title: 'Tài liệu Văn',
      originalName: 'van.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      categoryId: 'cat-1',
    });
    expect(res).toEqual(mockInit);
  });

  it('uploadFileToR2 uses native fetch with PUT and requiredHeaders without Bearer token', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    globalThis.fetch = mockFetch;

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    await teacherDocumentsService.uploadFileToR2(
      'https://r2.cloudflarestorage.com/presigned-put',
      file,
      { 'Content-Type': 'application/pdf' },
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://r2.cloudflarestorage.com/presigned-put',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      },
    );
  });

  it('completeUpload calls POST /teacher/documents/complete-upload with storageKey', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        message: 'Hoàn tất upload',
        document: { id: 'doc-123', storageKey: 'teachers/key' },
      },
    });

    const res = await teacherDocumentsService.completeUpload({
      storageKey: 'teachers/key',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/teacher/documents/complete-upload',
      { storageKey: 'teachers/key' },
    );
    expect(res.document.id).toBe('doc-123');
  });

  // ==================== SHARING TO CLASSES ====================
  it('shareDocumentToClass calls POST /teacher/classes/:classId/materials', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { message: 'Chia sẻ thành công', material: { id: 'mat-1' } },
    });

    await teacherDocumentsService.shareDocumentToClass('cls-10', {
      documentId: 'doc-1',
      title: 'Đề bài',
      isPublished: true,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/teacher/classes/cls-10/materials',
      {
        documentId: 'doc-1',
        title: 'Đề bài',
        isPublished: true,
        order: 0,
      },
    );
  });

  it('assignDocumentsToClasses calls POST /teacher/materials/assign-classes', async () => {
    const mockResponse = {
      message: 'Cấp quyền thành công cho 2 tài liệu vào 2 lớp học',
      assignedCount: 4,
      materials: [],
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse });

    const result = await teacherDocumentsService.assignDocumentsToClasses({
      documentIds: ['doc-1', 'doc-2'],
      classIds: ['cls-1', 'cls-2'],
      isPublished: true,
      accessStartTime: '2026-10-15T00:00:00.000Z',
      accessEndTime: '2026-12-31T23:59:59.000Z',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/teacher/materials/assign-classes',
      {
        documentIds: ['doc-1', 'doc-2'],
        classIds: ['cls-1', 'cls-2'],
        isPublished: true,
        accessStartTime: '2026-10-15T00:00:00.000Z',
        accessEndTime: '2026-12-31T23:59:59.000Z',
      },
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('studentDocumentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getClassMaterials calls GET /student/classes/:classId/materials', async () => {
    const mockResponse = {
      items: [
        {
          id: 'mat-1',
          classId: 'cls-1',
          sessionId: null,
          documentId: 'doc-1',
          title: 'Tài liệu ôn thi',
          description: 'Mô tả',
          type: 'DOCUMENT',
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          isPublished: true,
          order: 0,
          createdAt: '2026-10-15',
        },
      ],
      pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse });

    const res = await studentDocumentsService.getClassMaterials('cls-1', {
      page: 1,
      limit: 12,
      search: 'ôn thi',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/student/classes/cls-1/materials', {
      params: { page: 1, limit: 12, search: 'ôn thi' },
    });
    expect(res).toEqual(mockResponse);
  });

  it('getMaterialDownloadUrl calls POST /student/materials/:materialId/download-url', async () => {
    const mockResponse = {
      downloadUrl: 'https://r2.cloudflarestorage.com/download-url',
      expiresInSeconds: 300,
      title: 'Tài liệu ôn thi',
      originalName: 'test.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse });

    const res = await studentDocumentsService.getMaterialDownloadUrl('mat-1');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/student/materials/mat-1/download-url',
    );
    expect(res).toEqual(mockResponse);
  });
});

