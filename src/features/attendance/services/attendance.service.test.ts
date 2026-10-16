import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attendanceService } from './attendance.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('attendanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Attendance Endpoints', () => {
    it('getSessionAttendance: sends GET /sessions/:sessionId/attendance', async () => {
      const mockRes = {
        session: { id: 's1', title: 'Buổi 1' },
        attendanceSession: { status: 'OPEN' },
        students: [{ id: 'u1', name: 'Nguyễn Văn A' }],
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.getSessionAttendance('s1');
      expect(apiClient.get).toHaveBeenCalledWith('/sessions/s1/attendance');
      expect(result).toEqual(mockRes);
    });

    it('getSessionSummary: sends GET /sessions/:sessionId/attendance/summary', async () => {
      const mockRes = { totalStudents: 20, presentCount: 18, markedCount: 18 };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.getSessionSummary('s1');
      expect(apiClient.get).toHaveBeenCalledWith('/sessions/s1/attendance/summary');
      expect(result).toEqual(mockRes);
    });

    it('openAttendanceSession: sends POST /sessions/:sessionId/attendance/open', async () => {
      const mockRes = { message: 'Mở phiên thành công', attendanceSession: { status: 'OPEN' } };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.openAttendanceSession('s1');
      expect(apiClient.post).toHaveBeenCalledWith('/sessions/s1/attendance/open');
      expect(result).toEqual(mockRes);
    });

    it('saveDraftAttendance: sends POST /sessions/:sessionId/attendance/save-draft', async () => {
      const payload = {
        records: [{ studentId: 'u1', status: 'PRESENT' as const }],
      };
      const mockRes = { message: 'Lưu nháp thành công', count: 1 };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.saveDraftAttendance('s1', payload);
      expect(apiClient.post).toHaveBeenCalledWith('/sessions/s1/attendance/save-draft', payload);
      expect(result).toEqual(mockRes);
    });

    it('closeAttendanceSession: sends POST /sessions/:sessionId/attendance/close with payload', async () => {
      const payload = { note: 'Chốt phiên bình thường' };
      const mockRes = { message: 'Chốt phiên thành công', attendanceSession: { status: 'CLOSED' } };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.closeAttendanceSession('s1', payload);
      expect(apiClient.post).toHaveBeenCalledWith('/sessions/s1/attendance/close', payload);
      expect(result).toEqual(mockRes);
    });

    it('markAllPresent: sends POST /sessions/:sessionId/attendance/mark-all', async () => {
      const payload = { overrideExisting: false };
      const mockRes = { message: 'Đã đánh dấu tất cả có mặt', count: 25 };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.markAllPresent('s1', payload);
      expect(apiClient.post).toHaveBeenCalledWith('/sessions/s1/attendance/mark-all', payload);
      expect(result).toEqual(mockRes);
    });

    it('batchSaveAttendance: sends PUT /sessions/:sessionId/attendance', async () => {
      const payload = {
        records: [
          { studentId: 'u1', status: 'PRESENT' as const },
          { studentId: 'u2', status: 'LATE' as const },
        ],
      };
      const mockRes = { message: 'Lưu thành công', count: 2, saved: [] };
      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.batchSaveAttendance('s1', payload);
      expect(apiClient.put).toHaveBeenCalledWith('/sessions/s1/attendance', payload);
      expect(result).toEqual(mockRes);
    });

    it('updateAttendance: sends PATCH /attendance/:id', async () => {
      const payload = { status: 'PRESENT' as const, note: 'Đi đúng giờ' };
      const mockRes = { message: 'Cập nhật thành công', attendance: { id: 'att-1' } };
      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.updateAttendance('att-1', payload);
      expect(apiClient.patch).toHaveBeenCalledWith('/attendance/att-1', payload);
      expect(result).toEqual(mockRes);
    });
  });

  describe('Class Attendance Management Endpoints', () => {
    it('getClassAttendanceHistory: sends GET /classes/:classId/attendance/history', async () => {
      const mockRes = { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const params = { page: 1, limit: 10, status: 'PRESENT' as const };
      const result = await attendanceService.getClassAttendanceHistory('c1', params);
      expect(apiClient.get).toHaveBeenCalledWith('/classes/c1/attendance/history', { params });
      expect(result).toEqual(mockRes);
    });

    it('getClassAttendanceSummary: sends GET /classes/:classId/attendance/summary', async () => {
      const mockRes = { totalSessions: 10, totalStudents: 30 };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.getClassAttendanceSummary('c1');
      expect(apiClient.get).toHaveBeenCalledWith('/classes/c1/attendance/summary', { params: undefined });
      expect(result).toEqual(mockRes);
    });

    it('getMonthlySummary: sends GET /classes/:classId/attendance/monthly-summary', async () => {
      const mockRes = { month: 10, year: 2026, students: [] };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const params = { billingYear: 2026, billingMonth: 10 };
      const result = await attendanceService.getMonthlySummary('c1', params);
      expect(apiClient.get).toHaveBeenCalledWith('/classes/c1/attendance/monthly-summary', { params });
      expect(result).toEqual(mockRes);
    });

    it('closeMonthlySummary: sends POST /classes/:classId/attendance/monthly-summary/close', async () => {
      const payload = { billingYear: 2026, billingMonth: 10, note: 'Chốt tháng 10' };
      const mockRes = { message: 'Chốt tổng kết tháng thành công', count: 30, snapshots: [] };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.closeMonthlySummary('c1', payload);
      expect(apiClient.post).toHaveBeenCalledWith('/classes/c1/attendance/monthly-summary/close', payload);
      expect(result).toEqual(mockRes);
    });

    it('getClassAttendanceConfig: sends GET /classes/:classId/attendance/config', async () => {
      const mockRes = { classId: 'c1', retentionDays: 60, chargeLate: true };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.getClassAttendanceConfig('c1');
      expect(apiClient.get).toHaveBeenCalledWith('/classes/c1/attendance/config');
      expect(result).toEqual(mockRes);
    });

    it('updateClassAttendanceConfig: sends PUT /classes/:classId/attendance/config', async () => {
      const payload = { chargeExcusedAbsent: false, chargeUnexcusedAbsent: false };
      const mockRes = { message: 'Cập nhật cấu hình thành công', config: { classId: 'c1' } };
      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.updateClassAttendanceConfig('c1', payload);
      expect(apiClient.put).toHaveBeenCalledWith('/classes/c1/attendance/config', payload);
      expect(result).toEqual(mockRes);
    });

    it('getCorrectionRequests: sends GET /attendance/correction-requests', async () => {
      const mockRes = { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const params = { status: 'PENDING' as const };
      const result = await attendanceService.getCorrectionRequests(params);
      expect(apiClient.get).toHaveBeenCalledWith('/attendance/correction-requests', { params });
      expect(result).toEqual(mockRes);
    });

    it('reviewCorrectionRequest: sends POST /attendance/correction-requests/:id/review', async () => {
      const payload = { status: 'APPROVED' as const, reviewNote: 'Đồng ý cập nhật' };
      const mockRes = { message: 'Duyệt thành công', request: { id: 'req-1' } };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.reviewCorrectionRequest('req-1', payload);
      expect(apiClient.post).toHaveBeenCalledWith('/attendance/correction-requests/req-1/review', payload);
      expect(result).toEqual(mockRes);
    });
  });

  describe('Student Attendance Endpoints', () => {
    it('getMyAttendanceHistory: sends GET /student/attendance', async () => {
      const mockRes = { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const params = { page: 1, limit: 10 };
      const result = await attendanceService.getMyAttendanceHistory(params);
      expect(apiClient.get).toHaveBeenCalledWith('/student/attendance', { params });
      expect(result).toEqual(mockRes);
    });

    it('getMyAttendanceSummary: sends GET /student/attendance/summary', async () => {
      const mockRes = { totalSessions: 5, presentCount: 4, lateCount: 1 };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const params = { classId: 'c1' };
      const result = await attendanceService.getMyAttendanceSummary(params);
      expect(apiClient.get).toHaveBeenCalledWith('/student/attendance/summary', { params });
      expect(result).toEqual(mockRes);
    });

    it('createCorrectionRequest: sends POST /student/attendance/correction-requests', async () => {
      const payload = {
        attendanceId: 'att-1',
        requestedStatus: 'PRESENT' as const,
        reason: 'Em có vào học đúng giờ',
        evidenceUrl: 'https://example.com/proof.png',
      };
      const mockRes = { message: 'Gửi yêu cầu thành công', request: { id: 'req-1' } };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.createCorrectionRequest(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/student/attendance/correction-requests', payload);
      expect(result).toEqual(mockRes);
    });

    it('getMyCorrectionRequests: sends GET /student/attendance/correction-requests', async () => {
      const mockRes = { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

      const result = await attendanceService.getMyCorrectionRequests();
      expect(apiClient.get).toHaveBeenCalledWith('/student/attendance/correction-requests', { params: undefined });
      expect(result).toEqual(mockRes);
    });
  });

  describe('Excel Export Blob Handling', () => {
    let originalCreateObjectURL: typeof window.URL.createObjectURL;
    let originalRevokeObjectURL: typeof window.URL.revokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = window.URL.createObjectURL;
      originalRevokeObjectURL = window.URL.revokeObjectURL;

      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-blob');
      window.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      window.URL.createObjectURL = originalCreateObjectURL;
      window.URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('exportDetailExcel: downloads blob and parses UTF-8 filename from header', async () => {
      const fakeBlob = new Blob(['excel-content'], { type: 'application/vnd.ms-excel' });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: fakeBlob,
        headers: {
          'content-disposition': "attachment; filename*=UTF-8''DiemDanh_ChiTiet_Lop12A.xlsx",
        },
      });

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      await attendanceService.exportDetailExcel('c1');

      expect(apiClient.get).toHaveBeenCalledWith('/classes/c1/attendance/export/detail', {
        params: undefined,
        responseType: 'blob',
      });
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-blob');
    });

    it('exportSummaryExcel: downloads blob and handles standard filename header', async () => {
      const fakeBlob = new Blob(['excel-content'], { type: 'application/vnd.ms-excel' });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: fakeBlob,
        headers: {
          'content-disposition': 'attachment; filename="DiemDanh_TongHop.xlsx"',
        },
      });

      await attendanceService.exportSummaryExcel('c1', { startDate: '2026-10-01', endDate: '2026-10-31' });

      expect(apiClient.get).toHaveBeenCalledWith('/classes/c1/attendance/export/summary', {
        params: { startDate: '2026-10-01', endDate: '2026-10-31' },
        responseType: 'blob',
      });
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-blob');
    });
  });
});
