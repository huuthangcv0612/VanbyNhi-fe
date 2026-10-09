import { apiClient } from '@/lib/api-client';
import type {
  LoginPayload,
  LoginResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
  LogoutResponse,
  AuthMeResponse,
  User,
} from '@/types/auth.types';

export const authService = {
  /**
   * Đăng nhập bằng Email hoặc Số điện thoại + Mật khẩu
   * POST /auth/login
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },

  /**
   * Làm mới Access Token và xoay vòng Refresh Token
   * POST /auth/refresh
   */
  async refresh(payload: RefreshTokenPayload): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', payload);
    return response.data;
  },

  /**
   * Đăng xuất hệ thống và thu hồi refresh token phía server
   * POST /auth/logout
   */
  async logout(payload: RefreshTokenPayload): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>('/auth/logout', payload);
    return response.data;
  },

  /**
   * Lấy thông tin cơ bản của token hiện tại
   * GET /auth/me
   */
  async getAuthMe(): Promise<AuthMeResponse> {
    const response = await apiClient.get<AuthMeResponse>('/auth/me');
    return response.data;
  },

  /**
   * Lấy hồ sơ người dùng đầy đủ
   * GET /users/me
   */
  async getUserMe(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },
};
