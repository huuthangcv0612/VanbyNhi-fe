import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teacherClassesService, studentClassesService } from './classes.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('teacherClassesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createClass: sends POST /teacher/classes with correct payload', async () => {
    const mockRes = {
      message: 'Tạo lớp học thành công',
      class: { id: 'c1', name: 'Lớp 12A', joinCode: '8AK29P', status: 'ACTIVE' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

    const payload = {
      name: 'Lớp 12A',
      description: 'Luyện thi THPT',
      maxStudents: 30,
      monthlyTuition: 500000,
    };
    const res = await teacherClassesService.createClass(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/teacher/classes', payload);
    expect(res).toEqual(mockRes);
  });

  it('getMyClasses: sends GET /teacher/classes with params', async () => {
    const mockRes = {
      items: [{ id: 'c1', name: 'Lớp 12A', activeStudentCount: 15 }],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

    const res = await teacherClassesService.getMyClasses({ page: 1, limit: 10, status: 'ACTIVE' });

    expect(apiClient.get).toHaveBeenCalledWith('/teacher/classes', {
      params: { page: 1, limit: 10, status: 'ACTIVE' },
    });
    expect(res).toEqual(mockRes);
  });

  it('getClassDetail: sends GET /teacher/classes/:classId', async () => {
    const mockRes = {
      id: 'c1',
      name: 'Lớp 12A',
      activeStudentCount: 15,
      pendingRequestsCount: 2,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

    const res = await teacherClassesService.getClassDetail('c1');

    expect(apiClient.get).toHaveBeenCalledWith('/teacher/classes/c1');
    expect(res).toEqual(mockRes);
  });

  it('updateClass: sends PATCH /teacher/classes/:classId', async () => {
    const mockRes = {
      message: 'Cập nhật thành công',
      class: { id: 'c1', name: 'Lớp 12A mới' },
    };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockRes });

    const res = await teacherClassesService.updateClass('c1', { name: 'Lớp 12A mới' });

    expect(apiClient.patch).toHaveBeenCalledWith('/teacher/classes/c1', { name: 'Lớp 12A mới' });
    expect(res).toEqual(mockRes);
  });

  it('updateClassStatus: sends PATCH /teacher/classes/:classId/status', async () => {
    const mockRes = {
      message: 'Cập nhật trạng thái thành CLOSED thành công',
      class: { id: 'c1', status: 'CLOSED' },
    };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockRes });

    const res = await teacherClassesService.updateClassStatus('c1', 'CLOSED');

    expect(apiClient.patch).toHaveBeenCalledWith('/teacher/classes/c1/status', { status: 'CLOSED' });
    expect(res).toEqual(mockRes);
  });

  it('regenerateJoinCode: sends POST /teacher/classes/:classId/regenerate-join-code', async () => {
    const mockRes = {
      message: 'Tạo lại mã tham gia thành công',
      class: { id: 'c1', name: 'Lớp 12A', joinCode: 'NEW99CODE', updatedAt: '2026-10-12T00:00:00Z' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

    const res = await teacherClassesService.regenerateJoinCode('c1');

    expect(apiClient.post).toHaveBeenCalledWith('/teacher/classes/c1/regenerate-join-code');
    expect(res).toEqual(mockRes);
  });

  it('approveJoinRequest: sends POST /teacher/classes/:classId/join-requests/:membershipId/approve', async () => {
    const mockRes = {
      message: 'Duyệt yêu cầu thành công',
      membership: { id: 'm1', status: 'ACTIVE' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

    const res = await teacherClassesService.approveJoinRequest('c1', 'm1');

    expect(apiClient.post).toHaveBeenCalledWith('/teacher/classes/c1/join-requests/m1/approve');
    expect(res).toEqual(mockRes);
  });

  it('rejectJoinRequest: sends POST /teacher/classes/:classId/join-requests/:membershipId/reject', async () => {
    const mockRes = {
      message: 'Đã từ chối',
      membership: { id: 'm1', status: 'REJECTED' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

    const res = await teacherClassesService.rejectJoinRequest('c1', 'm1');

    expect(apiClient.post).toHaveBeenCalledWith('/teacher/classes/c1/join-requests/m1/reject');
    expect(res).toEqual(mockRes);
  });

  it('removeMember: sends DELETE /teacher/classes/:classId/members/:studentId', async () => {
    const mockRes = {
      message: 'Đã xóa học sinh khỏi lớp',
      membership: { id: 'm1', status: 'REMOVED' },
    };
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: mockRes });

    const res = await teacherClassesService.removeMember('c1', 's1');

    expect(apiClient.delete).toHaveBeenCalledWith('/teacher/classes/c1/members/s1');
    expect(res).toEqual(mockRes);
  });
});

describe('studentClassesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joinClass: sends POST /student/classes/join with joinCode', async () => {
    const mockRes = {
      message: 'Gửi yêu cầu tham gia lớp học thành công',
      membership: { id: 'm1', status: 'PENDING' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

    const res = await studentClassesService.joinClass({ joinCode: '8AK29P' });

    expect(apiClient.post).toHaveBeenCalledWith('/student/classes/join', { joinCode: '8AK29P' });
    expect(res).toEqual(mockRes);
  });

  it('getMyClasses: sends GET /student/classes', async () => {
    const mockRes = {
      items: [
        {
          membershipId: 'm1',
          class: { id: 'c1', name: 'Lớp 12A', status: 'ACTIVE' },
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

    const res = await studentClassesService.getMyClasses({ page: 1, limit: 10 });

    expect(apiClient.get).toHaveBeenCalledWith('/student/classes', {
      params: { page: 1, limit: 10 },
    });
    expect(res).toEqual(mockRes);
  });

  it('getClassDetail: sends GET /student/classes/:classId', async () => {
    const mockRes = {
      id: 'c1',
      name: 'Lớp 12A',
      status: 'ACTIVE',
      membershipId: 'm1',
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

    const res = await studentClassesService.getClassDetail('c1');

    expect(apiClient.get).toHaveBeenCalledWith('/student/classes/c1');
    expect(res).toEqual(mockRes);
  });

  it('getMyRequests: sends GET /student/classes/my-requests', async () => {
    const mockRes = {
      items: [
        {
          id: 'm1',
          status: 'PENDING',
          class: { id: 'c1', name: 'Lớp 12A' },
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

    const res = await studentClassesService.getMyRequests({ status: 'PENDING' });

    expect(apiClient.get).toHaveBeenCalledWith('/student/classes/my-requests', {
      params: { status: 'PENDING' },
    });
    expect(res).toEqual(mockRes);
  });

  it('leaveClass: sends DELETE /student/classes/:classId/membership', async () => {
    const mockRes = {
      message: 'Rời lớp học thành công',
      membership: { id: 'm1', status: 'LEFT' },
    };
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: mockRes });

    const res = await studentClassesService.leaveClass('c1');

    expect(apiClient.delete).toHaveBeenCalledWith('/student/classes/c1/membership');
    expect(res).toEqual(mockRes);
  });
});
