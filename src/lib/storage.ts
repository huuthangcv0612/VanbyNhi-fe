import type { User, AuthTokens } from '@/types/auth.types';

const ACCESS_TOKEN_KEY = 'vanbynhi_access_token';
const REFRESH_TOKEN_KEY = 'vanbynhi_refresh_token';
const USER_CACHE_KEY = 'vanbynhi_user_profile';

export const storage = {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setAccessToken(token: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // Storage might be full or restricted
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // Storage might be full or restricted
    }
  },

  getUser(): User | null {
    try {
      const data = localStorage.getItem(USER_CACHE_KEY);
      return data ? (JSON.parse(data) as User) : null;
    } catch {
      return null;
    }
  },

  setUser(user: User): void {
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } catch {
      // Storage might be full or restricted
    }
  },

  setAuth(tokens: AuthTokens, user?: User): void {
    this.setAccessToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);
    if (user) {
      this.setUser(user);
    }
  },

  clearAuth(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    } catch {
      // ignore
    }
  },
};
