import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';

export interface InitialPageLoaderProps {
  children: ReactNode;
  /**
   * Thời lượng tối thiểu (ms) chạy 1 vòng animation nếu trang web không bị treo.
   * Animation loading.lottie dài 120 frames @ 60fps = 2000ms.
   */
  minDurationMs?: number;
}

export function InitialPageLoader({
  children,
  minDurationMs = 2000,
}: InitialPageLoaderProps) {
  const { isLoading } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const completedRef = useRef(false);

  // 1. Chạy ít nhất 1 chu kỳ animation (2 giây)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs]);

  // Nhận tín hiệu khi loop hoàn tất từ player
  const handleFirstLoopComplete = () => {
    setMinTimePassed(true);
  };

  // 2. Chuyển vào giao diện trang web khi:
  // - Animation đã chạy xong ít nhất 1 vòng (minTimePassed === true)
  // - VÀ trang web không bị treo / auth session đã tải xong (!isLoading)
  useEffect(() => {
    if (minTimePassed && !isLoading && !completedRef.current) {
      completedRef.current = true;
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsDestroyed(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [minTimePassed, isLoading]);

  if (isDestroyed) {
    return <>{children}</>;
  }

  return (
    <>
      <div className={isExiting ? 'contents' : 'invisible'}>
        {children}
      </div>
      <div
        data-testid="initial-page-loader"
        className={`fixed inset-0 z-9999 bg-slate-50 transition-opacity duration-300 ease-out ${
          isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-hidden={isExiting}
      >
        <LoadingScreen
          message="Đang chuẩn bị trang web..."
          onFirstLoopComplete={handleFirstLoopComplete}
        />
      </div>
    </>
  );
}
