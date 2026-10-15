import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { storage } from '@/lib/storage';
import { authService } from '@/features/auth/services/auth.service';

vi.mock('@/lib/storage', () => ({
  storage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    getUser: vi.fn(),
    setUser: vi.fn(),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setAuth: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getUserMe: vi.fn(),
    refresh: vi.fn(),
  },
}));

function ConsumerComponent() {
  const { user, isAuthenticated, isLoading, login, logout, hasRole } = useAuth();

  if (isLoading) {
    return <div>Loading Auth State...</div>;
  }

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</div>
      <div data-testid="user-name">{user?.fullName || 'No User'}</div>
      <div data-testid="user-role">{user?.role || 'No Role'}</div>
      <div data-testid="is-admin">{hasRole(['ADMIN']) ? 'Yes Admin' : 'Not Admin'}</div>

      <button
        onClick={() => login({ identifier: '0901234567', password: 'password123' })}
      >
        Trigger Login
      </button>

      <button onClick={() => logout()}>Trigger Logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores session successfully when access token is valid', async () => {
    const mockUser = {
      id: 'u1',
      fullName: 'Trần Văn An',
      phone: '0901234567',
      email: 'an@example.com',
      role: 'TEACHER' as const,
      avatarUrl: null,
    };

    vi.mocked(storage.getAccessToken).mockReturnValue('valid_access_token');
    vi.mocked(storage.getRefreshToken).mockReturnValue('valid_refresh_token');
    vi.mocked(storage.getUser).mockReturnValue(null);
    vi.mocked(authService.getUserMe).mockResolvedValueOnce(mockUser);

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    expect(screen.getByText('Loading Auth State...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Trần Văn An');
      expect(screen.getByTestId('user-role')).toHaveTextContent('TEACHER');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('Not Admin');
    });

    expect(storage.setUser).toHaveBeenCalledWith(mockUser);
  });

  it('restores session by refreshing token when access token expired', async () => {
    const mockUser = {
      id: 'u2',
      fullName: 'Lê Quản Trị',
      phone: '0909999888',
      email: 'admin@vanbynhi.vn',
      role: 'ADMIN' as const,
      avatarUrl: null,
    };

    vi.mocked(storage.getAccessToken).mockReturnValue('expired_token');
    vi.mocked(storage.getRefreshToken).mockReturnValue('valid_refresh');
    vi.mocked(storage.getUser).mockReturnValue(null);

    // First call to getUserMe fails (401 expired)
    vi.mocked(authService.getUserMe).mockRejectedValueOnce(new Error('Unauthorized'));
    // Refresh succeeds
    vi.mocked(authService.refresh).mockResolvedValueOnce({
      message: 'Token refreshed',
      tokens: {
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
        tokenType: 'Bearer',
        expiresIn: '15m',
      },
    });
    // Second call to getUserMe succeeds
    vi.mocked(authService.getUserMe).mockResolvedValueOnce(mockUser);

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Lê Quản Trị');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('Yes Admin');
    });

    expect(storage.setAccessToken).toHaveBeenCalledWith('new_access');
    expect(storage.setRefreshToken).toHaveBeenCalledWith('new_refresh');
  });

  it('clears auth and stays unauthenticated when no tokens are found', async () => {
    vi.mocked(storage.getAccessToken).mockReturnValue(null);
    vi.mocked(storage.getRefreshToken).mockReturnValue(null);
    vi.mocked(storage.getUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    });

    expect(storage.clearAuth).toHaveBeenCalled();
  });

  it('handles login properly and updates auth state', async () => {
    vi.mocked(storage.getAccessToken).mockReturnValue(null);
    vi.mocked(storage.getRefreshToken).mockReturnValue(null);
    vi.mocked(storage.getUser).mockReturnValue(null);

    const loggedInUser = {
      id: 'u3',
      fullName: 'Học sinh mới',
      phone: '0901234567',
      email: 'hs@example.com',
      role: 'STUDENT' as const,
      avatarUrl: null,
    };

    vi.mocked(authService.login).mockResolvedValueOnce({
      message: 'Đăng nhập thành công',
      user: loggedInUser,
      tokens: {
        accessToken: 'login_access',
        refreshToken: 'login_refresh',
        tokenType: 'Bearer',
        expiresIn: '15m',
      },
    });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Trigger Login' }));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Học sinh mới');
      expect(screen.getByTestId('user-role')).toHaveTextContent('STUDENT');
    });

    expect(storage.setAuth).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'login_access' }),
      loggedInUser,
    );
  });

  it('handles logout by calling backend revocation and clearing storage', async () => {
    const mockUser = {
      id: 'u1',
      fullName: 'Người dùng',
      phone: '0901234567',
      email: 'nguoidung@example.com',
      role: 'STUDENT' as const,
      avatarUrl: null,
    };

    vi.mocked(storage.getAccessToken).mockReturnValue('some_access');
    vi.mocked(storage.getRefreshToken).mockReturnValue('some_refresh');
    vi.mocked(storage.getUser).mockReturnValue(mockUser);
    vi.mocked(authService.getUserMe).mockResolvedValueOnce(mockUser);
    vi.mocked(authService.logout).mockResolvedValueOnce({ message: 'Đăng xuất thành công' });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Trigger Logout' }));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    });

    expect(authService.logout).toHaveBeenCalledWith({ refreshToken: 'some_refresh' });
    expect(storage.clearAuth).toHaveBeenCalled();
  });
});
