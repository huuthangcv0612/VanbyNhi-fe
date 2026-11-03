import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleService } from './google.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  API_BASE_URL: 'http://localhost:3000',
}));

describe('googleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getLoginUrl: returns URL for Google login', () => {
    const url = googleService.getLoginUrl();
    expect(url).toBe('http://localhost:3000/google/login');
  });

  it('exchangeTicket: sends POST /google/exchange', async () => {
    const mockData = {
      message: 'Đăng nhập thành công',
      user: { id: 'u1' },
      tokens: { accessToken: 'token' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockData });

    const result = await googleService.exchangeTicket({ ticket: 'ticket-123' });

    expect(apiClient.post).toHaveBeenCalledWith('/google/exchange', { ticket: 'ticket-123' });
    expect(result).toEqual(mockData);
  });

  it('linkAccount: sends POST /google/link', async () => {
    const mockData = {
      message: 'Liên kết thành công',
      user: { id: 'u1' },
      tokens: { accessToken: 'token' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockData });

    const result = await googleService.linkAccount({
      linkTicket: 'link-123',
      identifier: 'teacher@school.edu.vn',
      password: 'password123',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/google/link', {
      linkTicket: 'link-123',
      identifier: 'teacher@school.edu.vn',
      password: 'password123',
    });
    expect(result).toEqual(mockData);
  });

  it('getConnectionStatus: sends GET /google/connection', async () => {
    const mockData = {
      isConnected: true,
      status: 'CONNECTED' as const,
      email: 'teacher@school.edu.vn',
      lastConnectedAt: '2026-10-19T08:00:00.000Z',
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const result = await googleService.getConnectionStatus();

    expect(apiClient.get).toHaveBeenCalledWith('/google/connection');
    expect(result).toEqual(mockData);
  });

  it('getConnectUrl: sends GET /google/connect?format=json', async () => {
    const mockData = {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?mock=true',
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const result = await googleService.getConnectUrl();

    expect(apiClient.get).toHaveBeenCalledWith('/google/connect', {
      params: { format: 'json' },
    });
    expect(result).toEqual(mockData);
  });

  it('disconnect: sends DELETE /google/connection', async () => {
    const mockData = {
      message: 'Ngắt liên kết tài khoản Google thành công',
    };
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: mockData });

    const result = await googleService.disconnect();

    expect(apiClient.delete).toHaveBeenCalledWith('/google/connection');
    expect(result).toEqual(mockData);
  });
});
