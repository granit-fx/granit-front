'use client';

import { resolveLookup } from '@granit/data-lookup';
import { useQuery } from '@tanstack/react-query';

import { useOptionalDataLookupConfig } from '../providers/data-lookup-provider';

import { buildLookupResolveQueryKey } from './query-keys';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupItemResponse } from '@granit/data-lookup';
import type { UseQueryResult } from '@tanstack/react-query';

/** Options accepted by {@link useLookupResolve}. */
export interface UseLookupResolveOptions {
  /** Axios instance used for the HTTP request. Falls back to {@link DataLookupProvider}. */
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly culture?: string;
  readonly enabled?: boolean;
}

/**
 * Resolves a single value into a {@link LookupItemResponse} for rehydration
 * (e.g., when loading a form previously saved with a foreign-key value — the
 * label must be fetched to show a human-readable picker state).
 *
 * `GET /lookups/{name}/resolve?value=…` → {@link LookupItemResponse} | `null`.
 *
 * Returns `data: null` when the value cannot be resolved (404) rather than
 * raising — callers typically show the raw value as a fallback.
 */
export function useLookupResolve(
  descriptor: LookupDescriptor,
  value: unknown,
  options: UseLookupResolveOptions = {}
): UseQueryResult<LookupItemResponse | null> {
  const config = useOptionalDataLookupConfig();
  const client = options.client ?? config?.client;
  if (!client) {
    throw new Error(
      'useLookupResolve requires an Axios client. Pass options.client or wrap the tree in a <DataLookupProvider>.'
    );
  }
  const basePath = options.basePath ?? config?.basePath;
  const culture = options.culture ?? config?.culture;
  const { enabled: forcedEnabled } = options;
  const hasValue = value !== null && value !== undefined && value !== '';

  return useQuery<LookupItemResponse | null>({
    queryKey: buildLookupResolveQueryKey(descriptor, value, culture),
    queryFn: ({ signal }) => resolveLookup(descriptor, value, { client, basePath, signal }),
    enabled: forcedEnabled === false ? false : hasValue,
    staleTime: 5 * 60_000,
  });
}
