import { apiClient } from '@/lib/api-client';
import type {
  ClassItem,
  ClassMemberItem,
  QueryClassesParams,
  QueryTeacherClassesParams,
  TeacherCreateClassDto,
  TeacherUpdateClassDto,
  QueryClassMembersParams,
  QueryJoinRequestsParams,
  StudentJoinClassDto,
  StudentClassDetail,
  QueryStudentClassesParams,
  QueryStudentRequestsParams,
  CreateClassPayload,
  UpdateClassPayload,
  UpdateClassStatusPayload,
  ClassesListResponse,
  TeacherClassesResponse,
  ClassMembersResponse,
  JoinRequestsResponse,
  StudentClassesResponse,
  StudentRequestsResponse,
} from '../types/class.types';
import type { ClassStatus } from '@/types/common.types';

/**
 * Service dành cho Giáo viên (TEACHER)
 */
export const teacherClassesService = {
  /**
   * Tạo lớp học mới
   * POST /teacher/classes
   */
  async createClass(payload: TeacherCreateClassDto): Promise<{ message: string; class: ClassItem }> {
    const response = await apiClient.post<{ message: string; class: ClassItem }>(
      '/teacher/classes',
      payload,
    );
    return response.data;
  },

  /**
   * Lấy danh sách lớp học của giáo viên
   * GET /teacher/classes
   */
  async getMyClasses(params?: QueryTeacherClassesParams): Promise<TeacherClassesResponse> {
    const response = await apiClient.get<TeacherClassesResponse>('/teacher/classes', { params });
    return response.data;
  },

  /**
   * Xem chi tiết một lớp học
   * GET /teacher/classes/:classId
   */
  async getClassDetail(classId: string): Promise<ClassItem> {
    const response = await apiClient.get<ClassItem>(`/teacher/classes/${classId}`);
    return response.data;
  },

  /**
   * Sửa thông tin lớp học
   * PATCH /teacher/classes/:classId
   */
  async updateClass(
    classId: string,
    payload: TeacherUpdateClassDto,
  ): Promise<{ message: string; class: ClassItem }> {
    const response = await apiClient.patch<{ message: string; class: ClassItem }>(
      `/teacher/classes/${classId}`,
      payload,
    );
    return response.data;
  },

  /**
   * Cập nhật trạng thái mở/đóng/tạm dừng lớp học
   * PATCH /teacher/classes/:classId/status
   */
  async updateClassStatus(
    classId: string,
    status: ClassStatus,
  ): Promise<{ message: string; class: ClassItem }> {
    const response = await apiClient.patch<{ message: string; class: ClassItem }>(
      `/teacher/classes/${classId}/status`,
      { status },
    );
    return response.data;
  },

  /**
   * Tạo lại mã tham gia mới cho lớp
   * POST /teacher/classes/:classId/regenerate-join-code
   */
  async regenerateJoinCode(
    classId: string,
  ): Promise<{ message: string; class: { id: string; name: string; joinCode: string; updatedAt: string } }> {
    const response = await apiClient.post<{
      message: string;
      class: { id: string; name: string; joinCode: string; updatedAt: string };
    }>(`/teacher/classes/${classId}/regenerate-join-code`);
    return response.data;
  },

  /**
   * Lấy danh sách thành viên của lớp học
   * GET /teacher/classes/:classId/members
   */
  async getClassMembers(
    classId: string,
    params?: QueryClassMembersParams,
  ): Promise<ClassMembersResponse> {
    const response = await apiClient.get<ClassMembersResponse>(
      `/teacher/classes/${classId}/members`,
      { params },
    );
    return response.data;
  },

  /**
   * Lấy danh sách yêu cầu tham gia chờ duyệt (PENDING)
   * GET /teacher/classes/:classId/join-requests
   */
  async getJoinRequests(
    classId: string,
    params?: QueryJoinRequestsParams,
  ): Promise<JoinRequestsResponse> {
    const response = await apiClient.get<JoinRequestsResponse>(
      `/teacher/classes/${classId}/join-requests`,
      { params },
    );
    return response.data;
  },

  /**
   * Duyệt yêu cầu tham gia lớp học
   * POST /teacher/classes/:classId/join-requests/:membershipId/approve
   */
  async approveJoinRequest(
    classId: string,
    membershipId: string,
  ): Promise<{ message: string; membership: ClassMemberItem }> {
    const response = await apiClient.post<{ message: string; membership: ClassMemberItem }>(
      `/teacher/classes/${classId}/join-requests/${membershipId}/approve`,
    );
    return response.data;
  },

  /**
   * Từ chối yêu cầu tham gia lớp học
   * POST /teacher/classes/:classId/join-requests/:membershipId/reject
   */
  async rejectJoinRequest(
    classId: string,
    membershipId: string,
  ): Promise<{ message: string; membership: ClassMemberItem }> {
    const response = await apiClient.post<{ message: string; membership: ClassMemberItem }>(
      `/teacher/classes/${classId}/join-requests/${membershipId}/reject`,
    );
    return response.data;
  },

  /**
   * Xóa học sinh khỏi lớp học (chuyển sang REMOVED)
   * DELETE /teacher/classes/:classId/members/:studentId
   */
  async removeMember(
    classId: string,
    studentId: string,
  ): Promise<{ message: string; membership: ClassMemberItem }> {
    const response = await apiClient.delete<{ message: string; membership: ClassMemberItem }>(
      `/teacher/classes/${classId}/members/${studentId}`,
    );
    return response.data;
  },
};

/**
 * Service dành cho Học sinh (STUDENT)
 */
export const studentClassesService = {
  /**
   * Gửi yêu cầu tham gia lớp bằng joinCode
   * POST /student/classes/join
   */
  async joinClass(payload: StudentJoinClassDto): Promise<{ message: string; membership: unknown }> {
    const response = await apiClient.post<{ message: string; membership: unknown }>(
      '/student/classes/join',
      payload,
    );
    return response.data;
  },

  /**
   * Lấy danh sách lớp đã tham gia thành công (ACTIVE)
   * GET /student/classes
   */
  async getMyClasses(params?: QueryStudentClassesParams): Promise<StudentClassesResponse> {
    const response = await apiClient.get<StudentClassesResponse>('/student/classes', { params });
    return response.data;
  },

  /**
   * Xem chi tiết lớp học học sinh được phép xem
   * GET /student/classes/:classId
   */
  async getClassDetail(classId: string): Promise<StudentClassDetail> {
    const response = await apiClient.get<StudentClassDetail>(`/student/classes/${classId}`);
    return response.data;
  },

  /**
   * Xem lịch sử các yêu cầu tham gia lớp
   * GET /student/classes/my-requests
   */
  async getMyRequests(params?: QueryStudentRequestsParams): Promise<StudentRequestsResponse> {
    const response = await apiClient.get<StudentRequestsResponse>('/student/classes/my-requests', {
      params,
    });
    return response.data;
  },

  /**
   * Học sinh tự rời khỏi lớp học
   * DELETE /student/classes/:classId/membership
   */
  async leaveClass(classId: string): Promise<{ message: string; membership: unknown }> {
    const response = await apiClient.delete<{ message: string; membership: unknown }>(
      `/student/classes/${classId}/membership`,
    );
    return response.data;
  },
};

/**
 * Service lớp học chung / Quản trị viên (ADMIN)
 */
export const classesService = {
  /**
   * Danh sách lớp học (ADMIN)
   * GET /classes
   */
  async findAll(params?: QueryClassesParams): Promise<ClassesListResponse> {
    const response = await apiClient.get<ClassesListResponse>('/classes', { params });
    return response.data;
  },

  /**
   * Chi tiết lớp học
   * GET /classes/:id
   */
  async findOne(id: string): Promise<ClassItem> {
    const response = await apiClient.get<ClassItem>(`/classes/${id}`);
    return response.data;
  },

  /**
   * Tạo lớp học mới (ADMIN)
   * POST /classes
   */
  async create(payload: CreateClassPayload): Promise<ClassItem> {
    const response = await apiClient.post<ClassItem>('/classes', payload);
    return response.data;
  },

  /**
   * Cập nhật thông tin lớp học (ADMIN)
   * PATCH /classes/:id
   */
  async update(id: string, payload: UpdateClassPayload): Promise<ClassItem> {
    const response = await apiClient.patch<ClassItem>(`/classes/${id}`, payload);
    return response.data;
  },

  /**
   * Cập nhật trạng thái lớp học (ADMIN)
   * PATCH /classes/:id/status
   */
  async updateStatus(id: string, payload: UpdateClassStatusPayload): Promise<ClassItem> {
    const response = await apiClient.patch<ClassItem>(`/classes/${id}/status`, payload);
    return response.data;
  },
};
