import { getExportStatus, listExports, requestExport } from '@granit/privacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPrivacyQueryKey, usePrivacyConfig } from '../providers/privacy-provider';

import type { PrivacyExportStatusResponse } from '@granit/privacy';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** List all data export requests for the current user. */
export function usePrivacyExports(): UseQueryResult<PrivacyExportStatusResponse[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'exports'),
    queryFn: () => listExports(config.client, config.basePath!),
  });
}

/** Poll the status of a specific data export request. */
export function usePrivacyExportStatus(
  requestId: string,
  options?: { pollingInterval?: number }
): UseQueryResult<PrivacyExportStatusResponse> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'exports', requestId),
    queryFn: () => getExportStatus(config.client, config.basePath!, requestId),
    enabled: requestId.length > 0,
    refetchInterval: options?.pollingInterval,
  });
}

/** Request a new GDPR data export. */
export function useRequestExport(): UseMutationResult<
  { requestId: string; requestedAt: string },
  Error,
  void
> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requestExport(config.client, config.basePath!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'exports'),
      });
    },
  });
}
