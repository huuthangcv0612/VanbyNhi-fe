import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface UsePWAReturn {
  /** Ứng dụng đã được cài đặt thành công trên thiết bị */
  isInstalled: boolean;
  /** Đang chạy ở chế độ Standalone (mở từ màn hình chính) */
  isStandalone: boolean;
  /** Trình duyệt có thể kích hoạt native install prompt (Android/Chrome/Edge) */
  canInstall: boolean;
  /** Thiết bị là iOS (Safari không hỗ trợ beforeinstallprompt) */
  isIOS: boolean;
  /** Trình duyệt có hỗ trợ Service Worker hay không */
  isSupported: boolean;
  /** Trạng thái đang trong quá trình hiển thị prompt cài đặt */
  isInstalling: boolean;
  /** Lỗi phát sinh trong quá trình cài đặt (nếu có) */
  installError: string | null;
  /** Banner cài đặt đã bị người dùng tạm ẩn (dismissed) hay chưa */
  isDismissed: boolean;
  /** Kích hoạt luồng cài đặt */
  promptInstall: () => Promise<boolean>;
  /** Tạm ẩn banner trong 7 ngày */
  dismissBanner: () => void;
  /** Mở lại banner hoặc bỏ qua trạng thái ẩn */
  resetDismiss: () => void;
}

const PWA_DISMISS_KEY = 'vanbynhi_pwa_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  const isNavigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(isStandaloneMedia || isNavigatorStandalone);
}

function checkIsIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || '';
  const isAppleDevice = /iPad|iPhone|iPod/.test(userAgent);
  const isIPadOS = navigator.maxTouchPoints > 1 && /Macintosh/.test(userAgent);
  return (isAppleDevice || isIPadOS) && !checkIsStandalone();
}

function checkIsDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(PWA_DISMISS_KEY);
    if (!raw) return false;
    const dismissedUntil = Number(raw);
    if (isNaN(dismissedUntil)) return false;
    return Date.now() < dismissedUntil;
  } catch {
    return false;
  }
}

export function usePWA(): UsePWAReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkIsStandalone());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsStandalone());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => checkIsDismissed());
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installError, setInstallError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  const isIOS = checkIsIOS();
  const canInstall = Boolean(deferredPrompt) && !isInstalled && !isStandalone;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Lắng nghe thay đổi display-mode (ví dụ khi user mở lại app sau khi install)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        setIsInstalled(true);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // Bắt sự kiện beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Bắt sự kiện appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstalling(false);
      try {
        localStorage.removeItem(PWA_DISMISS_KEY);
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      if (isIOS) {
        // Trên iOS không có native prompt, caller sẽ mở modal hướng dẫn
        return false;
      }
      setInstallError('Trình duyệt hiện không hỗ trợ cài đặt trực tiếp.');
      return false;
    }

    setIsInstalling(true);
    setInstallError(null);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình cài đặt.';
      setInstallError(msg);
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt, isIOS]);

  const dismissBanner = useCallback(() => {
    try {
      const expireTime = Date.now() + SEVEN_DAYS_MS;
      localStorage.setItem(PWA_DISMISS_KEY, String(expireTime));
      setIsDismissed(true);
    } catch {
      setIsDismissed(true);
    }
  }, []);

  const resetDismiss = useCallback(() => {
    try {
      localStorage.removeItem(PWA_DISMISS_KEY);
      setIsDismissed(false);
    } catch {
      setIsDismissed(false);
    }
  }, []);

  return {
    isInstalled,
    isStandalone,
    canInstall,
    isIOS,
    isSupported,
    isInstalling,
    installError,
    isDismissed,
    promptInstall,
    dismissBanner,
    resetDismiss,
  };
}
