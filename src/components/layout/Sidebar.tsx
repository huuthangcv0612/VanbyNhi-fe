import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  CreditCard,
  FileText,
  Bell,
  X,
  LogOut,
  User as UserIcon,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getRoleMeta } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

export interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const role = user?.role || 'STUDENT';
  const roleMeta = getRoleMeta(role);

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Tổng quan', to: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Lớp học', to: '/admin/classes', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Người dùng', to: '/admin/users', icon: <Users className="w-4 h-4" /> },
          { label: 'Buổi học', to: '/admin/sessions', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Quản lý tài liệu', to: '/teacher/documents', icon: <FolderOpen className="w-4 h-4" /> },
          { label: 'Điểm danh', to: '/admin/attendance', icon: <ClipboardCheck className="w-4 h-4" /> },
          { label: 'Học phí', to: '/admin/tuition', icon: <CreditCard className="w-4 h-4" /> },
          { label: 'Bài tập', to: '/admin/assignments', icon: <FileText className="w-4 h-4" /> },
          { label: 'Thông báo', to: '/admin/notifications', icon: <Bell className="w-4 h-4" /> },
        ];
      case 'TEACHER':
        return [
          { label: 'Bàn làm việc', to: '/teacher/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Lớp phụ trách', to: '/teacher/classes', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Lịch giảng dạy', to: '/teacher/calendar', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Quản lý tài liệu', to: '/teacher/documents', icon: <FolderOpen className="w-4 h-4" /> },
          { label: 'Điểm danh', to: '/teacher/attendance', icon: <ClipboardCheck className="w-4 h-4" /> },
          { label: 'Chấm bài tập', to: '/teacher/assignments', icon: <FileText className="w-4 h-4" /> },
          { label: 'Thông báo', to: '/teacher/notifications', icon: <Bell className="w-4 h-4" /> },
        ];
      case 'STUDENT':
      default:
        return [
          { label: 'Góc học tập', to: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Lớp học của tôi', to: '/student/classes', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Lịch học', to: '/student/schedules', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Tài liệu học tập', to: '/student/documents', icon: <FolderOpen className="w-4 h-4" /> },
          { label: 'Điểm danh của tôi', to: '/student/attendance', icon: <ClipboardCheck className="w-4 h-4" /> },
          { label: 'Bài tập & Nộp bài', to: '/student/assignments', icon: <FileText className="w-4 h-4" /> },
          { label: 'Học phí cá nhân', to: '/student/tuition', icon: <CreditCard className="w-4 h-4" /> },
          { label: 'Thông báo', to: '/student/notifications', icon: <Bell className="w-4 h-4" /> },
        ];
    }
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white font-serif font-bold text-lg shadow-sm">
            V
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white font-serif">
              VanbyNhi
            </h2>
            <div className="mt-0.5">
              <Badge size="sm" className={cn('text-[10px] px-1.5 py-0 border-0', roleMeta.badgeClass)}>
                {roleMeta.label}
              </Badge>
            </div>
          </div>
        </div>
        {/* Close button on mobile */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          aria-label="Đóng thanh điều hướng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Điều hướng chính
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer',
                isActive
                  ? 'bg-amber-600/90 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <NavLink
          to="/profile"
          onClick={() => {
            if (window.innerWidth < 1024) onClose();
          }}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors mb-1',
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
            )
          }
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-amber-400 shrink-0 border border-slate-700">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-white truncate">
              {user?.fullName || 'Người dùng'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || user?.phone || ''}
            </p>
          </div>
        </NavLink>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-md">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
