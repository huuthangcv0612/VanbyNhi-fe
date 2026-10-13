import { apiClient } from '@/lib/api-client';
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
  LogoutResponse,
  AuthMeResponse,
  User,
  ExchangeZaloTicketPayload,
  ExchangeZaloResponse,
  LinkZaloPayload,
  LinkZaloResponse,
  UnlinkZaloResponse,
} from '@/types/auth.types';

export const authService = {
  /**
   * Đăng ký tài khoản mới (mặc định vai trò STUDENT)
   * POST /auth/register
   */
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return response.data;
  },

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

  /**
   * Lấy URL chuyển hướng tới Backend để bắt đầu quy trình Zalo OAuth V4
   * GET /auth/zalo
   */
  getZaloLoginUrl(): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/auth/zalo`;
  },

  /**
   * Đổi exchange ticket lấy access token và refresh token
   * POST /auth/zalo/exchange
   */
  async exchangeZaloTicket(payload: ExchangeZaloTicketPayload): Promise<ExchangeZaloResponse> {
    const response = await apiClient.post<ExchangeZaloResponse>('/auth/zalo/exchange', payload);
    return response.data;
  },

  /**
   * Xác minh tài khoản VanbyNhi và liên kết với tài khoản Zalo
   * POST /auth/zalo/link
   */
  async linkZaloAccount(payload: LinkZaloPayload): Promise<LinkZaloResponse> {
    const response = await apiClient.post<LinkZaloResponse>('/auth/zalo/link', payload);
    return response.data;
  },

  /**
   * Hủy liên kết tài khoản Zalo của người dùng đang đăng nhập
   * POST /auth/zalo/unlink
   */
  async unlinkZaloAccount(): Promise<UnlinkZaloResponse> {
    const response = await apiClient.post<UnlinkZaloResponse>('/auth/zalo/unlink');
    return response.data;
  },
};
