import { getApplicationInfo } from '@granit/openiddict-admin';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_OIDC_BASE_PATH } from '../constants';
import { buildAdminQueryKey, useAdminConfig } from '../providers/openiddict-admin-provider';

import type { UseQueryResult } from '@tanstack/react-query';

export interface ConsentApplicationInfo {
  readonly clientId: string | null;
  readonly displayName: string | null;
}

/**
 * Fetches public application display info for the OIDC consent page.
 *
 * Calls `GET {oidcBasePath}/applications/{clientId}` — requires authentication
 * but no admin permission. Returns `null` if the application is not found (404).
 *
 * Must be used inside an `<OpenIddictAdminProvider>`.
 */
export function useConsentApplication(
  clientId: string | null
): UseQueryResult<ConsentApplicationInfo | null> {
  const config = useAdminConfig();
  const oidcBasePath = config.oidcBasePath ?? DEFAULT_OIDC_BASE_PATH;

  return useQuery({
    queryKey: buildAdminQueryKey(config, 'oidc', 'consent-application', clientId ?? ''),
    queryFn: async () => {
      try {
        return await getApplicationInfo(config.client, oidcBasePath, clientId!);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
      }
    },
    enabled: !!clientId,
  });
}
