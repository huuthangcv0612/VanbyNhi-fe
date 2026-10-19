import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePushNotification } from './usePushNotification';

describe('usePushNotification hook', () => {
  const originalNotification = window.Notification;

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: vi.fn() },
      configurable: true,
      writable: true,
    });
    (window as unknown as { PushManager?: unknown }).PushManager = {};
  });

  afterEach(() => {
    window.Notification = originalNotification;
  });

  it('detects when Notification is unsupported', () => {
    // @ts-expect-error Mocking unsupported environment
    delete window.Notification;

    const { result } = renderHook(() => usePushNotification());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe('unsupported');
  });

  it('reads current permission when supported', () => {
    window.Notification = {
      permission: 'default',
      requestPermission: vi.fn(),
    } as unknown as typeof Notification;

    const { result } = renderHook(() => usePushNotification());
    expect(result.current.permission).toBe('default');
  });

  it('requests permission only when requestPermission is explicitly called', async () => {
    const requestPermissionMock = vi.fn().mockResolvedValue('granted');
    window.Notification = {
      permission: 'default',
      requestPermission: requestPermissionMock,
    } as unknown as typeof Notification;

    const { result } = renderHook(() => usePushNotification());

    // Chưa gọi hàm -> chưa có request
    expect(requestPermissionMock).not.toHaveBeenCalled();

    let res: string = '';
    await act(async () => {
      res = await result.current.requestPermission();
    });

    expect(requestPermissionMock).toHaveBeenCalledTimes(1);
    expect(res).toBe('granted');
    expect(result.current.permission).toBe('granted');
  });
});
