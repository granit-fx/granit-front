'use client';

import { getLookupManifest } from '@granit/data-lookup';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useOptionalDataLookupConfig } from '../providers/data-lookup-provider';

import { buildLookupManifestQueryKey } from './query-keys';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupManifest, LookupManifestEntry } from '@granit/data-lookup';
import type { UseQueryResult } from '@tanstack/react-query';

/** Default staleTime — the manifest is registry-stable, so cache it generously. */
const DEFAULT_MANIFEST_STALE_TIME_MS = 5 * 60_000;

/** Options accepted by {@link useLookupManifest}. */
export interface UseLookupManifestOptions {
  /** Axios instance used for the HTTP request. Falls back to {@link DataLookupProvider}. */
  readonly client?: AxiosInstance;
  /** Override the base path. Defaults to `/lookups`. */
  readonly basePath?: string;
  /**
   * Predicate the app supplies to decide whether the current user holds a given
   * permission. When provided, {@link UseLookupManifestResult.accessibleLookups}
   * and {@link UseLookupManifestResult.canUse} filter sources whose
   * `requiredPermission` the user lacks. When omitted, every source is treated
   * as accessible (the backend still re-checks per request).
   */
  readonly hasPermission?: (permission: string) => boolean;
  /** staleTime override (ms). Default `300_000`. */
  readonly staleTime?: number;
  /** Force-disable the query. */
  readonly enabled?: boolean;
}

/** Shape returned by {@link useLookupManifest}. */
export type UseLookupManifestResult = UseQueryResult<LookupManifest> & {
  /** Every registered source (unfiltered). */
  readonly lookups: readonly LookupManifestEntry[];
  /** Sources the current user may use, per the `hasPermission` predicate. */
  readonly accessibleLookups: readonly LookupManifestEntry[];
  /** Whether the named source exists AND the user holds its required permission. */
  readonly canUse: (name: string) => boolean;
  /** Returns the manifest entry for a name, or `undefined`. */
  readonly getEntry: (name: string) => LookupManifestEntry | undefined;
};

/**
 * Fetches the lookup discovery manifest (`GET /lookups`) and derives a
 * permission-gated view. The manifest already hides sources the user cannot
 * read server-side; the optional `hasPermission` predicate lets the UI hide
 * pickers proactively (e.g. before opening a builder) without a round-trip.
 */
export function useLookupManifest(options: UseLookupManifestOptions = {}): UseLookupManifestResult {
  const config = useOptionalDataLookupConfig();
  const client = options.client ?? config?.client;
  if (!client) {
    throw new Error(
      'useLookupManifest requires an Axios client. Pass options.client or wrap the tree in a <DataLookupProvider>.'
    );
  }
  const basePath = options.basePath ?? config?.basePath;
  const { hasPermission, staleTime, enabled } = options;

  const query = useQuery<LookupManifest>({
    queryKey: buildLookupManifestQueryKey(basePath),
    queryFn: ({ signal }) => getLookupManifest({ client, basePath, signal }),
    staleTime: staleTime ?? DEFAULT_MANIFEST_STALE_TIME_MS,
    enabled: enabled !== false,
  });

  const lookups = useMemo<readonly LookupManifestEntry[]>(
    () => query.data?.lookups ?? [],
    [query.data]
  );

  const accessibleLookups = useMemo<readonly LookupManifestEntry[]>(() => {
    if (!hasPermission) return lookups;
    return lookups.filter(
      (entry) => entry.requiredPermission == null || hasPermission(entry.requiredPermission)
    );
  }, [lookups, hasPermission]);

  const getEntry = useCallback(
    (name: string) => lookups.find((entry) => entry.name === name),
    [lookups]
  );

  const canUse = useCallback(
    (name: string) => {
      const entry = lookups.find((e) => e.name === name);
      if (!entry) return false;
      if (!hasPermission || entry.requiredPermission == null) return true;
      return hasPermission(entry.requiredPermission);
    },
    [lookups, hasPermission]
  );

  return Object.assign(query, { lookups, accessibleLookups, canUse, getEntry });
}
