import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ZaloCallbackPage } from './ZaloCallbackPage';
import { authService } from '@/features/auth/services/auth.service';

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

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: {
    exchangeZaloTicket: vi.fn(),
    linkZaloAccount: vi.fn(),
    getZaloLoginUrl: () => 'http://localhost:3000/auth/zalo',
  },
}));

describe('ZaloCallbackPage', () => {
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
        pathname: '/auth/zalo/callback',
        search,
      },
      writable: true,
      configurable: true,
    });
  };

  it('handles error=zalo_access_denied by displaying user denied message and retry button', () => {
    setupUrl('?error=zalo_access_denied&error_description=Denied');

    render(
      <MemoryRouter>
        <ZaloCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /từ chối cấp quyền/i })).toBeInTheDocument();
    expect(screen.getByText(/bạn đã hủy hoặc từ chối cấp quyền truy cập/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thử lại bằng zalo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quay lại đăng nhập/i })).toBeInTheDocument();
    expect(replaceStateSpy).toHaveBeenCalledWith({}, expect.any(String), '/auth/zalo/callback');
  });

  it('handles error=account_inactive by displaying account locked warning without retry button', () => {
    setupUrl('?error=account_inactive');

    render(
      <MemoryRouter>
        <ZaloCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/tài khoản đã bị khóa/i)).toBeInTheDocument();
    expect(screen.getByText(/tài khoản của bạn đã bị vô hiệu hóa hoặc khóa/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /thử lại bằng zalo/i })).not.toBeInTheDocument();
  });

  it('handles error=state_expired by displaying session expired message', () => {
    setupUrl('?error=state_expired');

    render(
      <MemoryRouter>
        <ZaloCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/phiên đăng nhập hết hạn/i)).toBeInTheDocument();
  });

  it('successfully exchanges ticket and navigates to student dashboard for STUDENT role', async () => {
    setupUrl('?ticket=exchange_123&isLinked=true');

    const mockResponse = {
      message: 'Đăng nhập thành công',
      isLinked: true,
      user: {
        id: 'std_1',
        fullName: 'Học sinh A',
        role: 'STUDENT' as const,
        phone: '0912345678',
        email: 'hocsinh@vanbynhi.vn',
        avatarUrl: null,
      },
      tokens: {
        accessToken: 'jwt_access',
        tokenType: 'Bearer',
        expiresIn: '15m',
        refreshToken: 'refresh_tok',
      },
    };

    vi.mocked(authService.exchangeZaloTicket).mockResolvedValueOnce(mockResponse);

    render(
      <MemoryRouter>
        <ZaloCallbackPage />
      </MemoryRouter>,
    );

    expect(replaceStateSpy).toHaveBeenCalledWith({}, expect.any(String), '/auth/zalo/callback');
    expect(screen.getByText(/đang hoàn tất đăng nhập zalo.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(authService.exchangeZaloTicket).toHaveBeenCalledTimes(1);
      expect(authService.exchangeZaloTicket).toHaveBeenCalledWith({ ticket: 'exchange_123' });
      expect(mockSetAuthSession).toHaveBeenCalledWith(mockResponse.tokens, mockResponse.user);
      expect(mockNavigate).toHaveBeenCalledWith('/student/dashboard', { replace: true });
    });
  });

  it('navigates to teacher dashboard for TEACHER role', async () => {
    setupUrl('?ticket=exchange_teacher&isLinked=true');

    vi.mocked(authService.exchangeZaloTicket).mockResolvedValueOnce({
      message: 'Đăng nhập thành công',
      isLinked: true,
      user: {
        id: 't_1',
        fullName: 'Giáo viên B',
        role: 'TEACHER' as const,
        phone: '0987654321',
        email: 'giaovien@vanbynhi.vn',
        avatarUrl: null,
      },
      tokens: {
        accessToken: 'jwt_access',
        tokenType: 'Bearer',
        expiresIn: '15m',
        refreshToken: 'refresh_tok',
      },
    });

    render(
      <MemoryRouter>
        <ZaloCallbackPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard', { replace: true });
    });
  });

  it('navigates to admin dashboard for ADMIN role', async () => {
    setupUrl('?ticket=exchange_admin&isLinked=true');

    vi.mocked(authService.exchangeZaloTicket).mockResolvedValueOnce({
      message: 'Đăng nhập thành công',
      isLinked: true,
      user: {
        id: 'adm_1',
        fullName: 'Admin C',
        role: 'ADMIN' as const,
        phone: '0900000000',
        email: 'admin@vanbynhi.vn',
        avatarUrl: null,
      },
      tokens: {
        accessToken: 'jwt_access',
        tokenType: 'Bearer',
        expiresIn: '15m',
        refreshToken: 'refresh_tok',
      },
    });

    render(
      <MemoryRouter>
        <ZaloCallbackPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
    });
  });

  it('displays error UI when exchange ticket is expired or invalid', async () => {
    setupUrl('?ticket=expired_ticket&isLinked=true');

    vi.mocked(authService.exchangeZaloTicket).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: { message: 'Mã ticket không hợp lệ hoặc đã hết hạn' },
      },
    });

    render(
      <MemoryRouter>
        <ZaloCallbackPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/mã xác thực đã hết hạn/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /thử lại bằng zalo/i })).toBeInTheDocument();
    });

    expect(mockSetAuthSession).not.toHaveBeenCalled();
  });

  it('renders link account form when linkTicket is provided and completes linking', async () => {
    setupUrl('?linkTicket=link_xyz&isLinked=false');

    const mockResponse = {
      message: 'Liên kết thành công',
      user: {
        id: 'std_2',
        fullName: 'Học sinh B',
        role: 'STUDENT' as const,
        phone: '0911223344',
        email: 'hocsinh2@vanbynhi.vn',
        avatarUrl: null,
      },
      tokens: {
        accessToken: 'jwt_access',
        tokenType: 'Bearer',
        expiresIn: '15m',
        refreshToken: 'refresh_tok',
      },
    };

    vi.mocked(authService.linkZaloAccount).mockResolvedValueOnce(mockResponse);

    render(
      <MemoryRouter>
        <ZaloCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/chưa liên kết tài khoản/i)).toBeInTheDocument();
    expect(screen.getByText(/liên kết tài khoản vanbynhi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email hoặc số điện thoại tài khoản vanbynhi/i)).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText(/email hoặc số điện thoại tài khoản vanbynhi/i),
      'hocsinh2@vanbynhi.vn',
    );
    await userEvent.type(
      screen.getByLabelText(/mật khẩu tài khoản/i),
      'password123',
    );

    await userEvent.click(screen.getByRole('button', { name: /xác nhận liên kết/i }));

    await waitFor(() => {
      expect(authService.linkZaloAccount).toHaveBeenCalledWith({
        linkTicket: 'link_xyz',
        identifier: 'hocsinh2@vanbynhi.vn',
        password: 'password123',
      });
      expect(mockSetAuthSession).toHaveBeenCalledWith(mockResponse.tokens, mockResponse.user);
      expect(mockNavigate).toHaveBeenCalledWith('/student/dashboard', { replace: true });
    });
  });

  it('displays invalid request UI when no query parameters are present', () => {
    setupUrl('');

    render(
      <MemoryRouter>
        <ZaloCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/yêu cầu không hợp lệ/i)).toBeInTheDocument();
    expect(screen.getByText(/không tìm thấy thông tin xác thực phiên đăng nhập từ zalo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /về trang đăng nhập/i })).toBeInTheDocument();
  });
});
