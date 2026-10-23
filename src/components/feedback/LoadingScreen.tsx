import { useCallback, useRef } from 'react';
import { DotLottieReact, setWasmUrl, type DotLottie } from '@lottiefiles/dotlottie-react';

if (
  typeof window !== 'undefined' &&
  window.location?.origin &&
  !window.location.origin.includes(':3000')
) {
  try {
    const wasmUrl = new URL('/wasm/dotlottie-player.wasm', window.location.origin).href;
    setWasmUrl(wasmUrl);
  } catch {
    // Ignore in case already initialized or test environment
  }
}

export interface LoadingScreenProps {
  message?: string;
  animationSrc?: string;
  className?: string;
  showBrand?: boolean;
  onFirstLoopComplete?: () => void;
}

export function LoadingScreen({
  message = 'Đang tải dữ liệu...',
  animationSrc = '/animations/loading.lottie',
  className = '',
  showBrand = true,
  onFirstLoopComplete,
}: LoadingScreenProps) {
  const onLoopRef = useRef(onFirstLoopComplete);
  onLoopRef.current = onFirstLoopComplete;

  const dotLottieRefCallback = useCallback((dotLottie: DotLottie | null) => {
    if (!dotLottie) return;

    let triggered = false;
    const handleLoop = () => {
      if (!triggered) {
        triggered = true;
        onLoopRef.current?.();
      }
    };

    dotLottie.addEventListener('loop', handleLoop);
    dotLottie.addEventListener('complete', handleLoop);
  }, []);

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="w-56 h-36 sm:w-64 sm:h-40 flex items-center justify-center mb-2">
        <DotLottieReact
          src={animationSrc}
          loop
          autoplay
          dotLottieRefCallback={dotLottieRefCallback}
          className="w-full h-full object-contain"
          aria-label="Đang tải hoạt ảnh"
        />
      </div>
      {showBrand && (
        <h3 className="text-base sm:text-lg font-bold font-serif text-slate-800 mb-1 tracking-tight">
          VanbyNhi
        </h3>
      )}
      <p className="text-xs sm:text-sm text-slate-500">{message}</p>
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
