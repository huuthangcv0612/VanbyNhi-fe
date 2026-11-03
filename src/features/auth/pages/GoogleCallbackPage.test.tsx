import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GoogleCallbackPage } from './GoogleCallbackPage';
import { googleService } from '@/features/google/services/google.service';

const mockNavigate = vi.fn();
const mockSetAuthSession = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    setAuthSession: mockSetAuthSession,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    hasRole: vi.fn(),
  }),
}));

vi.mock('@/features/google/services/google.service', () => ({
  googleService: {
    exchangeTicket: vi.fn(),
    linkAccount: vi.fn(),
    getLoginUrl: () => 'http://localhost:3000/google/login',
  },
}));

describe('GoogleCallbackPage', () => {
  const originalLocation = window.location;
  const originalHistory = window.history;
  const replaceStateSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState = replaceStateSpy;
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    window.history.replaceState = originalHistory.replaceState;
  });

  const setupUrl = (search: string) => {
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        pathname: '/auth/google/callback',
        search,
      },
      writable: true,
      configurable: true,
    });
  };

  it('xử lý khi người dùng từ chối quyền truy cập (access_denied)', () => {
    setupUrl('?error=access_denied&message=Denied');

    render(
      <MemoryRouter>
        <GoogleCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /đăng nhập bị từ chối/i })).toBeInTheDocument();
    expect(screen.getByText(/bạn đã từ chối cấp quyền/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thử đăng nhập lại bằng google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quay lại trang đăng nhập/i })).toBeInTheDocument();
    expect(replaceStateSpy).toHaveBeenCalledWith({}, expect.any(String), '/auth/google/callback');
  });

  it('xử lý khi tài khoản bị khóa (account_inactive)', () => {
    setupUrl('?error=account_inactive');

    render(
      <MemoryRouter>
        <GoogleCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /tài khoản bị khóa/i })).toBeInTheDocument();
    expect(screen.getByText(/tài khoản của bạn đã bị vô hiệu hóa hoặc khóa/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /thử đăng nhập lại bằng google/i })).not.toBeInTheDocument();
  });

  it('xử lý khi nhận được exchange ticket hợp lệ: đổi token và điều hướng theo role', async () => {
    setupUrl('?ticket=valid-google-ticket&isLinked=true');

    const mockResponse = {
      message: 'Đăng nhập thành công',
      isLinked: true,
      user: {
        id: 'u-1',
        fullName: 'Nguyễn Văn A',
        email: 'teacher@hcmus.edu.vn',
        role: 'TEACHER' as const,
      },
      tokens: {
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
        expiresIn: '15m',
        refreshToken: 'mock-refresh-token',
      },
    };

    (googleService.exchangeTicket as any).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <GoogleCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/đang hoàn tất đăng nhập google/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(googleService.exchangeTicket).toHaveBeenCalledWith({ ticket: 'valid-google-ticket' });
      expect(mockSetAuthSession).toHaveBeenCalledWith(mockResponse.tokens, mockResponse.user);
      expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard', { replace: true });
    });
  });

  it('xử lý khi nhận được linkTicket: hiển thị form liên kết tài khoản', () => {
    setupUrl('?linkTicket=valid-link-ticket&isLinked=false&email=newbie@gmail.com');

    render(
      <MemoryRouter>
        <GoogleCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/chưa liên kết tài khoản/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /liên kết tài khoản vanbynhi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xác nhận liên kết & đăng nhập/i })).toBeInTheDocument();
  });

  it('xử lý khi truy cập không có tham số: hiển thị thông báo không hợp lệ', () => {
    setupUrl('');

    render(
      <MemoryRouter>
        <GoogleCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/không tìm thấy thông tin xác thực/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /về trang đăng nhập/i })).toBeInTheDocument();
  });
});
