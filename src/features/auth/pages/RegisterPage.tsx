import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { User } from '@/types/auth.types';

export function RegisterPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
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
          break;
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const handleSuccess = (registeredUser: User) => {
    success(`Chào mừng ${registeredUser.fullName}! Đăng ký tài khoản thành công.`, 'Thành công');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-linear-to-b from-amber-50/50 via-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link
          to="/"
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-700 text-white shadow-md shadow-amber-900/10 mb-4 hover:bg-amber-800 transition-colors"
          aria-label="Về trang chủ"
        >
          <BookOpen className="w-7 h-7" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
          VanbyNhi
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Nền tảng Quản lý & Học tập Văn học Việt Nam
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Đăng ký tài khoản mới</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đăng ký tài khoản học viên để tham gia lớp học và quản lý bài tập
            </p>
          </div>

          <RegisterForm onSuccess={handleSuccess} />

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
            <div className="text-center text-sm text-slate-600">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="font-semibold text-amber-700 hover:text-amber-800 hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hệ thống bảo mật dữ liệu học viên</span>
            </div>
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
