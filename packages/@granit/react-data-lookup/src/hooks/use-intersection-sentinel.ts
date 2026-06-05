'use client';

import { useCallback, useEffect, useRef } from 'react';

/** Options for {@link useIntersectionSentinel}. */
export interface UseIntersectionSentinelOptions {
  /** Whether more pages can be fetched. When `false`, the observer is detached. */
  readonly enabled: boolean;
  /** Invoked when the sentinel scrolls into view and `enabled` is `true`. */
  readonly onIntersect: () => void;
  /**
   * Distance (CSS margin syntax) from the viewport at which to pre-fetch the
   * next page. Default `"128px"` — fetches slightly before the sentinel is
   * actually visible to avoid a visible stall.
   */
  readonly rootMargin?: string;
}

/**
 * Returns a callback ref to attach to a sentinel element at the end of an
 * infinite list. When the element intersects the viewport and `enabled` is
 * `true`, `onIntersect` fires (typically `fetchNextPage`).
 *
 * Mirrors the IntersectionObserver pattern used by `<EntityGallery>` so the
 * lookup pickers get infinite-scroll without coupling to a virtualization lib.
 * Degrades gracefully when `IntersectionObserver` is unavailable (SSR / jsdom).
 */
export function useIntersectionSentinel(
  options: UseIntersectionSentinelOptions
): (node: Element | null) => void {
  const { enabled, onIntersect, rootMargin = '128px' } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Keep the latest callback without re-creating the observer on every render.
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return useCallback(
    (node: Element | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node || !enabled) return;
      if (typeof IntersectionObserver === 'undefined') return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            onIntersectRef.current();
          }
        },
        { rootMargin }
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [enabled, rootMargin]
  );
}
