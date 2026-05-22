import { getUserPresence } from '@granit/presence';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '../constants.js';
import { buildPresenceQueryKey, usePresenceConfig } from '../providers/presence-provider.js';

import { presenceKeys } from './query-keys.js';

import type { PresenceResponse } from '@granit/presence';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseUserPresenceOptions {
  /** Set to `false` to suppress the request (e.g. when permission is missing). */
  readonly enabled?: boolean;
}

/**
 * Fetches presence for a single user.
 *
 * Requires `Presence.Users.Read`. Callers without that permission should
 * pass `enabled: false` and fall back to a muted `Offline` indicator
 * instead of letting the request 403.
 */
export function useUserPresence(
  userId: string,
  options: UseUserPresenceOptions = {}
): UseQueryResult<PresenceResponse> {
  const { enabled = true } = options;
  const config = usePresenceConfig();
  return useQuery({
    queryKey: buildPresenceQueryKey(config, ...presenceKeys.user(userId)),
    queryFn: () => getUserPresence(config.client, config.basePath, userId),
    staleTime: DEFAULT_STALE_TIME_MS,
    refetchOnWindowFocus: true,
    enabled: enabled && userId.length > 0,
  });
}
