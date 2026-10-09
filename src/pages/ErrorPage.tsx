import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorPage({
  title = 'Lỗi kết nối hoặc hệ thống',
  message = 'Không thể kết nối đến máy chủ VanbyNhi hoặc phiên xử lý bị gián đoạn. Vui lòng kiểm tra kết nối mạng và thử lại.',
  onRetry,
}: ErrorPageProps) {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-5">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 font-serif">
          {title}
        </h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Thử lại
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
