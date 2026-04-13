import { fetchIdentityCapabilities } from '@granit/identity';
import { useQuery } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider.js';

import type { IdentityProviderCapabilities } from '@granit/identity';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the active identity provider's capabilities.
 *
 * Capabilities are stable for the lifetime of the backend deployment,
 * so `staleTime` defaults to `Infinity`.
 *
 * @example
 * ```tsx
 * const { data: caps } = useIdentityCapabilities();
 * if (caps && !caps.supportsIndividualSessionTermination) {
 *   // hide "terminate session" button
 * }
 * ```
 */
export function useIdentityCapabilities(options?: {
  enabled?: boolean;
}): UseQueryResult<IdentityProviderCapabilities> {
  const config = useIdentityConfig();

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'capabilities'),
    queryFn: () =>
      fetchIdentityCapabilities(config.client, config.basePath),
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
  });
}
