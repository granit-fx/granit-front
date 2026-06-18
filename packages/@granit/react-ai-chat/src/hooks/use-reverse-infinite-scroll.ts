import { useEffect, useLayoutEffect, useRef } from 'react';

import type { RefObject } from 'react';

/** Inputs for {@link useReverseInfiniteScroll}. */
export interface UseReverseInfiniteScrollParams {
  /**
   * The scroll container (the element with `overflow-y: auto`). Pass the SAME
   * ref you give `useStickToBottom().scrollRef` so the two behaviours share one
   * scroller — stick-to-bottom handles new/streamed messages at the bottom, this
   * hook handles older messages prepended at the top.
   */
  readonly scrollContainerRef: RefObject<HTMLElement | null>;
  /** A zero-height marker rendered above the messages (the thread's top sentinel). */
  readonly topSentinelRef: RefObject<HTMLElement | null>;
  /** Current message count — the signal that an older page has been prepended. */
  readonly itemCount: number;
  /** Whether an older page can still be loaded. */
  readonly hasMoreOlder: boolean;
  /** Whether an older page is currently being fetched. */
  readonly isLoadingOlder: boolean;
  /** Loads the next older page (e.g. `useConversationMessages().loadOlder`). */
  readonly loadOlder: () => void;
  /** Prefetch margin so older messages load just before the sentinel is visible. Default `'200px'`. */
  readonly rootMargin?: string;
}

/**
 * Reverse infinite scroll for a chat thread: loads OLDER messages as the user
 * scrolls UP and keeps the viewport visually anchored on the same message when a
 * page is prepended (instead of jumping).
 *
 * An `IntersectionObserver` on the top sentinel triggers {@link loadOlder}; just
 * before the load, the container's `scrollHeight` is captured, and once the
 * older page commits (detected via {@link itemCount} growth) `scrollTop` is
 * pushed down by the height delta in a layout effect — before the browser
 * paints, so there is no flicker.
 *
 * Side-effect only (returns nothing). Stick-to-bottom for new/streamed messages
 * stays the host's concern (see {@link useStickToBottom}); the two compose
 * because this hook only adjusts after a load-older and never fights the bottom.
 */
export function useReverseInfiniteScroll({
  scrollContainerRef,
  topSentinelRef,
  itemCount,
  hasMoreOlder,
  isLoadingOlder,
  loadOlder,
  rootMargin = '200px',
}: UseReverseInfiniteScrollParams): void {
  // scrollHeight captured right before an older page loads; `null` when idle.
  const anchorRef = useRef<number | null>(null);
  // Latest values for the observer callback, read without re-subscribing.
  const stateRef = useRef({ hasMoreOlder, isLoadingOlder, loadOlder });
  stateRef.current = { hasMoreOlder, isLoadingOlder, loadOlder };

  // Pin the viewport: an older page grows the content at the TOP, so offset
  // scrollTop by the height delta to keep the same message under the user's eye.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || anchorRef.current === null) return;
    const delta = el.scrollHeight - anchorRef.current;
    if (delta > 0) el.scrollTop += delta;
    anchorRef.current = null;
  }, [itemCount, scrollContainerRef]);

  // If a load resolved without growing the list, drop the stale anchor so the
  // observer can trigger again.
  useEffect(() => {
    if (!isLoadingOlder) anchorRef.current = null;
  }, [isLoadingOlder]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = topSentinelRef.current;
    if (!root || !sentinel || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        const state = stateRef.current;
        // Guard against re-entry: an in-flight load (or a pending anchor) must
        // settle before the next page is requested.
        if (!state.hasMoreOlder || state.isLoadingOlder || anchorRef.current !== null) return;
        anchorRef.current = root.scrollHeight;
        state.loadOlder();
      },
      { root, rootMargin, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [scrollContainerRef, topSentinelRef, rootMargin]);
}
