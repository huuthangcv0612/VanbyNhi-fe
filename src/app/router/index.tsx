import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { RootIndex } from './RootIndex';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

// Lazy-loaded pages
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ForbiddenPage = lazy(() =>
  import('@/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const AdminDashboardPage = lazy(() =>
  import('@/features/dashboard/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const TeacherDashboardPage = lazy(() =>
  import('@/features/dashboard/pages/TeacherDashboardPage').then((m) => ({
    default: m.TeacherDashboardPage,
  })),
);
const StudentDashboardPage = lazy(() =>
  import('@/features/dashboard/pages/StudentDashboardPage').then((m) => ({
    default: m.StudentDashboardPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@/features/users/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const UsersListPage = lazy(() =>
  import('@/features/users/pages/UsersListPage').then((m) => ({ default: m.UsersListPage })),
);
const ClassesListPage = lazy(() =>
  import('@/features/classes/pages/ClassesListPage').then((m) => ({
    default: m.ClassesListPage,
  })),
);
const TeacherClassesListPage = lazy(() =>
  import('@/features/classes/pages/TeacherClassesListPage').then((m) => ({
    default: m.TeacherClassesListPage,
  })),
);
const TeacherClassDetailPage = lazy(() =>
  import('@/features/classes/pages/TeacherClassDetailPage').then((m) => ({
    default: m.TeacherClassDetailPage,
  })),
);
const StudentClassesPage = lazy(() =>
  import('@/features/classes/pages/StudentClassesPage').then((m) => ({
    default: m.StudentClassesPage,
  })),
);
const StudentClassDetailPage = lazy(() =>
  import('@/features/classes/pages/StudentClassDetailPage').then((m) => ({
    default: m.StudentClassDetailPage,
  })),
);
const SessionsPage = lazy(() =>
  import('@/features/sessions/pages/SessionsPage').then((m) => ({ default: m.SessionsPage })),
);
const AttendancePage = lazy(() =>
  import('@/features/attendance/pages/AttendancePage').then((m) => ({
    default: m.AttendancePage,
  })),
);
const TuitionPage = lazy(() =>
  import('@/features/tuition/pages/TuitionPage').then((m) => ({ default: m.TuitionPage })),
);
const AssignmentsPage = lazy(() =>
  import('@/features/assignments/pages/AssignmentsPage').then((m) => ({
    default: m.AssignmentsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import('@/features/notifications/pages/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
);
const TeacherCalendarPage = lazy(() =>
  import('@/features/teacher-calendar/pages/TeacherCalendarPage').then((m) => ({
    default: m.TeacherCalendarPage,
  })),
);
const StudentSchedulesPage = lazy(() =>
  import('@/features/student-schedules/pages/student-schedules-page').then((m) => ({
    default: m.StudentSchedulesPage,
  })),
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen message="Đang tải trang..." />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/register',
    element: (
      <SuspenseWrapper>
        <RegisterPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/403',
    element: (
      <SuspenseWrapper>
        <ForbiddenPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/404',
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },

  // Root redirect
  {
    path: '/',
    element: <RootIndex />,
  },

  // Authenticated routes
  {
    element: <ProtectedRoute />,
    children: [
      // Shared profile route
      {
        element: <AppLayout />,
        children: [
          {
            path: '/profile',
            element: (
              <SuspenseWrapper>
                <ProfilePage />
              </SuspenseWrapper>
            ),
          },
        ],
      },

      // ADMIN routes
      {
        path: '/admin',
        element: <RoleRoute allowedRoles={['ADMIN']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/dashboard" replace /> },
              {
                path: 'dashboard',
                element: (
                  <SuspenseWrapper>
                    <AdminDashboardPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'classes',
                element: (
                  <SuspenseWrapper>
                    <ClassesListPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'users',
                element: (
                  <SuspenseWrapper>
                    <UsersListPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'sessions',
                element: (
                  <SuspenseWrapper>
                    <SessionsPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'attendance',
                element: (
                  <SuspenseWrapper>
                    <AttendancePage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'tuition',
                element: (
                  <SuspenseWrapper>
                    <TuitionPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'assignments',
                element: (
                  <SuspenseWrapper>
                    <AssignmentsPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'notifications',
                element: (
                  <SuspenseWrapper>
                    <NotificationsPage />
                  </SuspenseWrapper>
                ),
              },
            ],
          },
        ],
      },

      // TEACHER routes
      {
        path: '/teacher',
        element: <RoleRoute allowedRoles={['ADMIN', 'TEACHER']} />,
        children: [
          {
            element: <TeacherLayout />,
            children: [
              { index: true, element: <Navigate to="/teacher/dashboard" replace /> },
              {
                path: 'dashboard',
                element: (
                  <SuspenseWrapper>
                    <TeacherDashboardPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'classes',
                element: (
                  <SuspenseWrapper>
                    <TeacherClassesListPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'classes/:classId',
                element: (
                  <SuspenseWrapper>
                    <TeacherClassDetailPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'calendar',
                element: (
                  <SuspenseWrapper>
                    <TeacherCalendarPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'sessions',
                element: (
                  <SuspenseWrapper>
                    <SessionsPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'attendance',
                element: (
                  <SuspenseWrapper>
                    <AttendancePage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'assignments',
                element: (
                  <SuspenseWrapper>
                    <AssignmentsPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'notifications',
                element: (
                  <SuspenseWrapper>
                    <NotificationsPage />
                  </SuspenseWrapper>
                ),
              },
            ],
          },
        ],
      },

      // STUDENT routes
      {
        path: '/student',
        element: <RoleRoute allowedRoles={['ADMIN', 'STUDENT']} />,
        children: [
          {
            element: <StudentLayout />,
            children: [
              { index: true, element: <Navigate to="/student/dashboard" replace /> },
              {
                path: 'dashboard',
                element: (
                  <SuspenseWrapper>
                    <StudentDashboardPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'classes',
                element: (
                  <SuspenseWrapper>
                    <StudentClassesPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'classes/:classId',
                element: (
                  <SuspenseWrapper>
                    <StudentClassDetailPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'schedules',
                element: (
                  <SuspenseWrapper>
                    <StudentSchedulesPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'sessions',
                element: <Navigate to="/student/schedules" replace />,
              },
              {
                path: 'assignments',
                element: (
                  <SuspenseWrapper>
                    <AssignmentsPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'tuition',
                element: (
                  <SuspenseWrapper>
                    <TuitionPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'notifications',
                element: (
                  <SuspenseWrapper>
                    <NotificationsPage />
                  </SuspenseWrapper>
                ),
              },
            ],
          },
        ],
      },
    ],
  },

  // Catch-all 404
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
