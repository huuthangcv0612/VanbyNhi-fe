import { FileQuestion, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-5">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 font-serif">
          404 — Không tìm thấy trang
        </h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang địa chỉ khác.
        </p>

        <div className="flex items-center justify-center">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Quay về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
