import {
  getExportStatus,
  listExportScopes,
  listExports,
  requestExport,
  requestExportOnBehalfOf,
} from '@granit/privacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPrivacyQueryKey, usePrivacyConfig } from '../providers/privacy-provider';

import type {
  PrivacyExportOnBehalfOfRequest,
  PrivacyExportRequestResponse,
  PrivacyExportScopeResponse,
  PrivacyExportStatusResponse,
} from '@granit/privacy';
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

/** List available export scopes for the current tenant. */
export function useExportScopes(): UseQueryResult<PrivacyExportScopeResponse[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'exports', 'scopes'),
    queryFn: () => listExportScopes(config.client, config.basePath!),
  });
}

/** Request a personal data export on behalf of another data subject (admin DSR). */
export function useRequestExportOnBehalfOf(): UseMutationResult<
  PrivacyExportRequestResponse,
  Error,
  PrivacyExportOnBehalfOfRequest
> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PrivacyExportOnBehalfOfRequest) =>
      requestExportOnBehalfOf(config.client, config.basePath!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'exports'),
      });
    },
  });
}
