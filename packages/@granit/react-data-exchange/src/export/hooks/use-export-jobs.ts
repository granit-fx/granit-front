import { listExportJobs } from '@granit/data-exchange';
import { useQuery } from '@tanstack/react-query';

import { buildExportQueryKey, useExportConfig } from '../providers/export-provider';

import type { ExportJobListParams, ExportJobResponse } from '@granit/data-exchange';
import type { PagedResult } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches a paginated list of export jobs.
 *
 * @param params - Optional filtering/pagination parameters.
 *
 * @example
 * ```tsx
 * const { data } = useExportJobs({ status: 'Completed', page: 1, pageSize: 20 });
 * ```
 */
export function useExportJobs(
  params?: ExportJobListParams
): UseQueryResult<PagedResult<ExportJobResponse>> {
  const config = useExportConfig();

  return useQuery({
    queryKey: buildExportQueryKey(
      config,
      'jobs',
      params?.status ?? '',
      String(params?.page ?? ''),
      String(params?.pageSize ?? '')
    ),
    queryFn: () => listExportJobs(config.client, config.basePath, params),
  });
}
