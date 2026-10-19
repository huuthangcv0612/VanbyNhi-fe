import { useState } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { IOSInstallGuideModal } from './IOSInstallGuideModal';

export function PWAInstallBanner() {
  const {
    isStandalone,
    isInstalled,
    canInstall,
    isIOS,
    isDismissed,
    isInstalling,
    installError,
    promptInstall,
    dismissBanner,
  } = usePWA();

  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Không hiển thị nếu đã cài đặt, đang chạy standalone, hoặc người dùng đã tạm ẩn
  if (isStandalone || isInstalled || isDismissed) {
    return null;
  }

  // Chỉ hiển thị khi có thể cài (Android/Chrome có deferredPrompt) hoặc là thiết bị iOS
  if (!canInstall && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    await promptInstall();
  };

  return (
    <>
      <aside
        role="region"
        aria-label="Cài đặt ứng dụng VanbyNhi"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200/90 shadow-xl shadow-amber-950/10 p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-white font-serif font-bold text-lg shadow-sm">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Cài đặt VanbyNhi
                </h3>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                  <Sparkles className="w-2.5 h-2.5" />
                  Mới
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                Trải nghiệm học tập toàn màn hình, mượt mà và mở nhanh từ Màn hình chính.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissBanner}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Để sau và đóng thông báo cài đặt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {installError && (
          <p className="mt-2 text-[11px] text-rose-600 bg-rose-50 rounded-lg p-1.5">
            {installError}
          </p>
        )}

        <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissBanner}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Để sau
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleInstallClick}
            isLoading={isInstalling}
            leftIcon={isIOS ? <Smartphone className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {isIOS ? 'Xem hướng dẫn' : 'Cài đặt ngay'}
          </Button>
        </div>
      </aside>

      <IOSInstallGuideModal
        isOpen={showIOSGuide}
        onClose={() => setShowIOSGuide(false)}
      />
    </>
  );
}
