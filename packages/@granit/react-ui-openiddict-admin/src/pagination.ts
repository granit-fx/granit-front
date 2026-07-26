// ---------------------------------------------------------------------------
// Server-side pagination state shared by the admin OIDC grids
// ---------------------------------------------------------------------------

import { useCallback, useState } from 'react';

/**
 * The part of `PagedResult<T>` the grids actually read. Declared structurally so
 * this UI package need not take a dependency on `@granit/query-engine`.
 */
interface PageEnvelope {
  readonly totalCount: number | null;
  readonly hasMore?: boolean;
}

/** Matches the backend default (`pageSize` = 25, clamped to [1, 100]). */
export const DEFAULT_PAGE_SIZE = 25;

/** Offered page sizes; kept at or below the backend's hard cap of 100. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export interface PageState {
  readonly page: number;
  readonly pageSize: number;
  readonly setPage: (page: number) => void;
  /** Resets to page 1 — a resized page invalidates the current offset. */
  readonly setPageSize: (pageSize: number) => void;
  /** Steps back when the last row of a non-first page is removed. */
  readonly onRowsRemoved: (remainingOnPage: number) => void;
  /** Resets to page 1 — used when a filter changes the result set. */
  readonly resetPage: () => void;
}

/** Page/pageSize state for a server-paginated grid. */
export function usePageState(initialPageSize: number = DEFAULT_PAGE_SIZE): PageState {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);

  const setPageSize = useCallback((next: number) => {
    setPageSizeRaw(next);
    setPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const onRowsRemoved = useCallback((remainingOnPage: number) => {
    if (remainingOnPage <= 0) setPage((current) => Math.max(1, current - 1));
  }, []);

  return { page, pageSize, setPage, setPageSize, onRowsRemoved, resetPage };
}

/**
 * Whether pagination controls are worth rendering: more than one page's worth of
 * rows, or a `hasMore` flag when the backend withheld `totalCount`.
 */
export function shouldPaginate(result: PageEnvelope | undefined, pageSize: number): boolean {
  if (!result) return false;
  if (result.totalCount != null) return result.totalCount > pageSize;
  return result.hasMore === true;
}
