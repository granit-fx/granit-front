import { fetchBatchPresence, normalizeUserIds } from '@granit/presence';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '../constants';
import { buildPresenceQueryKey, usePresenceConfig } from '../providers/presence-provider';

import { presenceKeys } from './query-keys';

import type { BatchPresenceResponse } from '@granit/presence';
import type { UserId } from '@granit/types';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseBatchPresenceOptions {
  /** Set to `false` to suppress the request (e.g. when permission is missing). */
  readonly enabled?: boolean;
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
