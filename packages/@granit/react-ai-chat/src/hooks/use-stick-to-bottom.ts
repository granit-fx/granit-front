import { useCallback, useEffect, useRef, useState } from 'react';

import type { RefObject } from 'react';

export interface UseStickToBottomOptions {
  /**
   * Distance (px) from the bottom within which the view counts as "at bottom".
   * A small slack absorbs sub-pixel rounding and the last line's leading.
   */
  readonly threshold?: number;
}

export interface UseStickToBottomReturn<S extends HTMLElement, C extends HTMLElement> {
  /** Attach to the scroll container (the element with `overflow-y: auto`). */
  readonly scrollRef: RefObject<S | null>;
  /** Attach to the growing content wrapper inside the scroll container. */
  readonly contentRef: RefObject<C | null>;
  /** Whether the view is currently pinned to (near) the bottom. */
  readonly isAtBottom: boolean;
  /** Scroll the container to the bottom and re-engage auto-stick. */
  readonly scrollToBottom: (behavior?: ScrollBehavior) => void;
}

const DEFAULT_THRESHOLD = 32;

/**
 * Headless stick-to-bottom for a scroll container the host owns. Tracks whether
 * the view is at the bottom and, while it is, keeps it pinned as the content
 * grows (the streaming case). Attach {@link UseStickToBottomReturn.scrollRef} to
 * the scroller and {@link UseStickToBottomReturn.contentRef} to the content
 * wrapper; render a button on `!isAtBottom` that calls `scrollToBottom`.
 *
 * Dependency-free: a scroll listener computes `isAtBottom`, and a
 * `ResizeObserver` (when available) re-pins on content growth. Both degrade
 * gracefully where the platform lacks them.
 */
export function useStickToBottom<
  S extends HTMLElement = HTMLDivElement,
  C extends HTMLElement = HTMLDivElement,
>({ threshold = DEFAULT_THRESHOLD }: UseStickToBottomOptions = {}): UseStickToBottomReturn<S, C> {
  const scrollRef = useRef<S | null>(null);
  const contentRef = useRef<C | null>(null);
  // Mirrors `isAtBottom` for observers/listeners that must read the latest value
  // without re-subscribing on every change.
  const stickRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = true;
    setIsAtBottom(true);
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior });
    } else {
      // jsdom / very old engines have no Element.scrollTo.
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance <= threshold;
    stickRef.current = atBottom;
    setIsAtBottom(atBottom);
  }, [threshold]);

  // Track the user's scroll position.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', update, { passive: true });
    update();
    return () => el.removeEventListener('scroll', update);
  }, [update]);

  // Re-pin to the bottom as the content grows, but only while already pinned —
  // a user who scrolled up is left where they are.
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      if (stickRef.current) scrollToBottom('auto');
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  // Start pinned to the latest message on mount.
  useEffect(() => {
    scrollToBottom('auto');
  }, [scrollToBottom]);

  return { scrollRef, contentRef, isAtBottom, scrollToBottom };
}
