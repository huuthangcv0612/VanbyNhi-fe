import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from './RegisterForm';
import { authService } from '@/features/auth/services/auth.service';

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: {
    register: vi.fn(),
  },
}));

function renderRegisterForm(props = {}) {
  return render(
    <MemoryRouter>
      <RegisterForm {...props} />
    </MemoryRouter>,
  );
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all form fields and submit button properly', () => {
    renderRegisterForm();

    expect(screen.getByLabelText(/họ và tên \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/số điện thoại \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ngày sinh \(tùy chọn\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mật khẩu \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/xác nhận mật khẩu \*/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^đăng ký tài khoản$/i }),
    ).toBeInTheDocument();
  });

  it('validates required fields on empty submission', async () => {
    renderRegisterForm();
    const submitBtn = screen.getByRole('button', { name: /^đăng ký tài khoản$/i });

    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/vui lòng nhập họ và tên/i)).toBeInTheDocument();
      expect(screen.getByText(/vui lòng nhập email/i)).toBeInTheDocument();
      expect(screen.getByText(/vui lòng nhập số điện thoại/i)).toBeInTheDocument();
      expect(screen.getByText(/mật khẩu phải có ít nhất 6 ký tự/i)).toBeInTheDocument();
      expect(screen.getByText(/vui lòng xác nhận mật khẩu/i)).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('validates whitespace-only fullName', async () => {
    renderRegisterForm();

    await userEvent.type(screen.getByLabelText(/họ và tên \*/i), '   ');
    await userEvent.click(screen.getByRole('button', { name: /^đăng ký tài khoản$/i }));

    await waitFor(() => {
      expect(screen.getByText(/vui lòng nhập họ và tên/i)).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('validates invalid email format', async () => {
    renderRegisterForm();

    await userEvent.type(screen.getByLabelText(/email \*/i), 'invalid-email');
    await userEvent.click(screen.getByRole('button', { name: /^đăng ký tài khoản$/i }));

    await waitFor(() => {
      expect(screen.getByText(/email không đúng định dạng/i)).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('validates invalid phone numbers according to backend regex ^[0-9+]{9,15}$', async () => {
    renderRegisterForm();
    const phoneInput = screen.getByLabelText(/số điện thoại \*/i);

    // Thử số quá ngắn (< 9 ký tự)
    await userEvent.type(phoneInput, '1234567');
    await userEvent.click(screen.getByRole('button', { name: /^đăng ký tài khoản$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/số điện thoại không hợp lệ \(từ 9 đến 15 ký tự số hoặc dấu \+\)/i),
      ).toBeInTheDocument();
    });

    // Thử số chứa chữ cái
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '0901234abc');
    await userEvent.click(screen.getByRole('button', { name: /^đăng ký tài khoản$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/số điện thoại không hợp lệ \(từ 9 đến 15 ký tự số hoặc dấu \+\)/i),
      ).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('validates mismatched passwords', async () => {
    renderRegisterForm();

    await userEvent.type(screen.getByLabelText(/^mật khẩu \*/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu \*/i), 'DifferentPassword');
    await userEvent.click(screen.getByRole('button', { name: /^đăng ký tài khoản$/i }));

    await waitFor(() => {
      expect(screen.getByText(/mật khẩu xác nhận không trùng khớp/i)).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('toggles password and confirm password visibility', async () => {
    renderRegisterForm();

    const passwordInput = screen.getByLabelText(/^mật khẩu \*/i);
    const confirmPasswordInput = screen.getByLabelText(/xác nhận mật khẩu \*/i);

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    const showPasswordBtn = screen.getByRole('button', { name: /^hiện mật khẩu$/i });
    await userEvent.click(showPasswordBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hidePasswordBtn = screen.getByRole('button', { name: /^ẩn mật khẩu$/i });
    await userEvent.click(hidePasswordBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const showConfirmBtn = screen.getByRole('button', { name: /^hiện mật khẩu xác nhận$/i });
    await userEvent.click(showConfirmBtn);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');

    const hideConfirmBtn = screen.getByRole('button', { name: /^ẩn mật khẩu xác nhận$/i });
    await userEvent.click(hideConfirmBtn);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('submits form successfully with all fields (including dateOfBirth) and displays success view', async () => {
    const mockUser = {
      id: 'student-123',
      fullName: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      phone: '0901234567',
      role: 'STUDENT' as const,
      avatarUrl: null,
      dateOfBirth: '2005-08-15',
      isActive: true,
      createdAt: '2026-10-10T00:00:00.000Z',
    };

    vi.mocked(authService.register).mockResolvedValueOnce({
      message: 'Đăng ký thành công',
      user: mockUser,
    });

    const handleSuccess = vi.fn();
    renderRegisterForm({ onSuccess: handleSuccess });

    await userEvent.type(screen.getByLabelText(/họ và tên \*/i), '  Nguyễn Văn A  ');
    await userEvent.type(screen.getByLabelText(/email \*/i), '  nguyenvana@example.com  ');
    await userEvent.type(screen.getByLabelText(/số điện thoại \*/i), '  0901234567  ');
    fireEvent.change(screen.getByLabelText(/ngày sinh \(tùy chọn\)/i), {
      target: { value: '2005-08-15' },
    });
    await userEvent.type(screen.getByLabelText(/^mật khẩu \*/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu \*/i), 'Password123');

    await userEvent.click(screen.getByRole('button', { name: /^đăng ký tài khoản$/i }));

    await waitFor(() => {
      // Contract check: verify exact payload sent to backend
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(authService.register).toHaveBeenCalledWith({
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '0901234567',
        password: 'Password123',
        dateOfBirth: '2005-08-15',
      });
      // Verification: must NOT contain confirmPassword, role, isActive
      const sentPayload = vi.mocked(authService.register).mock.calls[0][0];
      expect(sentPayload).not.toHaveProperty('confirmPassword');
      expect(sentPayload).not.toHaveProperty('role');
      expect(sentPayload).not.toHaveProperty('isActive');

      expect(handleSuccess).toHaveBeenCalledWith(mockUser);
      expect(screen.getByTestId('register-success-view')).toBeInTheDocument();
      expect(screen.getByText(/đăng ký thành công!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /đăng nhập ngay/i })).toBeInTheDocument();
    });
  });

  it('submits form successfully when dateOfBirth is omitted', async () => {
    const mockUser = {
      id: 'student-456',
      fullName: 'Trần Thị B',
      email: 'tranthib@example.com',
      phone: '0987654321',
      role: 'STUDENT' as const,
      avatarUrl: null,
      isActive: true,
    };

    vi.mocked(authService.register).mockResolvedValueOnce({
      message: 'Đăng ký thành công',
      user: mockUser,
    });

    renderRegisterForm();

    await userEvent.type(screen.getByLabelText(/họ và tên \*/i), 'Trần Thị B');
    await userEvent.type(screen.getByLabelText(/email \*/i), 'tranthib@example.com');
    await userEvent.type(screen.getByLabelText(/số điện thoại \*/i), '0987654321');
    await userEvent.type(screen.getByLabelText(/^mật khẩu \*/i), 'Password456');
    await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu \*/i), 'Password456');

    await userEvent.click(screen.getByRole('button', { name: /^đăng ký tài khoản$/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        fullName: 'Trần Thị B',
        email: 'tranthib@example.com',
        phone: '0987654321',
        password: 'Password456',
      });
      const sentPayload = vi.mocked(authService.register).mock.calls[0][0];
      expect(sentPayload).not.toHaveProperty('dateOfBirth');
      expect(screen.getByTestId('register-success-view')).toBeInTheDocument();
    });
  });

  it('handles 409 conflict error when email or phone already exists without clearing form data', async () => {
    const conflictError = {
      name: 'AxiosError',
      message: 'Request failed with status code 409',
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          message: 'Email hoặc số điện thoại đã tồn tại trong hệ thống',
        },
      },
    };

    vi.mocked(authService.register).mockRejectedValueOnce(conflictError);

    renderRegisterForm();

    const nameInput = screen.getByLabelText(/họ và tên \*/i);
    const emailInput = screen.getByLabelText(/email \*/i);
    const phoneInput = screen.getByLabelText(/số điện thoại \*/i);

    await userEvent.type(nameInput, 'Lê Văn C');
    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(phoneInput, '0912345678');
    await userEvent.type(screen.getByLabelText(/^mật khẩu \*/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu \*/i), 'Password123');

    await userEvent.click(screen.getByRole('button', { name: /^đăng ký tài khoản$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Email hoặc số điện thoại đã tồn tại trong hệ thống',
      );
    });

    // Verify form input data is preserved (not cleared unexpectedly)
    expect(nameInput).toHaveValue('Lê Văn C');
    expect(emailInput).toHaveValue('existing@example.com');
    expect(phoneInput).toHaveValue('0912345678');
  });

  it('handles network failure error with friendly message', async () => {
    const networkError = new Error('Network Error');
    vi.mocked(authService.register).mockRejectedValueOnce(networkError);

    renderRegisterForm();

    await userEvent.type(screen.getByLabelText(/họ và tên \*/i), 'Lê Văn C');
    await userEvent.type(screen.getByLabelText(/email \*/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/số điện thoại \*/i), '0912345678');
    await userEvent.type(screen.getByLabelText(/^mật khẩu \*/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu \*/i), 'Password123');

    await userEvent.click(screen.getByRole('button', { name: /^đăng ký tài khoản$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
