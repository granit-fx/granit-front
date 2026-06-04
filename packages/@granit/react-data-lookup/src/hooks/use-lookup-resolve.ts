import { resolveLookup } from '@granit/data-lookup';
import { useQuery } from '@tanstack/react-query';

import { buildLookupResolveQueryKey } from './query-keys';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupItem } from '@granit/data-lookup';
import type { UseQueryResult } from '@tanstack/react-query';

/** Options accepted by {@link useLookupResolve}. */
export interface UseLookupResolveOptions {
  readonly client: AxiosInstance;
  readonly basePath?: string;
  readonly culture?: string;
  readonly enabled?: boolean;
}

/**
 * Resolves a single value into a {@link LookupItem} for rehydration
 * (e.g., when loading a form previously saved with a foreign-key value — the
 * label must be fetched to show a human-readable picker state).
 *
 * `GET /lookups/{name}/resolve?value=…` → {@link LookupItem} | `null`.
 *
 * Returns `data: null` when the value cannot be resolved (404) rather than
 * raising — callers typically show the raw value as a fallback.
 */
export function useLookupResolve(
  descriptor: LookupDescriptor,
  value: unknown,
  options: UseLookupResolveOptions
): UseQueryResult<LookupItem | null> {
  const { client, basePath, culture, enabled: forcedEnabled } = options;
  const hasValue = value !== null && value !== undefined && value !== '';

  return useQuery<LookupItem | null>({
    queryKey: buildLookupResolveQueryKey(descriptor, value, culture),
    queryFn: ({ signal }) => resolveLookup(descriptor, value, { client, basePath, signal }),
    enabled: forcedEnabled === false ? false : hasValue,
    staleTime: 5 * 60_000,
  });
}
