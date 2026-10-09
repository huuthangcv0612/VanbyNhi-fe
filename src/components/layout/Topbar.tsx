import { Menu, Bell, User as UserIcon, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';
import { Dropdown } from '@/components/ui/dropdown';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getRoleMeta } from '@/utils/formatters';

export interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleMeta = user ? getRoleMeta(user.role) : null;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          aria-label="Mở danh mục điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        {/* Quick notification link */}
        <button
          type="button"
          onClick={() => {
            const role = user?.role?.toLowerCase() || 'student';
            navigate(`/${role}/notifications`);
          }}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          aria-label="Xem thông báo"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* User profile dropdown */}
        <Dropdown
          align="right"
          trigger={
            <div className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/80 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-semibold text-slate-800 leading-tight">
                  {user?.fullName || 'Người dùng'}
                </p>
                <p className="text-[11px] text-slate-500">{roleMeta?.label}</p>
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
