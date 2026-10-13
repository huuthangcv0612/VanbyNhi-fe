import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

const mockLogin = vi.fn();

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    user: null,
  }),
}));

describe('LoginForm', () => {
  it('renders form elements properly', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email hoặc số điện thoại/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mật khẩu$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^đăng nhập$/i })).toBeInTheDocument();
  });

  it('validates empty inputs on submit', async () => {
    render(<LoginForm />);
    const submitBtn = screen.getByRole('button', { name: /^đăng nhập$/i });

    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/vui lòng nhập email hoặc số điện thoại/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/mật khẩu phải có ít nhất 6 ký tự/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login function on valid form submission', async () => {
    mockLogin.mockResolvedValueOnce({ id: '1', role: 'ADMIN' });
    const handleSuccess = vi.fn();

    render(<LoginForm onSuccess={handleSuccess} />);

    await userEvent.type(
      screen.getByLabelText(/email hoặc số điện thoại/i),
      'admin@vanbynhi.vn',
    );
    await userEvent.type(screen.getByLabelText(/^mật khẩu$/i), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'admin@vanbynhi.vn',
        password: 'password123',
      });
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles password visibility when clicking eye button', async () => {
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText(/^mật khẩu$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /hiện mật khẩu/i });
    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /ẩn mật khẩu/i });
    await userEvent.click(hideBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('renders Zalo login button and navigates to Zalo authorization url on click', async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
      configurable: true,
    });

    render(<LoginForm />);

    const zaloBtn = screen.getByRole('button', { name: /đăng nhập bằng zalo/i });
    expect(zaloBtn).toBeInTheDocument();

    await userEvent.click(zaloBtn);

    expect(window.location.href).toContain('/auth/zalo');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});
