import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Điều hướng về trang đã định trước hoặc dashboard theo role
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      switch (user.role) {
        case 'ADMIN':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'TEACHER':
          navigate('/teacher/dashboard', { replace: true });
          break;
        case 'STUDENT':
          navigate('/student/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, user, navigate, location]);

  const handleSuccess = () => {
    // Redirection is handled in the effect above when user state updates
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-linear-to-b from-amber-50/50 via-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-700 text-white shadow-md shadow-amber-900/10 mb-4">
          <BookOpen className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
          VanbyNhi
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Nền tảng Quản lý & Học tập Văn học Việt Nam
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Đăng nhập tài khoản</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập email hoặc số điện thoại đã được đăng ký trong hệ thống
            </p>
          </div>

          <LoginForm onSuccess={handleSuccess} />

          <div className="mt-4 text-center text-sm text-slate-600">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-semibold text-amber-700 hover:text-amber-800 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Hỗ trợ phân quyền hệ thống</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Tài khoản được phân quyền tự động theo vai trò: Quản trị viên (ADMIN), Giáo viên (TEACHER) và Học sinh (STUDENT).
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <GraduationCap className="w-4 h-4" />
          <span>VanbyNhi Education Platform &copy; 2026</span>
        </div>
      </div>
    </div>
  );
}
