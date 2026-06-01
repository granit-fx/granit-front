import { listDeviceTokens } from '@granit/notifications-mobile-push';
import { useQuery } from '@tanstack/react-query';

import { useMobilePushConfig } from '../providers/mobile-push-provider';

import type { MobilePushTokenResponse } from '@granit/notifications-mobile-push';
import type { UseQueryResult } from '@tanstack/react-query';

/** Query key factory for device token queries. */
export const deviceTokenKeys = {
  all: ['device-tokens'] as const,
  list: () => [...deviceTokenKeys.all, 'list'] as const,
};

/**
 * Query hook that fetches all registered device tokens for the current user.
 *
 * Must be used within a {@link MobilePushProvider}.
 *
 * @example
 * ```tsx
 * const { data: tokens } = useDeviceTokens();
 * ```
 */
export function useDeviceTokens(): UseQueryResult<readonly MobilePushTokenResponse[]> {
  const { client, basePath } = useMobilePushConfig();

  return useQuery({
    queryKey: deviceTokenKeys.list(),
    queryFn: () => listDeviceTokens(client, basePath),
  });
}
