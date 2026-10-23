import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { InitialPageLoader } from './InitialPageLoader';
import * as useAuthModule from '@/features/auth/hooks/useAuth';

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('InitialPageLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('runs animation for at least 1 cycle (minDurationMs) when page is not hanging', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: '1', role: 'STUDENT', fullName: 'User', phone: '0901234567', email: null, avatarUrl: null },
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <InitialPageLoader minDurationMs={2000}>
        <div data-testid="app-content">Trang chính</div>
      </InitialPageLoader>,
    );

    // Initial state: loading screen is visible
    expect(screen.getByTestId('initial-page-loader')).toBeInTheDocument();
    expect(screen.getByText(/đang chuẩn bị trang web.../i)).toBeInTheDocument();

    // After 1000ms (< minDurationMs): loading screen is STILL visible
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('initial-page-loader')).toBeInTheDocument();

    // After reaching 2000ms: minDuration reached and isLoading is false -> starts exiting
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Wait for exit transition (350ms)
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.queryByTestId('initial-page-loader')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('continues running animation continuously when page is hanging (isLoading remains true)', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <InitialPageLoader minDurationMs={2000}>
        <div data-testid="app-content">Trang chính</div>
      </InitialPageLoader>,
    );

    // Even after 5000ms, if page is hanging, loader continues running continuously
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('initial-page-loader')).toBeInTheDocument();
  });
});
