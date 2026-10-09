import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getRoleMeta } from '@/utils/formatters';

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleMeta = user ? getRoleMeta(user.role) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 font-serif">
          403 — Không có quyền truy cập
        </h1>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Tài khoản của bạn ({roleMeta?.label || 'Chưa xác định'}) không có quyền truy cập vào tài nguyên hoặc chức năng này.
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ với Quản trị viên để được cấp quyền.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Quay lại
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
