import { findMissingScopeKey, searchLookup } from '@granit/data-lookup';
import { useQuery } from '@tanstack/react-query';

import { buildLookupQueryKey } from './query-keys';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupQueryParams, LookupResult } from '@granit/data-lookup';
import type { UseQueryResult } from '@tanstack/react-query';

/** Options accepted by {@link useLookup}. */
export interface UseLookupOptions {
  /** Axios instance used for the HTTP request. */
  readonly client: AxiosInstance;
  /** Override the base path for registry-backed lookups. */
  readonly basePath?: string;
  /** Current UI culture (e.g. `"fr-CA"`). Added to the queryKey so cached results are invalidated per language. */
  readonly culture?: string;
  /**
   * Debounce delay for the search term in milliseconds. Forwarded by higher-level
   * components (`LookupPicker`, `LookupSelect`) — applied to the `search` param
   * before it reaches the hook.
   */
  readonly staleTime?: number;
  /**
   * Forcibly disable the query (advanced — overrides the automatic
   * {@link findMissingScopeKey} gate).
   */
  readonly enabled?: boolean;
}

/** Shape returned by {@link useLookup}. */
export type UseLookupResult = UseQueryResult<LookupResult> & {
  /** Name of the scope key that is currently missing, if any (Empty Scope Trap). */
  readonly missingScopeKey: string | null;
};

/**
 * Fetches a page of items from a lookup source via `GET /lookups/{name}`.
 *
 * **Empty Scope Trap mitigation** — when the descriptor declares
 * `scopeKeys: ["tenantId"]` and the provided `scope` is missing the value,
 * React-Query's `enabled` flag is flipped to `false`: NO HTTP request is issued
 * until the parent field is filled. Consumers (`LookupSelect`, `LookupPicker`)
 * use {@link UseLookupResult.missingScopeKey} to render a placeholder such as
 * "Pick a tenant first".
 *
 * The `queryKey` includes the caller culture so the cache is segmented per
 * language — switching language invalidates all previously fetched labels.
 */
export function useLookup(
  descriptor: LookupDescriptor,
  params: LookupQueryParams,
  options: UseLookupOptions
): UseLookupResult {
  const { client, basePath, culture, staleTime, enabled: forcedEnabled } = options;
  const missingScopeKey = findMissingScopeKey(descriptor, params.scope);
  const scopeSatisfied = missingScopeKey === null;

  const effectiveEnabled = forcedEnabled === false ? false : scopeSatisfied;

  const query = useQuery<LookupResult>({
    queryKey: buildLookupQueryKey(descriptor, params, culture),
    queryFn: ({ signal }) => searchLookup(descriptor, params, { client, basePath, signal }),
    enabled: effectiveEnabled,
    staleTime: staleTime ?? 30_000,
    placeholderData: (previous) => previous,
  });

  return Object.assign(query, { missingScopeKey });
}
