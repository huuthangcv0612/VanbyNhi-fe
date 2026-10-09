import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@/types/common.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

export interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Đang xác minh quyền hạn..." />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
