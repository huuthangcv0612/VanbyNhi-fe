import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import * as authHook from '@/features/auth/hooks/useAuth';

describe('BottomNav (Floating Water Bubble Bar)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders primary navigation items for TEACHER role', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: {
        id: 't-1',
        fullName: 'Cô Trần Ánh Nhi',
        email: 'teacher@vanbynhi.edu.vn',
        phone: '0901234567',
        role: 'TEACHER',
        avatarUrl: null,
        isActive: true,
        createdAt: '2026-01-01',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/teacher/dashboard']}>
        <BottomNav onOpenMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Bàn việc')).toBeInTheDocument();
    expect(screen.getByText('Lớp học')).toBeInTheDocument();
    expect(screen.getByText('Lịch dạy')).toBeInTheDocument();
    expect(screen.getByText('Điểm danh')).toBeInTheDocument();
    expect(screen.getByText('Thêm')).toBeInTheDocument();
  });

  it('renders primary navigation items for STUDENT role', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: {
        id: 's-1',
        fullName: 'Nguyễn Văn An',
        email: 'student@vanbynhi.edu.vn',
        phone: '0907654321',
        role: 'STUDENT',
        avatarUrl: null,
        isActive: true,
        createdAt: '2026-01-01',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/student/dashboard']}>
        <BottomNav onOpenMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Góc học')).toBeInTheDocument();
    expect(screen.getByText('Lớp học')).toBeInTheDocument();
    expect(screen.getByText('Lịch học')).toBeInTheDocument();
    expect(screen.getByText('Bài tập')).toBeInTheDocument();
    expect(screen.getByText('Thêm')).toBeInTheDocument();
  });

  it('triggers onOpenMenu when clicking "Thêm" button', async () => {
    const handleOpenMenu = vi.fn();
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/student/dashboard']}>
        <BottomNav onOpenMenu={handleOpenMenu} />
      </MemoryRouter>,
    );

    const menuBtn = screen.getByRole('button', { name: /Mở toàn bộ danh mục menu/i });
    expect(menuBtn).toBeInTheDocument();

    await userEvent.click(menuBtn);
    expect(handleOpenMenu).toHaveBeenCalled();
  });
});
