import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
import type { User } from '@/types/auth.types';

const mockNavigate = vi.fn();
const mockSuccessToast = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let mockAuthState: {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: mockSuccessToast,
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  });

  it('renders branding and register form when unauthenticated', () => {
    renderRegisterPage();

    expect(screen.getByRole('heading', { name: /^vanbynhi$/i })).toBeInTheDocument();
    expect(screen.getByText(/đăng ký tài khoản mới/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^đăng ký tài khoản$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /đăng nhập ngay/i })).toHaveAttribute('href', '/login');
  });

  it('redirects authenticated student to /student/dashboard', () => {
    mockAuthState = {
      user: {
        id: '1',
        fullName: 'Học sinh A',
        email: 'hs@vanbynhi.vn',
        phone: '0901234567',
        role: 'STUDENT',
        avatarUrl: null,
      },
      isAuthenticated: true,
      isLoading: false,
    };

    renderRegisterPage();

    expect(mockNavigate).toHaveBeenCalledWith('/student/dashboard', { replace: true });
  });

  it('redirects authenticated teacher to /teacher/dashboard', () => {
    mockAuthState = {
      user: {
        id: '2',
        fullName: 'Thầy B',
        email: 'gv@vanbynhi.vn',
        phone: '0901234568',
        role: 'TEACHER',
        avatarUrl: null,
      },
      isAuthenticated: true,
      isLoading: false,
    };

    renderRegisterPage();

    expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard', { replace: true });
  });
});
