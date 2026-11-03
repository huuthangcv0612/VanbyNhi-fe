import { apiClient, API_BASE_URL } from '@/lib/api-client';
import type {
  GoogleConnectionResponse,
  GoogleConnectResponse,
  GoogleDisconnectResponse,
  GoogleExchangePayload,
  GoogleExchangeResponse,
  GoogleLinkPayload,
  GoogleLinkResponse,
} from '../types/google.types';

export const googleService = {
  /**
   * Lấy URL chuyển hướng tới Backend để bắt đầu đăng nhập bằng Google
   * GET /google/login
   */
  getLoginUrl(): string {
    return `${API_BASE_URL}/google/login`;
  },

  /**
   * Đổi exchange ticket lấy session JWT đăng nhập VanbyNhi
   * POST /google/exchange
   */
  async exchangeTicket(payload: GoogleExchangePayload): Promise<GoogleExchangeResponse> {
    const response = await apiClient.post<GoogleExchangeResponse>('/google/exchange', payload);
    return response.data;
  },

  /**
   * Xác minh mật khẩu và liên kết tài khoản VanbyNhi với Google
   * POST /google/link
   */
  async linkAccount(payload: GoogleLinkPayload): Promise<GoogleLinkResponse> {
    const response = await apiClient.post<GoogleLinkResponse>('/google/link', payload);
    return response.data;
  },

  /**
   * Xem trạng thái liên kết Google Workspace của người dùng
   * GET /google/connection
   */
  async getConnectionStatus(): Promise<GoogleConnectionResponse> {
    const response = await apiClient.get<GoogleConnectionResponse>('/google/connection');
    return response.data;
  },

  /**
   * Lấy URL authorization để điều hướng người dùng sang Google OAuth (dành cho Cài đặt giáo viên)
   * GET /google/connect?format=json
   */
  async getConnectUrl(): Promise<GoogleConnectResponse> {
    const response = await apiClient.get<GoogleConnectResponse>('/google/connect', {
      params: { format: 'json' },
    });
    return response.data;
  },

  /**
   * Ngắt liên kết tài khoản Google Workspace
   * DELETE /google/connection
   */
  async disconnect(): Promise<GoogleDisconnectResponse> {
    const response = await apiClient.delete<GoogleDisconnectResponse>('/google/connection');
    return response.data;
  },
};
