import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from './storage';
import type { User, AuthTokens } from '@/types/auth.types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('manages access token correctly', () => {
    expect(storage.getAccessToken()).toBeNull();
    storage.setAccessToken('sample_access_token');
    expect(storage.getAccessToken()).toBe('sample_access_token');
  });

  it('manages refresh token correctly', () => {
    expect(storage.getRefreshToken()).toBeNull();
    storage.setRefreshToken('sample_refresh_token');
    expect(storage.getRefreshToken()).toBe('sample_refresh_token');
  });

  it('stores and retrieves user profile correctly', () => {
    const mockUser: User = {
      id: 'usr_1',
      fullName: 'Cô Hoàng Nhi',
      phone: '0901234567',
      email: 'nhi@vanbynhi.vn',
      role: 'TEACHER',
      avatarUrl: null,
    };

    expect(storage.getUser()).toBeNull();
    storage.setUser(mockUser);
    expect(storage.getUser()).toEqual(mockUser);
  });

  it('sets all auth tokens and clears auth completely', () => {
    const tokens: AuthTokens = {
      accessToken: 'acc_123',
      tokenType: 'Bearer',
      expiresIn: '15m',
      refreshToken: 'ref_123',
    };
    const user: User = {
      id: 'admin_1',
      fullName: 'Quản trị viên',
      phone: '0988888888',
      email: 'admin@vanbynhi.vn',
      role: 'ADMIN',
      avatarUrl: null,
    };

    storage.setAuth(tokens, user);
    expect(storage.getAccessToken()).toBe('acc_123');
    expect(storage.getRefreshToken()).toBe('ref_123');
    expect(storage.getUser()).toEqual(user);

    storage.clearAuth();
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getUser()).toBeNull();
  });
});
