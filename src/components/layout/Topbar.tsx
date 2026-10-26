import { Bell, User as UserIcon, LogOut, Shield } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';
import { Dropdown } from '@/components/ui/dropdown';
import { IconButton } from '@/components/ui/icon-button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getRoleMeta } from '@/utils/formatters';

export interface TopbarProps {
  onOpenSidebar?: () => void;
}

export function Topbar({ onOpenSidebar: _onOpenSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleMeta = user ? getRoleMeta(user.role) : null;
  const homePath =
    user?.role === 'TEACHER'
      ? '/teacher/dashboard'
      : user?.role === 'ADMIN'
        ? '/admin/dashboard'
        : '/student/dashboard';

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 px-3 sm:px-6 backdrop-blur-md transition-all">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile & Tablet Brand (replaces hamburger + breadcrumbs) */}
        <Link
          to={homePath}
          className="flex lg:hidden items-center gap-2 shrink-0 cursor-pointer"
          aria-label="Về trang chủ"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-700 text-white font-bold font-serif shadow-xs">
            V
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 font-serif">
            VanbyNhi
          </span>
        </Link>

        {/* Desktop Breadcrumbs (Hidden on Mobile & Tablet) */}
        <div className="hidden lg:block min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

        {/* Quick notification button */}
        <IconButton
          icon={<Bell className="w-4 h-4 text-slate-600" />}
          aria-label="Xem thông báo"
          variant="ghost"
          size="md"
          onClick={() => {
            const role = user?.role?.toLowerCase() || 'student';
            navigate(`/${role}/notifications`);
          }}
          className="hover:bg-slate-100 text-slate-600 hover:text-slate-900"
        />

        {/* User profile dropdown (Apple squircle) */}
        <Dropdown
          align="right"
          trigger={
            <div className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100/90 transition-colors cursor-pointer select-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100/90 text-amber-800 font-bold text-xs border border-amber-200/80 shadow-2xs">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left text-xs max-w-[120px] truncate">
                <p className="font-semibold text-slate-800 leading-tight truncate">
                  {user?.fullName || 'Người dùng'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{roleMeta?.label}</p>
              </div>
            </div>
          }
          items={[
            {
              label: 'Thông tin cá nhân',
              icon: <UserIcon className="w-4 h-4" />,
              onClick: () => navigate('/profile'),
            },
            ...(user?.role === 'ADMIN'
              ? [
                  {
                    label: 'Khu vực quản trị',
                    icon: <Shield className="w-4 h-4" />,
                    onClick: () => navigate('/admin/dashboard'),
                  },
                ]
              : []),
            'divider',
            {
              label: 'Đăng xuất',
              icon: <LogOut className="w-4 h-4" />,
              danger: true,
              onClick: () => logout(),
            },
          ]}
        />
      </div>
    </header>
  );
}
