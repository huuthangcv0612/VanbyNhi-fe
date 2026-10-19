import { useState, useCallback } from 'react';

export type PushPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushNotificationReturn {
  /** Thiết bị và trình duyệt có hỗ trợ Web Push API hay không */
  isSupported: boolean;
  /** Quyền thông báo hiện tại của trình duyệt */
  permission: PushPermissionStatus;
  /** Trạng thái đang yêu cầu cấp quyền */
  isRequesting: boolean;
  /** Lỗi phát sinh (nếu có) */
  error: string | null;
  /** Yêu cầu người dùng cấp quyền thông báo (chỉ gọi khi có thao tác người dùng chủ động) */
  requestPermission: () => Promise<NotificationPermission | 'unsupported'>;
}

function getInitialPermission(): PushPermissionStatus {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

export function usePushNotification(): UsePushNotificationReturn {
  const [permission, setPermission] = useState<PushPermissionStatus>(() => getInitialPermission());
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const requestPermission = useCallback(async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!isSupported) {
      setError('Trình duyệt hoặc thiết bị hiện tại không hỗ trợ Web Push Notification.');
      return 'unsupported';
    }

    setIsRequesting(true);
    setError(null);

    try {
      // Yêu cầu quyền thông báo từ trình duyệt (chỉ gọi khi user click)
      const res = await window.Notification.requestPermission();
      setPermission(res);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể yêu cầu quyền thông báo.';
      setError(msg);
      return 'denied';
    } finally {
      setIsRequesting(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isRequesting,
    error,
    requestPermission,
  };
}
