import React, { useEffect, useState } from 'react';
import type { User, UserRole, LoginPayload, AuthTokens } from '@/types/auth.types';
import { storage } from '@/lib/storage';
import { authService } from '@/features/auth/services/auth.service';
import { queryClient } from '@/lib/query-client';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      const accessToken = storage.getAccessToken();
      const refreshToken = storage.getRefreshToken();

      if (!accessToken && !refreshToken) {
        storage.clearAuth();
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await authService.getUserMe();
        if (isMounted) {
          setUser(profile);
          storage.setUser(profile);
        }
      } catch {
        if (refreshToken) {
          try {
            const refreshed = await authService.refresh({ refreshToken });
            const newAccess =
              refreshed?.tokens?.accessToken ||
              (refreshed as unknown as { accessToken?: string })?.accessToken;
            const newRefresh =
              refreshed?.tokens?.refreshToken ||
              (refreshed as unknown as { refreshToken?: string })?.refreshToken;

            if (newAccess && newRefresh) {
              storage.setAccessToken(newAccess);
              storage.setRefreshToken(newRefresh);
              const profile = await authService.getUserMe();
              if (isMounted) {
                setUser(profile);
                storage.setUser(profile);
              }
            } else {
              throw new Error('Dữ liệu token không hợp lệ');
            }
          } catch {
            storage.clearAuth();
            if (isMounted) setUser(null);
          }
        } else {
          storage.clearAuth();
          if (isMounted) setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initSession();

    const handleUnauthorized = () => {
      storage.clearAuth();
      setUser(null);
      queryClient.clear();
    };

    window.addEventListener('vanbynhi:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('vanbynhi:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(payload);
      storage.setAuth(response.tokens, response.user);
      setUser(response.user);
      queryClient.clear();
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const refreshToken = storage.getRefreshToken();
      if (refreshToken) {
        try {
          await authService.logout({ refreshToken });
        } catch {
          // Xử lý lỗi im lặng khi logout mạng chập chờn
        }
      }
    } finally {
      storage.clearAuth();
      setUser(null);
      queryClient.clear();
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const profile = await authService.getUserMe();
      setUser(profile);
      storage.setUser(profile);
    } catch {
      // Bỏ qua lỗi
    }
  };

  const setAuthSession = (tokens: AuthTokens, user: User): void => {
    storage.setAuth(tokens, user);
    setUser(user);
    queryClient.clear();
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        hasRole,
        setAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
