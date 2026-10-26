import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  Users,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/utils/cn';
import { appleSnappy } from '@/utils/motion';

export interface BottomNavProps {
  onOpenMenu: () => void;
}

export function BottomNav({ onOpenMenu }: BottomNavProps) {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || 'STUDENT';

  const getPrimaryNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Tổng quan', to: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Lớp học', to: '/admin/classes', icon: BookOpen },
          { label: 'Người dùng', to: '/admin/users', icon: Users },
          { label: 'Buổi học', to: '/admin/sessions', icon: Calendar },
        ];
      case 'TEACHER':
        return [
          { label: 'Bàn việc', to: '/teacher/dashboard', icon: LayoutDashboard },
          { label: 'Lớp học', to: '/teacher/classes', icon: BookOpen },
          { label: 'Lịch dạy', to: '/teacher/calendar', icon: Calendar },
          { label: 'Điểm danh', to: '/teacher/attendance', icon: ClipboardCheck },
        ];
      case 'STUDENT':
      default:
        return [
          { label: 'Góc học', to: '/student/dashboard', icon: LayoutDashboard },
          { label: 'Lớp học', to: '/student/classes', icon: BookOpen },
          { label: 'Lịch học', to: '/student/schedules', icon: Calendar },
          { label: 'Bài tập', to: '/student/assignments', icon: FileText },
        ];
    }
  };

  const navItems = getPrimaryNavItems();

  return (
    <nav
      aria-label="Điều hướng nhanh trên thiết bị di động"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const IconComponent = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive: linkActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-colors cursor-pointer select-none text-center',
                  linkActive || isActive
                    ? 'text-amber-800 font-semibold'
                    : 'text-slate-500 hover:text-slate-800',
                )
              }
            >
              <div className="relative flex items-center justify-center">
                <IconComponent className="w-5 h-5 shrink-0" />
                {(isActive || location.pathname === item.to) && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    transition={appleSnappy}
                    className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-amber-700"
                  />
                )}
              </div>
              <span className="text-[10px] mt-1 leading-tight tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {/* Menu Drawer Toggle Button */}
        <motion.button
          type="button"
          onClick={onOpenMenu}
          whileTap={{ scale: 0.92 }}
          transition={appleSnappy}
          aria-label="Mở toàn bộ danh mục menu"
          className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer select-none"
        >
          <Menu className="w-5 h-5 shrink-0" />
          <span className="text-[10px] mt-1 leading-tight tracking-tight">Thêm</span>
        </motion.button>
      </div>
    </nav>
  );
}
