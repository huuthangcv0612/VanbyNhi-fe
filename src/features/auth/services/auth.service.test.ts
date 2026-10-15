import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  API_BASE_URL: 'http://localhost:3000',
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authService - Core authentication methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register posts to /auth/register with RegisterPayload', async () => {
    const payload = {
      phone: '0901234567',
      password: 'Password123',
      fullName: 'Nguyễn Văn A',
      email: 'a@example.com',
    };
    const mockResponse = {
      data: {
        message: 'Đăng ký thành công',
        user: { id: 'u1', fullName: 'Nguyễn Văn A', phone: '0901234567', role: 'STUDENT' },
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const res = await authService.register(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', payload);
    expect(res).toEqual(mockResponse.data);
  });

  it('login posts to /auth/login with identifier and password', async () => {
    const payload = {
      identifier: '0901234567',
      password: 'Password123',
    };
    const mockResponse = {
      data: {
        message: 'Đăng nhập thành công',
        user: { id: 'u1', fullName: 'Nguyễn Văn A', phone: '0901234567', role: 'STUDENT' },
        tokens: {
          accessToken: 'access_123',
          refreshToken: 'refresh_123',
          tokenType: 'Bearer',
          expiresIn: '15m',
        },
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const res = await authService.login(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', payload);
    expect(res).toEqual(mockResponse.data);
  });

  it('refresh posts to /auth/refresh with refreshToken', async () => {
    const payload = { refreshToken: 'old_refresh_token' };
    const mockResponse = {
      data: {
        message: 'Token đã được làm mới',
        tokens: {
          accessToken: 'new_access_token',
          refreshToken: 'new_refresh_token',
          tokenType: 'Bearer',
          expiresIn: '15m',
        },
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const res = await authService.refresh(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', payload);
    expect(res).toEqual(mockResponse.data);
  });

  it('logout posts to /auth/logout with refreshToken', async () => {
    const payload = { refreshToken: 'refresh_to_revoke' };
    const mockResponse = {
      data: { message: 'Đăng xuất thành công' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const res = await authService.logout(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', payload);
    expect(res).toEqual(mockResponse.data);
  });

  it('getAuthMe gets /auth/me', async () => {
    const mockResponse = {
      data: {
        user: {
          sub: 'u1',
          role: 'ADMIN' as const,
          phone: '0901234567',
          email: 'admin@vanbynhi.vn',
        },
      },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

    const res = await authService.getAuthMe();

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    expect(res).toEqual(mockResponse.data);
  });

  it('getUserMe gets /users/me', async () => {
    const mockResponse = {
      data: {
        id: 'u1',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        email: 'a@example.com',
        role: 'STUDENT' as const,
        avatarUrl: null,
      },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

    const res = await authService.getUserMe();

    expect(apiClient.get).toHaveBeenCalledWith('/users/me');
    expect(res).toEqual(mockResponse.data);
  });
});

describe('authService - Zalo OAuth methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getZaloLoginUrl returns url pointing to /auth/zalo', () => {
    const url = authService.getZaloLoginUrl();
    expect(url).toContain('/auth/zalo');
  });

  it('exchangeZaloTicket posts to /auth/zalo/exchange with ticket', async () => {
    const mockResponse = {
      data: {
        message: 'Đăng nhập thành công',
        isLinked: true,
        user: { id: 'u1', fullName: 'Test' },
        tokens: { accessToken: 'tok1', refreshToken: 'tok2' },
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const res = await authService.exchangeZaloTicket({ ticket: 'dummy_ticket' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/zalo/exchange', {
      ticket: 'dummy_ticket',
    });
    expect(res).toEqual(mockResponse.data);
  });

  it('linkZaloAccount posts to /auth/zalo/link with required credentials', async () => {
    const mockResponse = {
      data: {
        message: 'Liên kết thành công',
        user: { id: 'u1', fullName: 'Test' },
        tokens: { accessToken: 'tok1', refreshToken: 'tok2' },
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const payload = {
      linkTicket: 'link_123',
      identifier: 'user@vanbynhi.vn',
      password: 'password123',
    };
    const res = await authService.linkZaloAccount(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/zalo/link', payload);
    expect(res).toEqual(mockResponse.data);
  });

  it('unlinkZaloAccount posts to /auth/zalo/unlink', async () => {
    const mockResponse = {
      data: {
        message: 'Hủy liên kết tài khoản Zalo thành công',
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const res = await authService.unlinkZaloAccount();

    expect(apiClient.post).toHaveBeenCalledWith('/auth/zalo/unlink');
    expect(res).toEqual(mockResponse.data);
  });
});
