import { getAccountConfig } from '@granit/authentication-local';
import { useQuery } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import { localAuthKeys } from './query-keys';

import type { IdentityLocalConfigResponse } from '@granit/authentication-local';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches the public local-identity config (anonymous), e.g. whether
 * self-registration is enabled. Cached aggressively — config rarely changes.
 */
export function useAccountConfig(): UseQueryResult<IdentityLocalConfigResponse> {
  const config = useLocalAuthConfig();

  return useQuery({
    queryKey: localAuthKeys.config(),
    queryFn: () => getAccountConfig(config.client, config.basePath!),
    staleTime: Infinity,
  });
}
