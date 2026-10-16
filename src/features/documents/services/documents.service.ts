import { apiClient } from '@/lib/api-client';
import type {
  DocumentCategory,
  DocumentCategoryTreeNode,
  CreateCategoryDto,
  UpdateCategoryDto,
  DocumentItem,
  InitUploadDto,
  InitUploadResponse,
  CompleteUploadDto,
  QueryDocumentsParams,
  DocumentsListResponse,
  DocumentDownloadUrlResponse,
  UpdateDocumentDto,
  ShareMaterialDto,
  AssignDocumentsToClassesDto,
  AssignDocumentsToClassesResponse,
  QueryStudentClassMaterialsParams,
  ClassMaterialItem,
  ClassMaterialsListResponse,
} from '../types/document.types';

export const teacherDocumentsService = {
  // ==================== CATEGORIES (DANH MỤC TÀI LIỆU) ====================

  /**
   * Lấy danh sách danh mục (dạng cây nếu asTree=true hoặc mảng phẳng)
   * GET /teacher/document-categories?asTree=true
   */
  async getCategories(asTree = true): Promise<DocumentCategoryTreeNode[]> {
    const response = await apiClient.get<DocumentCategoryTreeNode[]>(
      '/teacher/document-categories',
      {
        params: { asTree },
      },
    );
    return response.data;
  },

  /**
   * Tạo danh mục mới
   * POST /teacher/document-categories
   */
  async createCategory(
    dto: CreateCategoryDto,
  ): Promise<{ message: string; category: DocumentCategory }> {
    const payload: CreateCategoryDto = {
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      parentId: dto.parentId || undefined,
      sortOrder: dto.sortOrder !== undefined ? Number(dto.sortOrder) : 0,
    };
    const response = await apiClient.post<{
      message: string;
      category: DocumentCategory;
    }>('/teacher/document-categories', payload);
    return response.data;
  },

  /**
   * Sửa thông tin danh mục
   * PATCH /teacher/document-categories/:id
   */
  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<{ message: string; category: DocumentCategory }> {
    const payload: UpdateCategoryDto = {};
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.description !== undefined) payload.description = dto.description.trim();
    if (dto.parentId !== undefined) payload.parentId = dto.parentId;
    if (dto.sortOrder !== undefined) payload.sortOrder = Number(dto.sortOrder);

    const response = await apiClient.patch<{
      message: string;
      category: DocumentCategory;
    }>(`/teacher/document-categories/${id}`, payload);
    return response.data;
  },

  /**
   * Xóa danh mục an toàn (tài liệu về unclassified, thư mục con lên cấp cha)
   * DELETE /teacher/document-categories/:id
   */
  async deleteCategory(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/teacher/document-categories/${id}`,
    );
    return response.data;
  },

  // ==================== DOCUMENTS LIBRARY (THƯ VIỆN TÀI LIỆU) ====================

  /**
   * Lấy danh sách tài liệu cá nhân của giáo viên (hỗ trợ phân trang, tìm kiếm, lọc theo thư mục)
   * GET /teacher/documents
   */
  async getDocuments(params?: QueryDocumentsParams): Promise<DocumentsListResponse> {
    const queryParams: Record<string, unknown> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    };

    if (params?.search && params.search.trim() !== '') {
      queryParams.search = params.search.trim();
    }

    if (params?.unclassifiedOnly) {
      queryParams.unclassifiedOnly = true;
    } else if (params?.categoryId) {
      queryParams.categoryId = params.categoryId;
    }

    const response = await apiClient.get<DocumentsListResponse>(
      '/teacher/documents',
      {
        params: queryParams,
      },
    );
    return response.data;
  },

  /**
   * Chi tiết tài liệu
   * GET /teacher/documents/:id
   */
  async getDocumentDetail(id: string): Promise<DocumentItem> {
    const response = await apiClient.get<DocumentItem>(`/teacher/documents/${id}`);
    return response.data;
  },

  /**
   * Lấy URL xem/tải tài liệu có chữ ký thời hạn (Cloudflare R2 presigned GET)
   * GET /teacher/documents/:id/download-url
   */
  async getDownloadUrl(id: string): Promise<DocumentDownloadUrlResponse> {
    const response = await apiClient.get<DocumentDownloadUrlResponse>(
      `/teacher/documents/${id}/download-url`,
    );
    return response.data;
  },

  /**
   * Cập nhật metadata tài liệu
   * PATCH /teacher/documents/:id
   */
  async updateDocument(
    id: string,
    dto: UpdateDocumentDto,
  ): Promise<{ message: string; document: DocumentItem }> {
    const payload: UpdateDocumentDto = {};
    if (dto.title !== undefined) payload.title = dto.title.trim();
    if (dto.description !== undefined) payload.description = dto.description.trim();
    if (dto.categoryId !== undefined) payload.categoryId = dto.categoryId;

    const response = await apiClient.patch<{
      message: string;
      document: DocumentItem;
    }>(`/teacher/documents/${id}`, payload);
    return response.data;
  },

  /**
   * Xóa tài liệu khỏi thư viện
   * DELETE /teacher/documents/:id
   */
  async deleteDocument(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/teacher/documents/${id}`,
    );
    return response.data;
  },

  // ==================== UPLOAD FLOW TO CLOUDFLARE R2 ====================

  /**
   * Bước 1: Khởi tạo upload URL
   * POST /teacher/documents/upload-url
   */
  async initUpload(dto: InitUploadDto): Promise<InitUploadResponse> {
    const payload: InitUploadDto = {
      title: dto.title.trim(),
      description: dto.description?.trim() || undefined,
      originalName: dto.originalName.trim(),
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      categoryId: dto.categoryId || undefined,
    };
    const response = await apiClient.post<InitUploadResponse>(
      '/teacher/documents/upload-url',
      payload,
    );
    return response.data;
  },

  /**
   * Bước 2: Tải file nhị phân trực tiếp lên Cloudflare R2
   * Không gửi Bearer token, không tự thêm header lạ gây hỏng chữ ký presigned
   */
  async uploadFileToR2(
    uploadUrl: string,
    file: File,
    requiredHeaders?: Record<string, string>,
  ): Promise<void> {
    const headers: Record<string, string> = {};

    if (requiredHeaders && typeof requiredHeaders === 'object') {
      Object.entries(requiredHeaders).forEach(([key, value]) => {
        headers[key] = value;
      });
    }

    if (!headers['Content-Type'] && file.type) {
      headers['Content-Type'] = file.type;
    }

    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: file,
      });

      if (!response.ok) {
        throw new Error(
          `Không thể tải file lên Cloudflare R2 (Mã lỗi ${response.status}: ${response.statusText})`,
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Lỗi kết nối tải lên R2: ${err.message}`);
      }
      throw new Error('Lỗi kết nối khi tải file trực tiếp lên R2');
    }
  },

  /**
   * Bước 3: Xác nhận hoàn tất upload
   * POST /teacher/documents/complete-upload
   */
  async completeUpload(
    dto: CompleteUploadDto,
  ): Promise<{ message: string; document: DocumentItem }> {
    const response = await apiClient.post<{
      message: string;
      document: DocumentItem;
    }>('/teacher/documents/complete-upload', dto);
    return response.data;
  },

  /**
   * Helper quy trình upload trọn vẹn 3 bước:
   * 1. initUpload -> 2. uploadFileToR2 -> 3. completeUpload
   */
  async uploadDocumentFlow(
    params: {
      file: File;
      title: string;
      description?: string;
      categoryId?: string;
    },
    onProgressStage?: (stage: 'init' | 'uploading' | 'completing') => void,
  ): Promise<{ message: string; document: DocumentItem }> {
    // Stage 1
    onProgressStage?.('init');
    const initRes = await this.initUpload({
      title: params.title,
      description: params.description,
      originalName: params.file.name,
      mimeType: params.file.type || 'application/octet-stream',
      sizeBytes: params.file.size,
      categoryId: params.categoryId,
    });

    // Stage 2: Direct to Cloudflare R2
    onProgressStage?.('uploading');
    await this.uploadFileToR2(
      initRes.uploadUrl,
      params.file,
      initRes.requiredHeaders,
    );

    // Stage 3: Complete upload
    onProgressStage?.('completing');
    const completeRes = await this.completeUpload({
      storageKey: initRes.storageKey,
    });

    return completeRes;
  },

  // ==================== SHARING TO CLASSES & SESSIONS ====================

  /**
   * Chia sẻ tài liệu từ thư viện vào Lớp học
   * POST /teacher/classes/:classId/materials
   */
  async shareDocumentToClass(
    classId: string,
    dto: ShareMaterialDto,
  ): Promise<{ message: string; material: ClassMaterialItem }> {
    const payload: ShareMaterialDto = {
      documentId: dto.documentId,
      title: dto.title?.trim() || undefined,
      description: dto.description?.trim() || undefined,
      isPublished: dto.isPublished ?? true,
      order: dto.order ?? 0,
      accessStartTime: dto.accessStartTime || undefined,
      accessEndTime: dto.accessEndTime || undefined,
    };
    const response = await apiClient.post<{
      message: string;
      material: ClassMaterialItem;
    }>(`/teacher/classes/${classId}/materials`, payload);
    return response.data;
  },

  /**
   * Chia sẻ tài liệu từ thư viện vào Buổi học
   * POST /teacher/sessions/:sessionId/materials
   */
  async shareDocumentToSession(
    sessionId: string,
    dto: ShareMaterialDto,
  ): Promise<{ message: string; material: ClassMaterialItem }> {
    const payload: ShareMaterialDto = {
      documentId: dto.documentId,
      title: dto.title?.trim() || undefined,
      description: dto.description?.trim() || undefined,
      isPublished: dto.isPublished ?? true,
      order: dto.order ?? 0,
      accessStartTime: dto.accessStartTime || undefined,
      accessEndTime: dto.accessEndTime || undefined,
    };
    const response = await apiClient.post<{
      message: string;
      material: ClassMaterialItem;
    }>(`/teacher/sessions/${sessionId}/materials`, payload);
    return response.data;
  },

  /**
   * Lấy danh sách tài liệu gắn với lớp học
   * GET /teacher/classes/:classId/materials
   */
  async getClassMaterials(
    classId: string,
    params?: { page?: number; limit?: number; search?: string; isPublished?: boolean },
  ): Promise<ClassMaterialsListResponse> {
    const response = await apiClient.get<ClassMaterialsListResponse>(
      `/teacher/classes/${classId}/materials`,
      { params },
    );
    return response.data;
  },

  /**
   * Lấy danh sách tài liệu gắn với buổi học
   * GET /teacher/sessions/:sessionId/materials
   */
  async getSessionMaterials(
    sessionId: string,
    params?: { page?: number; limit?: number; search?: string; isPublished?: boolean },
  ): Promise<ClassMaterialsListResponse> {
    const response = await apiClient.get<ClassMaterialsListResponse>(
      `/teacher/sessions/${sessionId}/materials`,
      { params },
    );
    return response.data;
  },

  /**
   * Khởi tạo upload trực tiếp tài liệu vào Buổi học
   * POST /teacher/sessions/:sessionId/materials/upload-url
   */
  async initSessionUpload(
    sessionId: string,
    dto: InitUploadDto,
  ): Promise<InitUploadResponse & { sessionId: string; classId: string }> {
    const payload: InitUploadDto = {
      title: dto.title.trim(),
      description: dto.description?.trim() || undefined,
      originalName: dto.originalName.trim(),
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      categoryId: dto.categoryId || undefined,
    };
    const response = await apiClient.post<
      InitUploadResponse & { sessionId: string; classId: string }
    >(`/teacher/sessions/${sessionId}/materials/upload-url`, payload);
    return response.data;
  },

  /**
   * Xác nhận hoàn tất upload trực tiếp tài liệu vào Buổi học
   * POST /teacher/sessions/:sessionId/materials/complete-upload
   */
  async completeSessionUpload(
    sessionId: string,
    dto: CompleteUploadDto,
  ): Promise<{ message: string; material: ClassMaterialItem }> {
    const response = await apiClient.post<{
      message: string;
      material: ClassMaterialItem;
    }>(`/teacher/sessions/${sessionId}/materials/complete-upload`, dto);
    return response.data;
  },

  /**
   * Gỡ liên kết tài liệu khỏi lớp hoặc buổi học
   * DELETE /teacher/materials/:materialId
   */
  async removeMaterial(materialId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/teacher/materials/${materialId}`,
    );
    return response.data;
  },

  /**
   * Lấy URL tải/xem tài liệu lớp học
   * GET /teacher/materials/:materialId/download-url
   */
  async getMaterialDownloadUrl(
    materialId: string,
  ): Promise<DocumentDownloadUrlResponse> {
    const response = await apiClient.get<DocumentDownloadUrlResponse>(
      `/teacher/materials/${materialId}/download-url`,
    );
    return response.data;
  },

  /**
   * Cấp quyền hàng loạt: Gán 1 hoặc nhiều tài liệu cho 1 hoặc nhiều lớp học
   * POST /teacher/materials/assign-classes
   */
  async assignDocumentsToClasses(
    dto: AssignDocumentsToClassesDto,
  ): Promise<AssignDocumentsToClassesResponse> {
    const payload: AssignDocumentsToClassesDto = {
      documentIds: dto.documentIds,
      classIds: dto.classIds,
      isPublished: dto.isPublished ?? true,
      accessStartTime: dto.accessStartTime || undefined,
      accessEndTime: dto.accessEndTime || undefined,
    };
    const response = await apiClient.post<AssignDocumentsToClassesResponse>(
      '/teacher/materials/assign-classes',
      payload,
    );
    return response.data;
  },
};

/**
 * Service dành cho Học sinh (STUDENT)
 */
export const studentDocumentsService = {
  /**
   * Lấy danh sách tài liệu học sinh được phép truy cập của một lớp học
   * GET /student/classes/:classId/materials
   */
  async getClassMaterials(
    classId: string,
    params?: QueryStudentClassMaterialsParams,
  ): Promise<ClassMaterialsListResponse> {
    const response = await apiClient.get<ClassMaterialsListResponse>(
      `/student/classes/${classId}/materials`,
      { params },
    );
    return response.data;
  },

  /**
   * Học sinh yêu cầu presigned URL để xem/tải tài liệu
   * POST /student/materials/:materialId/download-url
   */
  async getMaterialDownloadUrl(
    materialId: string,
  ): Promise<DocumentDownloadUrlResponse> {
    const response = await apiClient.post<DocumentDownloadUrlResponse>(
      `/student/materials/${materialId}/download-url`,
    );
    return response.data;
  },
};
