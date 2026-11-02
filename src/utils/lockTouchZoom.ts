/**
 * Utility to lock pinch-to-zoom and double-tap zoom on mobile and tablet touch devices
 * without interfering with normal touch gestures (scrolling, swiping, tapping)
 * and without affecting desktop browser zoom (Ctrl+wheel, browser menu zoom).
 */
export function initTouchZoomLock(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Only apply to touch-capable devices (Mobile & Tablet)
  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  if (!isTouchDevice) {
    // Desktop: do not interfere with browser zoom or mouse gestures
    return;
  }

  // 1. Prevent Safari gesture zooming (gesturestart, gesturechange, gestureend)
  const preventGesture = (e: Event) => {
    e.preventDefault();
  };
  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });

  // 2. Prevent multi-touch pinch zoom on mobile/tablet (2 or more touches)
  document.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  // 3. Prevent double-tap to zoom on touch devices
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const target = e.target as HTMLElement | null;
        // Don't prevent if the user is interacting with form controls that require quick taps
        const isEditable =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable ||
          target?.closest('.tiptap');

        if (!isEditable) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    },
    { passive: false },
  );
}
