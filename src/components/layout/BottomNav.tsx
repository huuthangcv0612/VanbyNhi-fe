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

const MotionNavLink = motion.create(NavLink);

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
      className="lg:hidden fixed bottom-3.5 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.75rem)] max-w-sm sm:max-w-md"
    >
      {/* Floating water bubble pill container */}
      <div className="relative flex items-center justify-between p-1.5 rounded-full bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.14),0_4px_16px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const IconComponent = item.icon;

          return (
            <MotionNavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              whileTap={{ scale: 0.92 }}
              transition={appleSnappy}
              className={({ isActive: linkActive }) =>
                cn(
                  'relative z-10 flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-2.5 rounded-full transition-colors cursor-pointer select-none text-center',
                  linkActive || isActive
                    ? 'text-amber-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900',
                )
              }
            >
              {/* Active water bubble indicator */}
              {(isActive || location.pathname === item.to) && (
                <motion.div
                  layoutId="waterBubblePill"
                  className="absolute inset-0 rounded-full bg-slate-200/75 -z-10 shadow-2xs"
                  transition={appleSnappy}
                />
              )}

              <IconComponent
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform duration-200',
                  (isActive || location.pathname === item.to) && 'scale-105',
                )}
              />
              <span className="text-[10px] sm:text-[11px] mt-0.5 leading-none tracking-tight truncate max-w-[62px]">
                {item.label}
              </span>
            </MotionNavLink>
          );
        })}

        {/* Menu Drawer Toggle Button */}
        <motion.button
          type="button"
          onClick={onOpenMenu}
          whileTap={{ scale: 0.92 }}
          transition={appleSnappy}
          aria-label="Mở toàn bộ danh mục menu"
          className="relative z-10 flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-2.5 rounded-full text-slate-600 hover:text-slate-900 transition-colors cursor-pointer select-none"
        >
          <Menu className="w-5 h-5 shrink-0" />
          <span className="text-[10px] sm:text-[11px] mt-0.5 leading-none tracking-tight">
            Thêm
          </span>
        </motion.button>
      </div>
    </nav>
  );
}
