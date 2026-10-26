import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { teacherDocumentsService, studentDocumentsService } from './documents.service';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
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

  // ==================== STRUCTURED DOCUMENTS TESTS ====================
  it('createDocument calls POST /documents', async () => {
    const mockCreated = {
      message: 'Tạo tài liệu thành công',
      document: {
        id: 'doc-123',
        title: 'Giáo án mới',
        type: 'STRUCTURED_NOTE',
        revision: 1,
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockCreated });

    const res = await teacherDocumentsService.createDocument({
      title: '  Giáo án mới  ',
      description: 'Mô tả giáo án',
      status: 'DRAFT',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/documents', {
      title: 'Giáo án mới',
      description: 'Mô tả giáo án',
      categoryId: undefined,
      status: 'DRAFT',
      content: undefined,
    });
    expect(res).toEqual(mockCreated);
  });

  it('getDocument calls GET /documents/:id', async () => {
    const mockDoc = {
      id: 'doc-123',
      title: 'Giáo án Ngữ văn',
      revision: 3,
      content: { type: 'doc', content: [] },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDoc });

    const res = await teacherDocumentsService.getDocument('doc-123');

    expect(apiClient.get).toHaveBeenCalledWith('/documents/doc-123');
    expect(res).toEqual(mockDoc);
  });

  it('updateContent calls PUT /documents/:id/content with expectedRevision', async () => {
    const mockSaveRes = {
      message: 'Lưu nội dung tài liệu thành công',
      revision: 4,
      updatedAt: '2026-10-26T09:15:00.000Z',
    };
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockSaveRes });

    const res = await teacherDocumentsService.updateContent('doc-123', {
      expectedRevision: 3,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      versionReason: 'Cập nhật đoạn văn',
    });

    expect(apiClient.put).toHaveBeenCalledWith('/documents/doc-123/content', {
      expectedRevision: 3,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      versionReason: 'Cập nhật đoạn văn',
    });
    expect(res).toEqual(mockSaveRes);
  });

  it('getVersions calls GET /documents/:id/versions', async () => {
    const mockVersions = {
      items: [
        {
          id: 'v-1',
          documentId: 'doc-123',
          revision: 1,
          title: 'Khởi tạo',
          reason: 'Khởi tạo tài liệu',
          createdAt: '2026-10-26',
          actor: { id: 'u-1', fullName: 'Cô Nhị', role: 'TEACHER' },
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockVersions });

    const res = await teacherDocumentsService.getVersions('doc-123', { page: 1, limit: 10 });

    expect(apiClient.get).toHaveBeenCalledWith('/documents/doc-123/versions', {
      params: { page: 1, limit: 10 },
    });
    expect(res).toEqual(mockVersions);
  });

  it('restoreVersion calls POST /documents/:id/restore/:versionId', async () => {
    const mockRestoreRes = {
      message: 'Đã khôi phục thành công',
      revision: 5,
      document: { id: 'doc-123', revision: 5 },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRestoreRes });

    const res = await teacherDocumentsService.restoreVersion('doc-123', 'v-1');

    expect(apiClient.post).toHaveBeenCalledWith('/documents/doc-123/restore/v-1');
    expect(res).toEqual(mockRestoreRes);
  });

  it('importDocx calls POST /documents/import', async () => {
    const mockImportRes = {
      message: 'Nhập tài liệu từ DOCX thành công',
      document: { id: 'doc-imported', title: 'Tài liệu DOCX' },
      warnings: [],
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockImportRes });

    const res = await teacherDocumentsService.importDocx({
      storageKey: 'keys/sample.docx',
      title: 'Tài liệu DOCX',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/documents/import', {
      storageKey: 'keys/sample.docx',
      title: 'Tài liệu DOCX',
    });
    expect(res).toEqual(mockImportRes);
  });

  it('importDocxFlow runs initUpload, uploadFileToR2, and importDocx sequentially', async () => {
    const file = new File(['docx content'], 'bai-hoc.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    vi.mocked(apiClient.post).mockImplementation((url) => {
      if (url === '/teacher/documents/upload-url') {
        return Promise.resolve({
          data: {
            uploadUrl: 'https://r2.storage/upload-url',
            storageKey: 'docs/bai-hoc.docx',
            uploadSessionId: 'sess-1',
            expiresInSeconds: 300,
            requiredHeaders: { 'x-amz-acl': 'private' },
          },
        });
      }
      if (url === '/documents/import') {
        return Promise.resolve({
          data: {
            message: 'Nhập thành công',
            document: { id: 'doc-new', title: 'Bài học Ngữ Văn' },
            warnings: ['Cảnh báo định dạng'],
          },
        });
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`));
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response);

    const stages: string[] = [];
    const res = await teacherDocumentsService.importDocxFlow(
      { file, title: 'Bài học Ngữ Văn' },
      (stage) => stages.push(stage),
    );

    expect(stages).toEqual(['init', 'uploading', 'importing']);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://r2.storage/upload-url',
      expect.objectContaining({
        method: 'PUT',
        body: file,
        headers: expect.objectContaining({
          'x-amz-acl': 'private',
        }),
      }),
    );
    expect(res.document.id).toBe('doc-new');
    expect(res.warnings).toEqual(['Cảnh báo định dạng']);
  });

  it('exportDocument calls POST /documents/:id/export', async () => {
    const mockExportRes = {
      jobId: 'job-123',
      status: 'COMPLETED',
      format: 'PDF',
      revision: 3,
      downloadUrl: 'https://r2.storage/export.pdf',
      expiresInSeconds: 300,
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockExportRes });

    const res = await teacherDocumentsService.exportDocument('doc-123', { format: 'PDF' });

    expect(apiClient.post).toHaveBeenCalledWith('/documents/doc-123/export', {
      format: 'PDF',
    });
    expect(res).toEqual(mockExportRes);
  });

  it('getExportStatus calls GET /documents/:id/export/:exportId', async () => {
    const mockStatus = {
      jobId: 'job-123',
      status: 'COMPLETED',
      format: 'PDF',
      revision: 3,
      downloadUrl: 'https://r2.storage/export.pdf',
      expiresInSeconds: 300,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStatus });

    const res = await teacherDocumentsService.getExportStatus('doc-123', 'job-123');

    expect(apiClient.get).toHaveBeenCalledWith('/documents/doc-123/export/job-123');
    expect(res).toEqual(mockStatus);
  });
});

