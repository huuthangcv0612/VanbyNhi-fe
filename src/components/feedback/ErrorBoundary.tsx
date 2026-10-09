import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Không log thông tin nhạy cảm
    console.error('Lỗi giao diện ứng dụng (ErrorBoundary):', error.message, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-5">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Đã xảy ra sự cố không mong muốn
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Ứng dụng gặp sự cố khi hiển thị giao diện. Bạn có thể nhấn thử lại hoặc quay về trang chủ.
            </p>
            {this.state.error?.message && (
              <div className="mb-6 p-3 rounded-lg bg-slate-100 text-xs font-mono text-slate-700 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Thử lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleGoHome}
                leftIcon={<Home className="w-4 h-4" />}
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
