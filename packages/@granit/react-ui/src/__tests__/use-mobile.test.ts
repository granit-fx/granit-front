import { act, renderHook } from '@testing-library/react';

import { useIsMobile } from '../hooks/use-mobile';

describe('useIsMobile', () => {
  const listeners = new Map<string, () => void>();

  beforeEach(() => {
    listeners.clear();
    // jsdom doesn't implement matchMedia; assign a mock directly (granit-front's
    // test setup doesn't polyfill it, so vi.spyOn would have nothing to spy on).
    globalThis.matchMedia = vi.fn().mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: (_: string, handler: () => void) => {
            listeners.set('change', handler);
          },
          removeEventListener: vi.fn(),
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList
    );
  });

  it('should return false on desktop viewport', () => {
    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return true on mobile viewport', () => {
    Object.defineProperty(globalThis, 'innerWidth', { value: 375, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should react to viewport changes', () => {
    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(globalThis, 'innerWidth', { value: 375, writable: true });
      listeners.get('change')?.();
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListener = vi.fn();
    // jsdom doesn't implement matchMedia; assign a mock directly (granit-front's
    // test setup doesn't polyfill it, so vi.spyOn would have nothing to spy on).
    globalThis.matchMedia = vi.fn().mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList
    );

    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true });
    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
