import { apiClient } from '@/lib/api-client';
import type {
  AssignmentDetail,
  AssignmentsListResponse,
  QueryAssignmentsParams,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentStatsResponse,
  EligibleStudentsResponse,
  SubmitAssignmentDto,
  AssignmentSubmissionItem,
  QuerySubmissionsParams,
  ReviewSubmissionDto,
  SubmissionReviewItem,
  InitAssignmentUploadDto,
  InitAssignmentUploadResponse,
  AttachmentDownloadUrlResponse,
} from '../types/assignment.types';

export const assignmentsService = {
  /**
   * Lấy danh sách bài tập (ADMIN, TEACHER, STUDENT)
   * GET /assignments
   */
  async findAll(params?: QueryAssignmentsParams): Promise<AssignmentsListResponse> {
    const response = await apiClient.get<AssignmentsListResponse>('/assignments', { params });
    return response.data;
  },

  /**
   * Xem chi tiết một bài tập
   * GET /assignments/:id
   */
  async findOne(id: string): Promise<AssignmentDetail> {
    const response = await apiClient.get<AssignmentDetail>(`/assignments/${id}`);
    return response.data;
  },

  /**
   * Giáo viên / Admin tạo bài tập mới
   * POST /assignments
   */
  async create(dto: CreateAssignmentDto): Promise<{ message: string; assignment: AssignmentDetail }> {
    const payload: CreateAssignmentDto = {
      classId: dto.classId,
      sessionId: dto.sessionId || undefined,
      title: dto.title.trim(),
      description: dto.description?.trim() || undefined,
      maxScore: dto.maxScore !== undefined ? Number(dto.maxScore) : undefined,
      allowResubmission: dto.allowResubmission,
      maxAttempts: dto.maxAttempts !== undefined && dto.maxAttempts !== null ? Number(dto.maxAttempts) : undefined,
      fileUrls: dto.fileUrls,
      attachmentKeys: dto.attachmentKeys,
      dueDate: dto.dueDate ? new Date(dto.dueDate).toISOString() : undefined,
    };
    const response = await apiClient.post<{ message: string; assignment: AssignmentDetail }>(
      '/assignments',
      payload,
    );
    return response.data;
  },

  /**
   * Giáo viên / Admin cập nhật bài tập
   * PATCH /assignments/:id
   */
  async update(id: string, dto: UpdateAssignmentDto): Promise<{ message: string; assignment: AssignmentDetail }> {
    const payload: UpdateAssignmentDto = {};
    if (dto.title !== undefined) payload.title = dto.title.trim();
    if (dto.description !== undefined) payload.description = dto.description.trim();
    if (dto.sessionId !== undefined) payload.sessionId = dto.sessionId;
    if (dto.maxScore !== undefined) payload.maxScore = Number(dto.maxScore);
    if (dto.allowResubmission !== undefined) payload.allowResubmission = dto.allowResubmission;
    if (dto.maxAttempts !== undefined) payload.maxAttempts = dto.maxAttempts;
    if (dto.fileUrls !== undefined) payload.fileUrls = dto.fileUrls;
    if (dto.attachmentKeys !== undefined) payload.attachmentKeys = dto.attachmentKeys;
    if (dto.dueDate !== undefined) {
      payload.dueDate = dto.dueDate ? new Date(dto.dueDate).toISOString() : null;
    }

    const response = await apiClient.patch<{ message: string; assignment: AssignmentDetail }>(
      `/assignments/${id}`,
      payload,
    );
    return response.data;
  },

  /**
   * Giáo viên / Admin xóa bài tập
   * DELETE /assignments/:id
   */
  async remove(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/assignments/${id}`);
    return response.data;
  },

  /**
   * Lấy số liệu thống kê bài nộp (Giáo viên / Admin)
   * GET /assignments/:id/stats
   */
  async getStats(id: string): Promise<AssignmentStatsResponse> {
    const response = await apiClient.get<AssignmentStatsResponse>(`/assignments/${id}/stats`);
    return response.data;
  },

  /**
   * Lấy danh sách học sinh đủ điều kiện và trạng thái làm bài (Giáo viên / Admin)
   * GET /assignments/:id/eligible-students
   */
  async getEligibleStudents(id: string): Promise<EligibleStudentsResponse> {
    const response = await apiClient.get<EligibleStudentsResponse>(`/assignments/${id}/eligible-students`);
    return response.data;
  },

  /**
   * Học sinh nộp bài tập
   * POST /assignments/:id/submissions
   */
  async submitAssignment(
    id: string,
    dto: SubmitAssignmentDto,
  ): Promise<{ message: string; submission: AssignmentSubmissionItem }> {
    const payload: SubmitAssignmentDto = {
      content: dto.content?.trim() || undefined,
      fileUrls: dto.fileUrls,
      attachmentKeys: dto.attachmentKeys,
      externalUrl: dto.externalUrl?.trim() || undefined,
    };
    const response = await apiClient.post<{ message: string; submission: AssignmentSubmissionItem }>(
      `/assignments/${id}/submissions`,
      payload,
    );
    return response.data;
  },

  /**
   * Lấy danh sách các bài nộp của bài tập
   * GET /assignments/:id/submissions
   */
  async getSubmissions(
    id: string,
    params?: QuerySubmissionsParams,
  ): Promise<AssignmentSubmissionItem[]> {
    const response = await apiClient.get<AssignmentSubmissionItem[]>(`/assignments/${id}/submissions`, {
      params,
    });
    return response.data;
  },

  /**
   * Xem chi tiết một bài nộp
   * GET /assignments/submissions/:submissionId
   */
  async getSubmission(submissionId: string): Promise<AssignmentSubmissionItem> {
    const response = await apiClient.get<AssignmentSubmissionItem>(
      `/assignments/submissions/${submissionId}`,
    );
    return response.data;
  },

  /**
   * Giáo viên / Admin chấm điểm và nhận xét (Lưu bản nháp DRAFT hoặc RETURNED)
   * POST /assignments/submissions/:submissionId/review
   */
  async reviewSubmission(
    submissionId: string,
    dto: ReviewSubmissionDto,
  ): Promise<{ message: string; review: SubmissionReviewItem }> {
    const payload: ReviewSubmissionDto = {
      score: dto.score !== undefined ? Number(dto.score) : undefined,
      feedback: dto.feedback !== undefined ? dto.feedback.trim() : undefined,
      status: dto.status || 'DRAFT',
      attachmentKeys: dto.attachmentKeys,
    };
    const response = await apiClient.post<{ message: string; review: SubmissionReviewItem }>(
      `/assignments/submissions/${submissionId}/review`,
      payload,
    );
    return response.data;
  },

  /**
   * Giáo viên / Admin thực hiện TRẢ BÀI riêng biệt
   * POST /assignments/submissions/:submissionId/return
   */
  async returnSubmission(
    submissionId: string,
  ): Promise<{ message: string; review: SubmissionReviewItem }> {
    const response = await apiClient.post<{ message: string; review: SubmissionReviewItem }>(
      `/assignments/submissions/${submissionId}/return`,
      {},
    );
    return response.data;
  },

  /**
   * Khởi tạo presigned PUT URL cho Cloudflare R2
   * POST /assignments/upload-url
   */
  async initUpload(dto: InitAssignmentUploadDto): Promise<InitAssignmentUploadResponse> {
    const payload: InitAssignmentUploadDto = {
      targetType: dto.targetType,
      originalName: dto.originalName.trim(),
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      targetId: dto.targetId || undefined,
    };
    const response = await apiClient.post<InitAssignmentUploadResponse>(
      '/assignments/upload-url',
      payload,
    );
    return response.data;
  },

  /**
   * Tải tệp trực tiếp lên Cloudflare R2 bằng method PUT và presigned URL
   * Hỗ trợ theo dõi tiến trình upload %
   */
  uploadFileToR2(
    uploadUrl: string,
    file: File,
    requiredHeaders?: Record<string, string>,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);

      // Thiết lập Content-Type hoặc các header bắt buộc
      if (requiredHeaders && typeof requiredHeaders === 'object') {
        Object.entries(requiredHeaders).forEach(([k, v]) => {
          xhr.setRequestHeader(k, v);
        });
      }

      if (!requiredHeaders?.['Content-Type'] && file.type) {
        xhr.setRequestHeader('Content-Type', file.type);
      }

      // Lắng nghe tiến trình upload
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percentComplete = Math.round((evt.loaded / evt.total) * 100);
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(
            new Error(
              `Tải tệp lên Cloudflare R2 thất bại với mã trạng thái ${xhr.status}: ${xhr.statusText}`,
            ),
          );
        }
      };

      xhr.onerror = () => {
        reject(new Error('Lỗi kết nối mạng khi tải tệp trực tiếp lên Cloudflare R2'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Hết thời gian chờ (timeout) khi tải tệp lên Cloudflare R2'));
      };

      xhr.send(file);
    });
  },

  /**
   * Lấy URL xem/tải tệp đính kèm an toàn (Presigned GET)
   * GET /assignments/attachments/:attachmentId/download-url
   */
  async getAttachmentDownloadUrl(attachmentId: string): Promise<AttachmentDownloadUrlResponse> {
    const response = await apiClient.get<AttachmentDownloadUrlResponse>(
      `/assignments/attachments/${attachmentId}/download-url`,
    );
    return response.data;
  },

  /**
   * Đánh dấu / Hủy đánh dấu giữ tệp vĩnh viễn (Giáo viên phụ trách hoặc Admin)
   * PATCH /assignments/attachments/:attachmentId/keep
   */
  async toggleKeepForever(
    attachmentId: string,
    isKeepForever: boolean,
  ): Promise<{ message: string; isKeepForever: boolean }> {
    const response = await apiClient.patch<{ message: string; isKeepForever: boolean }>(
      `/assignments/attachments/${attachmentId}/keep`,
      { isKeepForever },
    );
    return response.data;
  },
};
