import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleRoute } from './RoleRoute';
import * as useAuthModule from '@/features/auth/hooks/useAuth';

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('RoleRoute', () => {
  it('renders loading screen when role verification is in progress', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/classes']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/classes" element={<div>Admin Classes Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/đang xác minh quyền hạn.../i)).toBeInTheDocument();
    expect(screen.queryByText('Admin Classes Page')).not.toBeInTheDocument();
  });

  it('redirects to /403 when STUDENT attempts to access ADMIN route', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 'student-1',
        fullName: 'Học sinh B',
        phone: '0901234567',
        email: 'b@example.com',
        role: 'STUDENT',
        avatarUrl: null,
      },
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/users" element={<div>Admin Users Management</div>} />
          </Route>
          <Route path="/403" element={<div>403 Forbidden Page Mock</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('403 Forbidden Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Admin Users Management')).not.toBeInTheDocument();
  });

  it('redirects to /403 when TEACHER attempts to access ADMIN route', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 'teacher-1',
        fullName: 'Giáo viên C',
        phone: '0909888777',
        email: 'c@example.com',
        role: 'TEACHER',
        avatarUrl: null,
      },
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/tuition']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/tuition" element={<div>Admin Tuition Page</div>} />
          </Route>
          <Route path="/403" element={<div>403 Forbidden Page Mock</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('403 Forbidden Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Admin Tuition Page')).not.toBeInTheDocument();
  });

  it('allows ADMIN to access allowed admin routes', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 'admin-1',
        fullName: 'Quản trị viên',
        phone: '0900000000',
        email: 'admin@vanbynhi.vn',
        role: 'ADMIN',
        avatarUrl: null,
      },
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<div>Admin Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin Dashboard Content')).toBeInTheDocument();
  });

  it('allows TEACHER to access teacher routes', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 'teacher-1',
        fullName: 'Giáo viên A',
        phone: '0909888777',
        email: 'teacher@example.com',
        role: 'TEACHER',
        avatarUrl: null,
      },
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      setAuthSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/teacher/classes']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['ADMIN', 'TEACHER']} />}>
            <Route path="/teacher/classes" element={<div>Teacher Classes Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Teacher Classes Content')).toBeInTheDocument();
  });
});
