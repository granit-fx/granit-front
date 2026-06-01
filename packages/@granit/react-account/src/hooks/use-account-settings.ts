import { getAccountSettings } from '@granit/account';
import { useQuery } from '@tanstack/react-query';

import { buildAccountQueryKey, useAccountConfig } from '../providers/account-provider';

import type { AccountSettingsResponse } from '@granit/account';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches the public account settings (`GET {basePath}/config`).
 *
 * - No authentication required (anonymous endpoint).
 * - Cached indefinitely (`staleTime: Infinity`) — the setting rarely changes.
 * - No retry on failure — fail-closed: consumers should treat
 *   `data?.allowSelfRegistration ?? false` to disable registration by default.
 */
export function useAccountSettings(): UseQueryResult<AccountSettingsResponse> {
  const config = useAccountConfig();

  return useQuery({
    queryKey: buildAccountQueryKey(config, 'settings'),
    queryFn: () => getAccountSettings(config.client, config.basePath!),
    staleTime: Infinity,
    retry: false,
  });
}
