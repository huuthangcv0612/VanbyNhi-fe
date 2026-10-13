import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZaloLinkForm } from './ZaloLinkForm';
import { authService } from '@/features/auth/services/auth.service';

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: {
    linkZaloAccount: vi.fn(),
  },
}));

describe('ZaloLinkForm', () => {
  const dummyTicket = 'link_ticket_123';
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form inputs and buttons properly', () => {
    render(
      <ZaloLinkForm
        linkTicket={dummyTicket}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByLabelText(/email hoặc số điện thoại tài khoản vanbynhi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu tài khoản/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xác nhận liên kết/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quay lại/i })).toBeInTheDocument();
  });

  it('validates empty inputs on submit', async () => {
    render(
      <ZaloLinkForm
        linkTicket={dummyTicket}
        onSuccess={mockOnSuccess}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /xác nhận liên kết/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/vui lòng nhập email hoặc số điện thoại/i)).toBeInTheDocument();
      expect(screen.getByText(/mật khẩu phải có ít nhất 6 ký tự/i)).toBeInTheDocument();
    });

    expect(authService.linkZaloAccount).not.toHaveBeenCalled();
  });

  it('submits valid data to authService.linkZaloAccount and calls onSuccess', async () => {
    const mockResponse = {
      message: 'Liên kết thành công',
      user: { id: 'u1', fullName: 'Test User', role: 'STUDENT' as const, phone: '0987654321', email: 'test@example.com', avatarUrl: null },
      tokens: { accessToken: 'acc_1', tokenType: 'Bearer', expiresIn: '15m', refreshToken: 'ref_1' },
    };
    vi.mocked(authService.linkZaloAccount).mockResolvedValueOnce(mockResponse);

    render(
      <ZaloLinkForm
        linkTicket={dummyTicket}
        onSuccess={mockOnSuccess}
      />,
    );

    await userEvent.type(
      screen.getByLabelText(/email hoặc số điện thoại tài khoản vanbynhi/i),
      'test@example.com',
    );
    await userEvent.type(
      screen.getByLabelText(/mật khẩu tài khoản/i),
      'password123',
    );

    await userEvent.click(screen.getByRole('button', { name: /xác nhận liên kết/i }));

    await waitFor(() => {
      expect(authService.linkZaloAccount).toHaveBeenCalledWith({
        linkTicket: dummyTicket,
        identifier: 'test@example.com',
        password: 'password123',
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse);
    });
  });

  it('displays error message when linkZaloAccount fails', async () => {
    vi.mocked(authService.linkZaloAccount).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: { message: 'Thông tin tài khoản xác minh không chính xác' },
      },
    });

    render(
      <ZaloLinkForm
        linkTicket={dummyTicket}
        onSuccess={mockOnSuccess}
      />,
    );

    await userEvent.type(
      screen.getByLabelText(/email hoặc số điện thoại tài khoản vanbynhi/i),
      'wrong@example.com',
    );
    await userEvent.type(
      screen.getByLabelText(/mật khẩu tài khoản/i),
      'wrongpass',
    );

    await userEvent.click(screen.getByRole('button', { name: /xác nhận liên kết/i }));

    await waitFor(() => {
      expect(screen.getByText(/thông tin tài khoản xác minh không chính xác/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('triggers onCancel when clicking back button', async () => {
    render(
      <ZaloLinkForm
        linkTicket={dummyTicket}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /quay lại/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('toggles password visibility when clicking eye button', async () => {
    render(
      <ZaloLinkForm
        linkTicket={dummyTicket}
        onSuccess={mockOnSuccess}
      />,
    );

    const passwordInput = screen.getByLabelText(/mật khẩu tài khoản/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /hiện mật khẩu/i });
    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /ẩn mật khẩu/i });
    await userEvent.click(hideBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
