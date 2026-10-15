import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Topbar } from './Topbar';
import * as authHook from '@/features/auth/hooks/useAuth';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Topbar Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Quản lý tài liệu" button for TEACHER role and navigates to /teacher/documents', async () => {
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
        <Topbar onOpenSidebar={vi.fn()} />
      </MemoryRouter>,
    );

    const docBtn = screen.getByRole('button', { name: /Quản lý tài liệu/i });
    expect(docBtn).toBeInTheDocument();
    expect(screen.getByText('Quản lý tài liệu')).toBeInTheDocument();

    await userEvent.click(docBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/teacher/documents');
  });

  it('renders "Tài liệu học tập" button for STUDENT role and navigates to /student/documents', async () => {
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
        <Topbar onOpenSidebar={vi.fn()} />
      </MemoryRouter>,
    );

    const docBtn = screen.getByRole('button', { name: /Tài liệu học tập/i });
    expect(docBtn).toBeInTheDocument();
    expect(screen.getByText('Tài liệu học tập')).toBeInTheDocument();

    await userEvent.click(docBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/student/documents');
  });
});
