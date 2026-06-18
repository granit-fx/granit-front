'use client';

import { findMissingScopeKey, searchLookup } from '@granit/data-lookup';
import { usePagedInfiniteQuery } from '@granit/react-query-engine';

import { useOptionalDataLookupConfig } from '../providers/data-lookup-provider';

import { buildLookupQueryKey } from './query-keys';
import { useDebouncedValue } from './use-debounced-value';

import type { AxiosInstance } from '@granit/api-client';
import type {
  LookupDescriptor,
  LookupItemResponse,
  LookupResultResponse,
} from '@granit/data-lookup';

/** Default page size when the caller does not specify one. */
const DEFAULT_PAGE_SIZE = 25;
/** Default debounce applied to the search term (ms). */
const DEFAULT_DEBOUNCE_MS = 250;
/** Default staleTime for search pages (ms). */
const DEFAULT_STALE_TIME_MS = 30_000;

/** Search inputs for {@link useLookup}. */
export interface UseLookupParams {
  /** Typeahead term. Debounced internally before it reaches the network. */
  readonly search?: string;
  /** Resolved scope values, keyed by the source's declared `scopeKeys`. */
  readonly scope?: Readonly<Record<string, string | null | undefined>>;
  /** Page size per fetch (clamped 1–200 server-side). Default `25`. */
  readonly pageSize?: number;
}

/** Infrastructure + behaviour options for {@link useLookup}. */
export interface UseLookupOptions {
  /** Axios instance used for the HTTP request. Falls back to {@link DataLookupProvider}. */
  readonly client?: AxiosInstance;
  /** Override the base path for registry-backed lookups. */
  readonly basePath?: string;
  /** Current UI culture (e.g. `"fr-CA"`). Added to the queryKey so caches are per-language. */
  readonly culture?: string;
  /** Debounce delay for the search term in ms. Default `250`. Set `0` to disable. */
  readonly debounceMs?: number;
  /** staleTime for the cached pages in ms. Default `30_000`. */
  readonly staleTime?: number;
  /** Force-disable the query (overrides the automatic scope gate). */
  readonly enabled?: boolean;
}

/** Shape returned by {@link useLookup}. */
export interface UseLookupResult {
  /** Flattened items across every fetched page. */
  readonly items: readonly LookupItemResponse[];
  /** Total count across pages, or `null` for cursor-based sources. */
  readonly totalCount: number | null;
  /** First page is loading (no data yet). */
  readonly isLoading: boolean;
  /** A fetch (initial or background) is in flight. */
  readonly isFetching: boolean;
  /** A subsequent page is being fetched (infinite-scroll). */
  readonly isFetchingNextPage: boolean;
  /** The query has data. */
  readonly isSuccess: boolean;
  /** The query errored. */
  readonly isError: boolean;
  /** The error, if any. */
  readonly error: unknown;
  /** Whether another page can be fetched. */
  readonly hasNextPage: boolean;
  /** React-Query fetch status — `'idle'` while the scope gate suppresses the request. */
  readonly fetchStatus: 'fetching' | 'paused' | 'idle';
  /** Fetches the next page (offset increment or continuation token, transparently). */
  readonly fetchNextPage: () => void;
  /** Refetches from the first page. */
  readonly refetch: () => void;
  /** Name of the scope key that is currently missing, if any (Empty Scope Trap). */
  readonly missingScopeKey: string | null;
}

/** Page cursor threaded through the infinite query: offset page OR continuation token. */
type LookupPageParam = { readonly page: number } | { readonly continuationToken: string };

/**
 * Infinite-scroll lookup search backed by `GET /lookups/{name}`. Handles both
 * server pagination modes transparently:
 *
 * - **Offset** — sends `page` / `pageSize`, stops when accumulated items reach
 *   `totalCount`.
 * - **Continuation token (keyset)** — forwards the received token, ignores
 *   `page`, stops when the token comes back `null`.
 *
 * **Empty Scope Trap** — when the descriptor declares `scopeKeys` and the
 * provided `scope` is missing a value, the query's `enabled` flag is forced to
 * `false`: NO HTTP request is issued until the parent field is filled.
 * Consumers read {@link UseLookupResult.missingScopeKey} to render a placeholder
 * such as "Pick a tenant first".
 *
 * The `search` term is debounced internally and the `queryKey` is segmented by
 * culture so switching language invalidates previously fetched labels.
 */
export function useLookup(
  descriptor: LookupDescriptor,
  params: UseLookupParams = {},
  options: UseLookupOptions = {}
): UseLookupResult {
  const config = useOptionalDataLookupConfig();
  const client = options.client ?? config?.client;
  if (!client) {
    throw new Error(
      'useLookup requires an Axios client. Pass options.client or wrap the tree in a <DataLookupProvider>.'
    );
  }
  const basePath = options.basePath ?? config?.basePath;
  const culture = options.culture ?? config?.culture;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const staleTime = options.staleTime ?? DEFAULT_STALE_TIME_MS;

  const debouncedSearch = useDebouncedValue(params.search ?? '', debounceMs);
  const scope = params.scope;

  const missingScopeKey = findMissingScopeKey(descriptor, scope);
  const scopeSatisfied = missingScopeKey === null;
  const effectiveEnabled = options.enabled === false ? false : scopeSatisfied;

  // Offset vs. keyset is decided entirely by nextLookupPageParam; the generic
  // hook owns the useInfiniteQuery wiring, flatten, and fetch-next guard.
  const paged = usePagedInfiniteQuery<LookupItemResponse, LookupResultResponse, LookupPageParam>({
    queryKey: buildLookupQueryKey(
      descriptor,
      { search: debouncedSearch, pageSize, scope },
      culture
    ),
    fetchPage: ({ pageParam, signal }) =>
      searchLookup(
        descriptor,
        { search: debouncedSearch, pageSize, scope, ...pageParam },
        { client, basePath, signal }
      ),
    initialPageParam: { page: 1 },
    getNextPageParam: nextLookupPageParam,
    enabled: effectiveEnabled,
    staleTime,
    keepPreviousData: true,
  });

  return { ...paged, missingScopeKey };
}

/**
 * Computes the next page cursor from the last result. Prefers the continuation
 * token (keyset mode); falls back to offset paging when `totalCount` is known;
 * stops otherwise.
 */
function nextLookupPageParam(
  last: LookupResultResponse,
  pages: readonly LookupResultResponse[]
): LookupPageParam | undefined {
  if (last.continuationToken != null) {
    return { continuationToken: last.continuationToken };
  }
  if (last.totalCount != null) {
    const fetched = pages.reduce((sum, page) => sum + page.items.length, 0);
    return fetched < last.totalCount ? { page: pages.length + 1 } : undefined;
  }
  return undefined;
}
