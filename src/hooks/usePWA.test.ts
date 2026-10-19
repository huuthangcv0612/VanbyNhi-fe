import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWA, type BeforeInstallPromptEvent } from './usePWA';

describe('usePWA hook', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('initializes with default browser state', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isStandalone).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalling).toBe(false);
    expect(result.current.isDismissed).toBe(false);
  });

  it('captures beforeinstallprompt event and enables canInstall', () => {
    const { result } = renderHook(() => usePWA());

    const mockPromptEvent = Object.assign(new Event('beforeinstallprompt'), {
      platforms: ['web'],
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    }) as unknown as BeforeInstallPromptEvent;

    act(() => {
      window.dispatchEvent(mockPromptEvent);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('handles promptInstall accepting installation', async () => {
    const { result } = renderHook(() => usePWA());

    const mockPromptEvent = Object.assign(new Event('beforeinstallprompt'), {
      platforms: ['web'],
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    }) as unknown as BeforeInstallPromptEvent;

    act(() => {
      window.dispatchEvent(mockPromptEvent);
    });

    let success = false;
    await act(async () => {
      success = await result.current.promptInstall();
    });

    expect(mockPromptEvent.prompt).toHaveBeenCalled();
    expect(success).toBe(true);
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('dismisses banner and stores expiry timestamp in localStorage', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isDismissed).toBe(false);

    act(() => {
      result.current.dismissBanner();
    });

    expect(result.current.isDismissed).toBe(true);
    expect(localStorage.getItem('vanbynhi_pwa_dismissed_until')).not.toBeNull();

    act(() => {
      result.current.resetDismiss();
    });

    expect(result.current.isDismissed).toBe(false);
    expect(localStorage.getItem('vanbynhi_pwa_dismissed_until')).toBeNull();
  });

  it('updates state when appinstalled event fires', () => {
    const { result } = renderHook(() => usePWA());

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });
});
