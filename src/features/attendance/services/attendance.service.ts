import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/common.types';
import type {
  SessionAttendanceResponse,
  SessionAttendanceSummary,
  BatchAttendancePayload,
  MarkAllPresentPayload,
  CloseAttendanceSessionPayload,
  UpdateAttendancePayload,
  QueryAttendanceHistoryParams,
  ClassAttendanceHistoryItem,
  ClassAttendanceSummaryResponse,
  QueryMonthlySummaryParams,
  MonthlySummaryResponse,
  CloseMonthlySummaryPayload,
  ClassAttendanceConfig,
  UpdateAttendanceConfigPayload,
  CorrectionRequestItem,
  QueryCorrectionRequestsParams,
  ReviewCorrectionRequestPayload,
  QueryStudentAttendanceParams,
  StudentAttendanceItem,
  StudentAttendanceSummaryResponse,
  CreateCorrectionRequestPayload,
  ExportAttendanceParams,
} from '../types/attendance.types';

function extractFilenameFromHeader(headerValue?: string, fallback: string = 'export.xlsx'): string {
  if (!headerValue) return fallback;

  // RFC 5987 / UTF-8 format: filename*=UTF-8''...
  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // fallback
    }
  }

  // Standard format: filename="..."
  const standardMatch = headerValue.match(/filename="?([^";]+)"?/i);
  if (standardMatch && standardMatch[1]) {
    return standardMatch[1];
  }

  return fallback;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const attendanceService = {
  // ==================== PHÒNG HỌC & BUỔI HỌC (SESSION) ====================

  /**
   * Lấy danh sách điểm danh của một buổi học (kèm danh sách học sinh của lớp)
   */
  async getSessionAttendance(sessionId: string): Promise<SessionAttendanceResponse> {
    const res = await apiClient.get<SessionAttendanceResponse>(
      `/sessions/${sessionId}/attendance`,
    );
    return res.data;
  },

  /**
   * Thống kê tóm tắt tình hình điểm danh của buổi học
   */
  async getSessionSummary(sessionId: string): Promise<SessionAttendanceSummary> {
    const res = await apiClient.get<SessionAttendanceSummary>(
      `/sessions/${sessionId}/attendance/summary`,
    );
    return res.data;
  },

  /**
   * Mở phiên điểm danh cho buổi học
   */
  async openAttendanceSession(sessionId: string): Promise<{
    message: string;
    attendanceSession: unknown;
  }> {
    const res = await apiClient.post<{ message: string; attendanceSession: unknown }>(
      `/sessions/${sessionId}/attendance/open`,
    );
    return res.data;
  },

  /**
   * Lưu bản nháp điểm danh (DRAFT)
   */
  async saveDraftAttendance(
    sessionId: string,
    dto: BatchAttendancePayload,
  ): Promise<{ message: string; count: number }> {
    const res = await apiClient.post<{ message: string; count: number }>(
      `/sessions/${sessionId}/attendance/save-draft`,
      dto,
    );
    return res.data;
  },

  /**
   * Chốt điểm danh của buổi học (CLOSED)
   */
  async closeAttendanceSession(
    sessionId: string,
    dto?: CloseAttendanceSessionPayload,
  ): Promise<{ message: string; attendanceSession: unknown }> {
    const res = await apiClient.post<{ message: string; attendanceSession: unknown }>(
      `/sessions/${sessionId}/attendance/close`,
      dto || {},
    );
    return res.data;
  },

  /**
   * Đánh dấu tất cả học sinh trong lớp là có mặt (PRESENT)
   */
  async markAllPresent(
    sessionId: string,
    dto: MarkAllPresentPayload = {},
  ): Promise<{ message: string; count: number }> {
    const res = await apiClient.post<{ message: string; count: number }>(
      `/sessions/${sessionId}/attendance/mark-all`,
      dto,
    );
    return res.data;
  },

  /**
   * Lưu điểm danh hàng loạt (Batch Upsert)
   */
  async batchSaveAttendance(
    sessionId: string,
    dto: BatchAttendancePayload,
  ): Promise<{ message: string; count: number; saved: unknown[] }> {
    const res = await apiClient.put<{ message: string; count: number; saved: unknown[] }>(
      `/sessions/${sessionId}/attendance`,
      dto,
    );
    return res.data;
  },

  /**
   * Cập nhật điểm danh một bản ghi đơn lẻ
   */
  async updateAttendance(
    id: string,
    dto: UpdateAttendancePayload,
  ): Promise<{ message: string; attendance: unknown }> {
    const res = await apiClient.patch<{ message: string; attendance: unknown }>(
      `/attendance/${id}`,
      dto,
    );
    return res.data;
  },

  // ==================== QUẢN LÝ ĐIỂM DANH THEO LỚP (GIÁO VIÊN / ADMIN) ====================

  /**
   * Lấy lịch sử điểm danh theo lớp (có phân trang và bộ lọc)
   */
  async getClassAttendanceHistory(
    classId: string,
    params?: QueryAttendanceHistoryParams,
  ): Promise<PaginatedResponse<ClassAttendanceHistoryItem>> {
    const res = await apiClient.get<PaginatedResponse<ClassAttendanceHistoryItem>>(
      `/classes/${classId}/attendance/history`,
      { params },
    );
    return res.data;
  },

  /**
   * Thống kê tổng hợp số buổi theo từng trạng thái của lớp
   */
  async getClassAttendanceSummary(
    classId: string,
    params?: QueryAttendanceHistoryParams,
  ): Promise<ClassAttendanceSummaryResponse> {
    const res = await apiClient.get<ClassAttendanceSummaryResponse>(
      `/classes/${classId}/attendance/summary`,
      { params },
    );
    return res.data;
  },

  /**
   * Xem bảng tổng hợp tháng
   */
  async getMonthlySummary(
    classId: string,
    params: QueryMonthlySummaryParams,
  ): Promise<MonthlySummaryResponse> {
    const res = await apiClient.get<MonthlySummaryResponse>(
      `/classes/${classId}/attendance/monthly-summary`,
      { params },
    );
    return res.data;
  },

  /**
   * Chốt tổng kết tháng (tạo snapshot chuyên cần & tính phí)
   */
  async closeMonthlySummary(
    classId: string,
    dto: CloseMonthlySummaryPayload,
  ): Promise<{ message: string; count: number; snapshots: unknown[] }> {
    const res = await apiClient.post<{ message: string; count: number; snapshots: unknown[] }>(
      `/classes/${classId}/attendance/monthly-summary/close`,
      dto,
    );
    return res.data;
  },

  /**
   * Lấy cấu hình điểm danh & tính phí của lớp
   */
  async getClassAttendanceConfig(classId: string): Promise<ClassAttendanceConfig> {
    const res = await apiClient.get<ClassAttendanceConfig>(
      `/classes/${classId}/attendance/config`,
    );
    return res.data;
  },

  /**
   * Cập nhật cấu hình điểm danh & tính phí của lớp
   */
  async updateClassAttendanceConfig(
    classId: string,
    dto: UpdateAttendanceConfigPayload,
  ): Promise<{ message: string; config: ClassAttendanceConfig }> {
    const res = await apiClient.put<{ message: string; config: ClassAttendanceConfig }>(
      `/classes/${classId}/attendance/config`,
      dto,
    );
    return res.data;
  },

  /**
   * Danh sách yêu cầu điều chỉnh điểm danh (cho giáo viên hoặc Admin)
   */
  async getCorrectionRequests(
    params?: QueryCorrectionRequestsParams,
  ): Promise<PaginatedResponse<CorrectionRequestItem>> {
    const res = await apiClient.get<PaginatedResponse<CorrectionRequestItem>>(
      `/attendance/correction-requests`,
      { params },
    );
    return res.data;
  },

  /**
   * Duyệt hoặc từ chối yêu cầu điều chỉnh điểm danh
   */
  async reviewCorrectionRequest(
    id: string,
    dto: ReviewCorrectionRequestPayload,
  ): Promise<{ message: string; request: unknown }> {
    const res = await apiClient.post<{ message: string; request: unknown }>(
      `/attendance/correction-requests/${id}/review`,
      dto,
    );
    return res.data;
  },

  // ==================== XUẤT EXCEL (BINARY BLOB DOWNLOAD) ====================

  /**
   * Xuất chi tiết điểm danh ra Excel
   */
  async exportDetailExcel(classId: string, params?: ExportAttendanceParams): Promise<void> {
    const res = await apiClient.get<Blob>(`/classes/${classId}/attendance/export/detail`, {
      params,
      responseType: 'blob',
    });

    const fallbackName = `DiemDanh_ChiTiet_${classId}_${Date.now()}.xlsx`;
    const filename = extractFilenameFromHeader(
      res.headers['content-disposition'],
      fallbackName,
    );

    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    triggerBlobDownload(blob, filename);
  },

  /**
   * Xuất bảng tổng hợp tháng ra Excel
   */
  async exportSummaryExcel(classId: string, params?: ExportAttendanceParams): Promise<void> {
    const res = await apiClient.get<Blob>(`/classes/${classId}/attendance/export/summary`, {
      params,
      responseType: 'blob',
    });

    const fallbackName = `DiemDanh_TongHop_${classId}_${Date.now()}.xlsx`;
    const filename = extractFilenameFromHeader(
      res.headers['content-disposition'],
      fallbackName,
    );

    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    triggerBlobDownload(blob, filename);
  },

  // ==================== HỌC SINH (STUDENT) ====================

  /**
   * Học sinh xem lịch sử điểm danh của chính mình
   */
  async getMyAttendanceHistory(
    params?: QueryStudentAttendanceParams,
  ): Promise<PaginatedResponse<StudentAttendanceItem>> {
    const res = await apiClient.get<PaginatedResponse<StudentAttendanceItem>>(
      `/student/attendance`,
      { params },
    );
    return res.data;
  },

  /**
   * Học sinh xem thống kê tổng hợp số buổi theo từng trạng thái
   */
  async getMyAttendanceSummary(
    params?: QueryStudentAttendanceParams,
  ): Promise<StudentAttendanceSummaryResponse> {
    const res = await apiClient.get<StudentAttendanceSummaryResponse>(
      `/student/attendance/summary`,
      { params },
    );
    return res.data;
  },

  /**
   * Học sinh gửi yêu cầu điều chỉnh điểm danh
   */
  async createCorrectionRequest(
    dto: CreateCorrectionRequestPayload,
  ): Promise<{ message: string; request: unknown }> {
    const res = await apiClient.post<{ message: string; request: unknown }>(
      `/student/attendance/correction-requests`,
      dto,
    );
    return res.data;
  },

  /**
   * Học sinh xem danh sách yêu cầu điều chỉnh của mình
   */
  async getMyCorrectionRequests(
    params?: QueryCorrectionRequestsParams,
  ): Promise<PaginatedResponse<CorrectionRequestItem>> {
    const res = await apiClient.get<PaginatedResponse<CorrectionRequestItem>>(
      `/student/attendance/correction-requests`,
      { params },
    );
    return res.data;
  },
};
