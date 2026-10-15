import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextSessionCard } from './NextSessionCard';
import type { StudentNextSession } from '../types/class.types';
import * as meetJoinHook from '../hooks/useStudentMeetJoin';

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

describe('NextSessionCard', () => {
  const mockJoinMeet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(meetJoinHook, 'useStudentMeetJoin').mockReturnValue({
      joinMeet: mockJoinMeet,
      isJoining: false,
      joiningSessionId: null,
      popupBlockedUrl: null,
      clearBlockedUrl: vi.fn(),
    });
  });

  const baseSession: StudentNextSession = {
    id: 'sess-100',
    title: 'Phân tích nhân vật Tràng trong tác phẩm Vợ Nhặt',
    startTime: '2026-10-15T19:00:00.000Z',
    endTime: '2026-10-15T21:00:00.000Z',
    status: 'SCHEDULED',
    canJoinMeet: true,
    meetUrl: 'https://meet.google.com/xyz-uvw-rst',
    opensAt: '2026-10-15T18:45:00.000Z',
    closesAt: '2026-10-15T21:00:00.000Z',
    isLive: false,
  };

  it('renders session title and class name', () => {
    renderWithProviders(
      <NextSessionCard
        session={baseSession}
        classNameTitle="Lớp 12 Chuyên Văn"
        classId="cls-1"
      />,
    );

    expect(
      screen.getByText('Phân tích nhân vật Tràng trong tác phẩm Vợ Nhặt'),
    ).toBeInTheDocument();
    expect(screen.getByText('Lớp 12 Chuyên Văn')).toBeInTheDocument();
  });

  it('shows LIVE badge when isLive is true', () => {
    const liveSession: StudentNextSession = {
      ...baseSession,
      isLive: true,
      status: 'IN_PROGRESS',
    };

    renderWithProviders(
      <NextSessionCard session={liveSession} classNameTitle="Lớp 12" />,
    );

    expect(screen.getByText(/Đang diễn ra \(LIVE\)/i)).toBeInTheDocument();
  });

  it('calls joinMeet when student clicks Google Meet button and canJoinMeet is true', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <NextSessionCard session={baseSession} classNameTitle="Lớp 12" />,
    );

    const meetButton = screen.getByRole('button', { name: /Tham gia Google Meet/i });
    expect(meetButton).toBeEnabled();

    await user.click(meetButton);
    expect(mockJoinMeet).toHaveBeenCalledWith('sess-100');
  });

  it('disables Google Meet button when canJoinMeet is false', () => {
    const notReadySession: StudentNextSession = {
      ...baseSession,
      canJoinMeet: false,
      meetUrl: null,
    };

    renderWithProviders(
      <NextSessionCard session={notReadySession} classNameTitle="Lớp 12" />,
    );

    const meetButton = screen.getByRole('button', { name: /Tham gia Google Meet/i });
    expect(meetButton).toBeDisabled();
    expect(
      screen.getByText(/Cửa sổ tham gia mở trước giờ học 15 phút/i),
    ).toBeInTheDocument();
  });

  it('displays cancelled state badge when session is CANCELLED', () => {
    const cancelledSession: StudentNextSession = {
      ...baseSession,
      status: 'CANCELLED',
      canJoinMeet: false,
    };

    renderWithProviders(
      <NextSessionCard session={cancelledSession} classNameTitle="Lớp 12" />,
    );

    expect(screen.getByText(/Buổi học đã hủy/i)).toBeInTheDocument();
  });
});
