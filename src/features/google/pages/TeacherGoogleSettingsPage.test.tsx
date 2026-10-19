import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeacherGoogleSettingsPage } from './TeacherGoogleSettingsPage';
import { googleService } from '../services/google.service';

vi.mock('../services/google.service', () => ({
  googleService: {
    getConnectionStatus: vi.fn(),
    getConnectUrl: vi.fn(),
    disconnect: vi.fn(),
  },
}));

const mockShowToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/teacher/settings/google" element={<TeacherGoogleSettingsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TeacherGoogleSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(googleService.getConnectionStatus).mockResolvedValue({
      isConnected: true,
      status: 'CONNECTED',
      email: 'teacher@school.edu.vn',
    });
  });

  it('renders page header and card', async () => {
    renderPage('/teacher/settings/google');

    await waitFor(() => {
      expect(screen.getAllByText('Tài khoản Google Workspace').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/về tích hợp google meet/i)).toBeInTheDocument();
    });
  });

  it('handles success OAuth callback from backend query params', async () => {
    renderPage('/teacher/settings/google?status=success&email=teacher%40school.edu.vn');

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: expect.stringContaining('thành công'),
          message: expect.stringContaining('teacher@school.edu.vn'),
        }),
      );
    });
  });

  it('handles error OAuth callback from backend query params', async () => {
    renderPage('/teacher/settings/google?error=access_denied&message=User%20cancelled');

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: expect.stringContaining('thất bại'),
        }),
      );
    });
  });
});
