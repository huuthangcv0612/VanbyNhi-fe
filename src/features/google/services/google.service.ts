import { apiClient } from '@/lib/api-client';
import type {
  GoogleConnectionResponse,
  GoogleConnectResponse,
  GoogleDisconnectResponse,
} from '../types/google.types';

export const googleService = {
  /**
   * Xem trạng thái liên kết Google Workspace của người dùng
   * GET /google/connection
   */
  async getConnectionStatus(): Promise<GoogleConnectionResponse> {
    const response = await apiClient.get<GoogleConnectionResponse>('/google/connection');
    return response.data;
  },

  /**
   * Lấy URL authorization để điều hướng người dùng sang Google OAuth
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
