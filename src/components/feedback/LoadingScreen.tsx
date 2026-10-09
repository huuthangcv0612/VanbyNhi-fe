import { BookOpen } from 'lucide-react';

export function LoadingScreen({ message = 'Đang tải dữ liệu...' }: { message?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center mb-4">
        <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shadow-inner animate-pulse">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-amber-600 border-t-transparent animate-spin" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">VanbyNhi</h3>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center p-4" role="status">
      <div
        className={`${sizeClasses[size]} border-2 border-amber-600 border-t-transparent rounded-full animate-spin`}
        aria-label="Đang tải"
      />
    </div>
  );
}
