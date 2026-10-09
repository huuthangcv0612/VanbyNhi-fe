import { apiClient } from '@/lib/api-client';
import type { User } from '@/types/auth.types';
import type {
  UpdateUserPayload,
  ChangePasswordPayload,
  QueryUsersParams,
  CreateUserPayload,
  UpdateUserStatusPayload,
  UsersListResponse,
} from '../types/user.types';

export const usersService = {
  /**
   * Lấy thông tin cá nhân
   * GET /users/me
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  /**
   * Cập nhật thông tin cá nhân
   * PATCH /users/me
   */
  async updateMe(payload: UpdateUserPayload): Promise<User> {
    const response = await apiClient.patch<User>('/users/me', payload);
    return response.data;
  },

  /**
   * Đổi mật khẩu cá nhân
   * PATCH /users/me/password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>('/users/me/password', payload);
    return response.data;
  },

  /**
   * Lấy danh sách người dùng (ADMIN)
   * GET /users
   */
  async findAll(params?: QueryUsersParams): Promise<UsersListResponse> {
    const response = await apiClient.get<UsersListResponse>('/users', { params });
    return response.data;
  },

  /**
   * Tạo tài khoản mới (ADMIN)
   * POST /users
   */
  async create(payload: CreateUserPayload): Promise<{ message: string; user: User }> {
    const response = await apiClient.post<{ message: string; user: User }>('/users', payload);
    return response.data;
  },

  /**
   * Xem chi tiết người dùng theo ID (ADMIN)
   * GET /users/:id
   */
  async findOne(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Cập nhật thông tin người dùng theo ID (ADMIN)
   * PATCH /users/:id
   */
  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}`, payload);
    return response.data;
  },

  /**
   * Bật/tắt trạng thái hoạt động (ADMIN)
   * PATCH /users/:id/status
   */
  async updateStatus(
    id: string,
    payload: UpdateUserStatusPayload,
  ): Promise<{ message: string; user: User }> {
    const response = await apiClient.patch<{ message: string; user: User }>(
      `/users/${id}/status`,
      payload,
    );
    return response.data;
  },
};
