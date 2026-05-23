import { PRESENCE_DEFAULTS, getBatchPresence } from '@granit/presence';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '../constants.js';
import { buildPresenceQueryKey, usePresenceConfig } from '../providers/presence-provider.js';

import { presenceKeys } from './query-keys.js';

import type { AxiosInstance } from '@granit/api-client';
import type { BatchPresenceResponse, PresenceResponse } from '@granit/presence';
import type { UserId } from '@granit/types';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseBatchPresenceOptions {
  /** Set to `false` to suppress the request (e.g. when permission is missing). */
  readonly enabled?: boolean;
}

const MAX_BATCH = PRESENCE_DEFAULTS.MaxBatchSize;

/**
 * Returns the deduplicated, sorted list — caller doesn't have to worry
 * about ordering or duplicates when picking IDs from several sources.
 */
export function normalizeUserIds(userIds: readonly UserId[]): UserId[] {
  return Array.from(new Set(userIds))
    .filter((id) => id.length > 0)
    .sort();
}

export async function fetchBatchPresence(
  client: AxiosInstance,
  basePath: string,
  userIds: readonly UserId[]
): Promise<BatchPresenceResponse> {
  if (userIds.length <= MAX_BATCH) {
    return getBatchPresence(client, basePath, { userIds });
  }
  // Server cap is 200 — chunk above that and fan out in parallel.
  const chunks: UserId[][] = [];
  for (let i = 0; i < userIds.length; i += MAX_BATCH) {
    chunks.push(userIds.slice(i, i + MAX_BATCH));
  }
  const responses = await Promise.all(
    chunks.map((chunk) => getBatchPresence(client, basePath, { userIds: chunk }))
  );
  const merged: Record<UserId, PresenceResponse> = {} as Record<UserId, PresenceResponse>;
  for (const { presences } of responses) {
    Object.assign(merged, presences);
  }
  return { presences: merged };
}

/**
 * Fetches presence for a list of users in one (or more) batch calls.
 *
 * Inputs are deduplicated and sorted before hitting the network and
 * before forming the query key, so two components that ask for the
 * same set of users share a single cache entry. Lists larger than the
 * server cap (200) are chunked transparently and resolved in parallel.
 *
 * Requires `Presence.Users.Read`. Callers without that permission should
 * pass `enabled: false`.
 */
export function useBatchPresence(
  userIds: readonly UserId[],
  options: UseBatchPresenceOptions = {}
): UseQueryResult<BatchPresenceResponse> {
  const { enabled = true } = options;
  const config = usePresenceConfig();
  const ids = normalizeUserIds(userIds);

  return useQuery({
    queryKey: buildPresenceQueryKey(config, ...presenceKeys.batch(ids)),
    queryFn: () => fetchBatchPresence(config.client, config.basePath, ids),
    staleTime: DEFAULT_STALE_TIME_MS,
    refetchOnWindowFocus: true,
    enabled: enabled && ids.length > 0,
  });
}
