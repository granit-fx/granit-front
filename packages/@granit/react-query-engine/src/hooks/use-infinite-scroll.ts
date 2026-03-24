// ---------------------------------------------------------------------------
// useInfiniteScroll — load-more pagination with automatic append
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

/** Contract for the fetcher function (compatible with PagedResult). */
export interface InfiniteScrollPage<T> {
  readonly items: readonly T[];
  readonly totalCount: number | null;
}

export interface UseInfiniteScrollOptions<T, P extends InfiniteScrollPage<T>> {
  /** Async function that fetches a page of data. */
  readonly fetcher: (page: number, pageSize: number) => Promise<P>;
  /** Number of items per page. Defaults to 20. */
  readonly pageSize?: number;
  /** Optional callback invoked after each successful fetch. */
  readonly onSuccess?: (page: P) => void;
  /** Whether the hook should fetch on mount. Defaults to true. */
  readonly enabled?: boolean;
}

export interface UseInfiniteScrollReturn<T> {
  /** All items loaded so far (accumulated across pages). */
  readonly items: readonly T[];
  /** Direct setter for optimistic or local updates. */
  readonly setItems: React.Dispatch<React.SetStateAction<readonly T[]>>;
  /** Total number of items available on the server. */
  readonly totalCount: number | null;
  /** True during the initial fetch (first page). */
  readonly loading: boolean;
  /** True while loading additional pages (not the first). */
  readonly loadingMore: boolean;
  /** Last fetch error, or null. */
  readonly error: Error | null;
  /** Whether more items can be loaded. */
  readonly hasMore: boolean;
  /** Load the next page and append items. */
  readonly loadMore: () => void;
  /** Reset to page 1 and reload. */
  readonly refresh: () => void;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Infinite scroll / load-more pagination hook.
 *
 * Accumulates items from successive pages with abort-on-refetch support.
 * Ideal for feeds, timelines, and activity logs.
 *
 * @example
 * ```tsx
 * const { items, hasMore, loadMore, loading } = useInfiniteScroll({
 *   fetcher: (page, pageSize) =>
 *     api.get(`/notifications?page=${page}&pageSize=${pageSize}`),
 * });
 *
 * return (
 *   <>
 *     {items.map(renderItem)}
 *     {hasMore && <button onClick={loadMore}>Charger plus</button>}
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll<T, P extends InfiniteScrollPage<T> = InfiniteScrollPage<T>>(
  options: UseInfiniteScrollOptions<T, P>
): UseInfiniteScrollReturn<T> {
  const { fetcher, pageSize = DEFAULT_PAGE_SIZE, onSuccess, enabled = true } = options;

  const [items, setItems] = useState<readonly T[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(0);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (pageNumber: number, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const page = await fetcher(pageNumber, pageSize);

        if (controller.signal.aborted) return;

        setItems((prev) => (append ? [...prev, ...page.items] : [...page.items]));
        setTotalCount(page.totalCount);
        onSuccess?.(page);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [fetcher, pageSize, onSuccess]
  );

  useEffect(() => {
    if (enabled) {
      setLoading(true);
      fetchPage(1, false);
    }
    return () => abortRef.current?.abort();
  }, [enabled, fetchPage]);

  const loadMore = useCallback(() => {
    const nextPage = Math.floor(items.length / pageSize) + 1;
    setLoadingMore(true);
    fetchPage(nextPage, true);
  }, [fetchPage, items.length, pageSize]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchPage(1, false);
  }, [fetchPage]);

  const hasMore = items.length < (totalCount ?? 0);

  return {
    items,
    setItems,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
