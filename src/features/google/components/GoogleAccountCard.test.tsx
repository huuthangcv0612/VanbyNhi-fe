import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleAccountCard } from './GoogleAccountCard';
import { googleService } from '../services/google.service';

vi.mock('../services/google.service', () => ({
  googleService: {
    getConnectionStatus: vi.fn(),
    getConnectUrl: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('GoogleAccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders CONNECTED status with email and disconnect button', async () => {
    vi.mocked(googleService.getConnectionStatus).mockResolvedValueOnce({
      isConnected: true,
      status: 'CONNECTED',
      email: 'teacher@vanbynhi.edu.vn',
      lastConnectedAt: '2026-10-18T10:00:00.000Z',
    });

    renderWithProviders(<GoogleAccountCard />);

    await waitFor(() => {
      expect(screen.getByText('Đã liên kết')).toBeInTheDocument();
      expect(screen.getByText('teacher@vanbynhi.edu.vn')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ngắt liên kết/i })).toBeInTheDocument();
    });
  });

  it('renders DISCONNECTED status with connect button', async () => {
    vi.mocked(googleService.getConnectionStatus).mockResolvedValueOnce({
      isConnected: false,
      status: 'DISCONNECTED',
    });

    renderWithProviders(<GoogleAccountCard />);

    await waitFor(() => {
      expect(screen.getByText('Chưa liên kết')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /liên kết google workspace/i })).toBeInTheDocument();
    });
  });

  it('renders NEEDS_REAUTH status with warning and re-auth button', async () => {
    vi.mocked(googleService.getConnectionStatus).mockResolvedValueOnce({
      isConnected: false,
      status: 'NEEDS_REAUTH',
      email: 'teacher@vanbynhi.edu.vn',
    });

    renderWithProviders(<GoogleAccountCard />);

    await waitFor(() => {
      expect(screen.getByText('Cần ủy quyền lại')).toBeInTheDocument();
      expect(screen.getByText(/phiên xác thực đã hết hạn/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /liên kết lại/i })).toBeInTheDocument();
    });
  });

  it('initiates OAuth flow when connect button is clicked', async () => {
    vi.mocked(googleService.getConnectionStatus).mockResolvedValueOnce({
      isConnected: false,
      status: 'DISCONNECTED',
    });
    vi.mocked(googleService.getConnectUrl).mockResolvedValueOnce({
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=123',
    });

    // Mock window.location
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: { ...originalLocation, href: '' },
    });

    const user = userEvent.setup();
    renderWithProviders(<GoogleAccountCard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /liên kết google workspace/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /liên kết google workspace/i }));

    await waitFor(() => {
      expect(googleService.getConnectUrl).toHaveBeenCalled();
      expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/v2/auth?client_id=123');
    });

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: originalLocation,
    });
  });

  it('allows disconnecting when user confirms in modal', async () => {
    vi.mocked(googleService.getConnectionStatus).mockResolvedValueOnce({
      isConnected: true,
      status: 'CONNECTED',
      email: 'teacher@vanbynhi.edu.vn',
    });
    vi.mocked(googleService.disconnect).mockResolvedValueOnce({
      message: 'Ngắt liên kết thành công',
    });

    const user = userEvent.setup();
    renderWithProviders(<GoogleAccountCard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ngắt liên kết/i })).toBeInTheDocument();
    });

    // Bấm nút ngắt liên kết ngoài card
    await user.click(screen.getByRole('button', { name: /ngắt liên kết/i }));

    // Modal xuất hiện
    await waitFor(() => {
      expect(screen.getByText(/ngắt liên kết tài khoản google\?/i)).toBeInTheDocument();
    });

    // Xác nhận trong modal
    const confirmButton = screen.getAllByRole('button', { name: /ngắt liên kết/i });
    // Button trong modal là button thứ 2
    await user.click(confirmButton[confirmButton.length - 1]);

    await waitFor(() => {
      expect(googleService.disconnect).toHaveBeenCalled();
    });
  });
});
