import { getTenantStorageQuota } from '@granit/documents';
import { useQuery } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider';

import type { TenantStorageQuotaResponse } from '@granit/documents';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Get the current tenant's storage quota usage. Lazy-created on first call,
 * so brand-new tenants see `usageBytes: 0` rather than a 404.
 */
export function useTenantStorageQuota(options?: {
  readonly enabled?: boolean;
}): UseQueryResult<TenantStorageQuotaResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'quota'),
    queryFn: () => getTenantStorageQuota(config.client, config.basePath),
    enabled: options?.enabled ?? true,
  });
}
