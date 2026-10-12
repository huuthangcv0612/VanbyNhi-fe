import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  admin: 'Quản trị',
  teacher: 'Giáo viên',
  student: 'Học sinh',
  dashboard: 'Tổng quan',
  classes: 'Lớp học',
  users: 'Người dùng',
  sessions: 'Buổi học',
  calendar: 'Lịch giảng dạy',
  attendance: 'Điểm danh',
  tuition: 'Học phí',
  assignments: 'Bài tập',
  notifications: 'Thông báo',
  profile: 'Hồ sơ cá nhân',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-xs text-slate-500" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 list-none p-0 m-0">
        <li>
          <Link
            to="/"
            className="flex items-center text-slate-400 hover:text-slate-700 transition-colors"
            title="Trang chủ"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
        </li>

        {pathnames.map((segment, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = routeLabels[segment] || segment;

          return (
            <li key={to} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {isLast ? (
                <span className="font-medium text-slate-800" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  to={to}
                  className="text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
