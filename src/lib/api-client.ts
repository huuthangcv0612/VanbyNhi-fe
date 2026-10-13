import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';
import type { RefreshTokenResponse } from '@/types/auth.types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Điều phối refresh token: Mutex & Request Queue để chống race condition
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: đính kèm Bearer token nếu có
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: xử lý 401 và refresh token tự động
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/zalo/exchange') ||
      url.includes('/auth/zalo/link');

    // Nếu mã lỗi là 401 và không phải là route auth và chưa từng retry
    if (error.response?.status === 401 && !isAuthRoute && !originalRequest._retry) {
      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        storage.clearAuth();
        window.dispatchEvent(new CustomEvent('vanbynhi:unauthorized'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Đã có một request khác đang refresh, đưa request hiện tại vào hàng đợi
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi trực tiếp axios không qua apiClient interceptor để tránh vòng lặp
        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 },
        );

        const newAccessToken = response.data.tokens.accessToken;
        const newRefreshToken = response.data.tokens.refreshToken;

        storage.setAccessToken(newAccessToken);
        storage.setRefreshToken(newRefreshToken);

        // Báo cho toàn app biết token đã refresh
        window.dispatchEvent(
          new CustomEvent('vanbynhi:token-refreshed', {
            detail: { accessToken: newAccessToken },
          }),
        );

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        storage.clearAuth();
        window.dispatchEvent(new CustomEvent('vanbynhi:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Trích xuất thông điệp lỗi thân thiện từ phản hồi API
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Yêu cầu quá thời gian chờ (timeout). Vui lòng thử lại sau.';
    }

    if (!error.response) {
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng hoặc đảm bảo backend đang hoạt động.';
    }

    const data = error.response.data as { message?: string | string[]; error?: string } | undefined;
    if (data?.message) {
      if (Array.isArray(data.message)) {
        return data.message.join('. ');
      }
      return data.message;
    }

    switch (error.response.status) {
      case 400:
        return 'Dữ liệu gửi lên không hợp lệ.';
      case 401:
        return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 404:
        return 'Không tìm thấy tài nguyên yêu cầu.';
      case 409:
        return 'Dữ liệu bị xung đột hoặc đã tồn tại trong hệ thống.';
      case 500:
        return 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
      default:
        return `Đã xảy ra lỗi (${error.response.status}). Vui lòng thử lại.`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Đã xảy ra lỗi không xác định.';
}
