import { getMyPresence } from '@granit/presence';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '../constants.js';
import { buildPresenceQueryKey, usePresenceConfig } from '../providers/presence-provider.js';

import { presenceKeys } from './query-keys.js';

import type { PresenceResponse } from '@granit/presence';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches the current user's presence snapshot.
 *
 * Refetches on window focus and stays fresh for ~30 s. Combine with
 * `<PresenceHeartbeat />` to keep the server-side snapshot current.
 */
export function useMyPresence(): UseQueryResult<PresenceResponse> {
  const config = usePresenceConfig();
  return useQuery({
    queryKey: buildPresenceQueryKey(config, ...presenceKeys.my()),
    queryFn: () => getMyPresence(config.client, config.basePath),
    staleTime: DEFAULT_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });
}
