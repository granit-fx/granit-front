import { listImportJobs } from '@granit/data-exchange';
import { useQuery } from '@tanstack/react-query';

import { buildImportQueryKey, useImportConfig } from '../providers/import-provider.js';

import type { ImportJobListParams, ImportJobResponse } from '@granit/data-exchange';
import type { PagedResult } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches a paginated list of import jobs.
 *
 * @param params - Optional filtering/pagination parameters.
 *
 * @example
 * ```tsx
 * const { data } = useImportJobs({ status: 'Completed', page: 1, pageSize: 20 });
 * ```
 */
export function useImportJobs(
  params?: ImportJobListParams
): UseQueryResult<PagedResult<ImportJobResponse>> {
  const config = useImportConfig();

  return useQuery({
    queryKey: buildImportQueryKey(
      config,
      'jobs',
      params?.status ?? '',
      String(params?.page ?? ''),
      String(params?.pageSize ?? '')
    ),
    queryFn: () => listImportJobs(config.client, config.basePath, params),
  });
}
