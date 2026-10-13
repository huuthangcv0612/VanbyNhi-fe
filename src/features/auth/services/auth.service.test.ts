import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

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
