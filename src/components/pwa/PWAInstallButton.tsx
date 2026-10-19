import { useState } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Button, type ButtonProps } from '@/components/ui/button';
import { IOSInstallGuideModal } from './IOSInstallGuideModal';
import { cn } from '@/utils/cn';

export interface PWAInstallButtonProps extends Omit<ButtonProps, 'onClick'> {
  showWhenInstalled?: boolean;
}

export function PWAInstallButton({
  className,
  variant = 'outline',
  size = 'sm',
  showWhenInstalled = false,
  ...props
}: PWAInstallButtonProps) {
  const {
    isStandalone,
    isInstalled,
    canInstall,
    isIOS,
    isInstalling,
    promptInstall,
  } = usePWA();

  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Nếu đã cài hoặc đang chạy standalone
  if (isStandalone || isInstalled) {
    if (!showWhenInstalled) return null;
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg', className)}>
        <Check className="w-3.5 h-3.5" />
        Đã cài ứng dụng
      </span>
    );
  }

  // Nếu không phải iOS và trình duyệt chưa có install prompt (ví dụ Safari desktop thông thường)
  if (!canInstall && !isIOS) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    await promptInstall();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        isLoading={isInstalling}
        leftIcon={isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        className={cn('text-xs cursor-pointer', className)}
        {...props}
      >
        {isIOS ? 'Cài đặt trên iOS' : 'Cài đặt ứng dụng'}
      </Button>

      <IOSInstallGuideModal
        isOpen={showIOSGuide}
        onClose={() => setShowIOSGuide(false)}
      />
    </>
  );
}
