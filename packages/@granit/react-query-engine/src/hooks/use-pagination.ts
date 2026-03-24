// ---------------------------------------------------------------------------
// usePagination — classic offset-based pagination with page navigation
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

/** Contract for the fetcher function (compatible with PagedResult). */
export interface PaginationPage<T> {
  readonly items: readonly T[];
  readonly totalCount: number | null;
}

export interface UsePaginationOptions<T, P extends PaginationPage<T>> {
  /** Async function that fetches a single page of data. */
  readonly fetcher: (page: number, pageSize: number) => Promise<P>;
  /** Number of items per page. Defaults to 20. */
  readonly pageSize?: number;
  /** Optional callback invoked after each successful fetch. */
  readonly onSuccess?: (page: P) => void;
  /** Whether the hook should fetch on mount. Defaults to true. */
  readonly enabled?: boolean;
}

export interface UsePaginationReturn<T> {
  /** Current page items. */
  readonly items: readonly T[];
  /** Direct setter for optimistic or local updates. */
  readonly setItems: React.Dispatch<React.SetStateAction<readonly T[]>>;
  /** Total number of items across all pages. */
  readonly totalCount: number | null;
  /** True during the initial or page-change fetch. */
  readonly loading: boolean;
  /** Last fetch error, or null. */
  readonly error: Error | null;
  /** Current page number (1-based). */
  readonly page: number;
  /** Current page size. */
  readonly pageSize: number;
  /** Total number of pages. */
  readonly totalPages: number;
  /** Whether there is a previous page. */
  readonly hasPreviousPage: boolean;
  /** Whether there is a next page. */
  readonly hasNextPage: boolean;
  /** Navigate to a specific page. */
  readonly goToPage: (page: number) => void;
  /** Navigate to the next page (no-op on last page). */
  readonly nextPage: () => void;
  /** Navigate to the previous page (no-op on first page). */
  readonly previousPage: () => void;
  /** Re-fetch the current page. */
  readonly refresh: () => void;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Classic offset-based pagination hook.
 *
 * Fetches a single page at a time and provides page navigation controls.
 * Aborts in-flight requests on page change or unmount.
 *
 * @example
 * ```tsx
 * const { items, page, totalPages, nextPage, previousPage } = usePagination({
 *   fetcher: (page, pageSize) => api.get(`/users?page=${page}&pageSize=${pageSize}`),
 * });
 * ```
 */
export function usePagination<T, P extends PaginationPage<T> = PaginationPage<T>>(
  options: UsePaginationOptions<T, P>
): UsePaginationReturn<T> {
  const { fetcher, pageSize = DEFAULT_PAGE_SIZE, onSuccess, enabled = true } = options;

  const [items, setItems] = useState<readonly T[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const abortRef = useRef<AbortController | null>(null);

  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / pageSize));
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  const fetchPageData = useCallback(
    async (pageNumber: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const result = await fetcher(pageNumber, pageSize);

        if (controller.signal.aborted) return;

        setItems(result.items);
        setTotalCount(result.totalCount);
        onSuccess?.(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [fetcher, pageSize, onSuccess]
  );

  useEffect(() => {
    if (enabled) {
      fetchPageData(page);
    }
    return () => abortRef.current?.abort();
  }, [enabled, fetchPageData, page]);

  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.max(1, Math.min(target, totalPages));
      setPage(clamped);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const refresh = useCallback(() => {
    fetchPageData(page);
  }, [fetchPageData, page]);

  return {
    items,
    setItems,
    totalCount,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    goToPage,
    nextPage,
    previousPage,
    refresh,
  };
}
