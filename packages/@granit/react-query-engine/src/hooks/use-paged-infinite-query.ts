'use client';

// ---------------------------------------------------------------------------
// usePagedInfiniteQuery — generic react-query infinite query over a paged
// result (offset OR keyset cursor). The page shape and the next-page-param
// logic are caller-supplied, so it serves any Granit endpoint returning
// `{ items, totalCount? }` — query-engine `PagedResult`, data-lookup
// `LookupResultResponse`, chat message pages, etc.
// ---------------------------------------------------------------------------

import { keepPreviousData as keepPreviousDataFn, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { GetNextPageParamFunction, InfiniteData } from '@tanstack/react-query';

/** Minimal page contract: a list of items plus an optional total (null in cursor mode). */
export interface InfinitePageResult<T> {
  readonly items: readonly T[];
  readonly totalCount?: number | null;
}

export interface UsePagedInfiniteQueryOptions<T, TPage extends InfinitePageResult<T>, TPageParam> {
  /** Stable cache key. Page cursors are NOT part of it — they ride `pageParam`. */
  readonly queryKey: readonly unknown[];
  /** Fetches one page for the given cursor/page param. Thread the `signal`. */
  readonly fetchPage: (ctx: {
    readonly pageParam: TPageParam;
    readonly signal: AbortSignal;
  }) => Promise<TPage>;
  /** Param for the first page (e.g. `{ page: 1 }`, or `undefined` for a keyset start). */
  readonly initialPageParam: TPageParam;
  /** Computes the next param, or `undefined` to stop (offset exhausted / cursor null). */
  readonly getNextPageParam: GetNextPageParamFunction<TPageParam, TPage>;
  /** Disable the query (no request). Defaults to `true`. */
  readonly enabled?: boolean;
  /** staleTime for the cached pages (ms). */
  readonly staleTime?: number;
  /** Keep the previous data visible across key changes (typeahead). Defaults to `false`. */
  readonly keepPreviousData?: boolean;
}

export interface UsePagedInfiniteQueryReturn<T> {
  /** Items flattened across every fetched page, in page order. */
  readonly items: readonly T[];
  /** Total count from the last page, or `null` (cursor mode / skipped count). */
  readonly totalCount: number | null;
  /** First page is loading (no data yet). */
  readonly isLoading: boolean;
  /** Any fetch (initial or background) is in flight. */
  readonly isFetching: boolean;
  /** A subsequent page is being fetched. */
  readonly isFetchingNextPage: boolean;
  /** The query has data. */
  readonly isSuccess: boolean;
  /** The query errored. */
  readonly isError: boolean;
  /** The error, if any. */
  readonly error: unknown;
  /** Whether another page can be fetched. */
  readonly hasNextPage: boolean;
  /** Fetch status — `'idle'` while a gate (`enabled: false`) suppresses the request. */
  readonly fetchStatus: 'fetching' | 'paused' | 'idle';
  /** Fetch the next page (offset increment or continuation token, transparently). */
  readonly fetchNextPage: () => void;
  /** Refetch every loaded page from the first. */
  readonly refetch: () => void;
}

/**
 * Thin, page-shape-agnostic wrapper over TanStack `useInfiniteQuery` that
 * centralises the boilerplate every Granit infinite list repeats: flatten the
 * pages, expose `hasNextPage` / `fetchNextPage` with a re-entrancy guard, and
 * surface a flat result shape. Offset vs. keyset is entirely a function of the
 * `getNextPageParam` / `fetchPage` the caller supplies — the hook itself is
 * neutral.
 *
 * @example
 * ```ts
 * const { items, hasNextPage, fetchNextPage } = usePagedInfiniteQuery<Msg, MessagePage, string | undefined>({
 *   queryKey,
 *   fetchPage: ({ pageParam, signal }) => getMessages({ cursor: pageParam, signal }),
 *   initialPageParam: undefined,
 *   getNextPageParam: (last) => last.nextCursor ?? undefined,
 * });
 * ```
 */
export function usePagedInfiniteQuery<T, TPage extends InfinitePageResult<T>, TPageParam>(
  options: UsePagedInfiniteQueryOptions<T, TPage, TPageParam>
): UsePagedInfiniteQueryReturn<T> {
  const {
    queryKey,
    fetchPage,
    initialPageParam,
    getNextPageParam,
    enabled = true,
    staleTime,
    keepPreviousData = false,
  } = options;

  const query = useInfiniteQuery<
    TPage,
    unknown,
    InfiniteData<TPage, TPageParam>,
    readonly unknown[],
    TPageParam
  >({
    queryKey,
    // TanStack widens the context `pageParam` to `unknown` when the page-param
    // type is a free generic; it is `TPageParam` by construction here.
    queryFn: (ctx) => fetchPage({ pageParam: ctx.pageParam as TPageParam, signal: ctx.signal }),
    initialPageParam,
    getNextPageParam,
    enabled,
    staleTime,
    placeholderData: keepPreviousData ? keepPreviousDataFn : undefined,
  });

  const items = useMemo<readonly T[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  const totalCount = query.data?.pages.at(-1)?.totalCount ?? null;

  const fetchNextPage = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    items,
    totalCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchStatus: query.fetchStatus,
    fetchNextPage,
    refetch,
  };
}
