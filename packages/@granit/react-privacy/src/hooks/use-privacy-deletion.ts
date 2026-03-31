import { cancelDeletion, getDeletionStatus, listDeletions, requestDeletion } from '@granit/privacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPrivacyQueryKey, usePrivacyConfig } from '../providers/privacy-provider.js';

import type { PrivacyDeletionRequest, PrivacyDeletionResponse } from '@granit/privacy';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Request deletion of all personal data (GDPR Art. 17). */
export function useRequestDeletion(): UseMutationResult<
  PrivacyDeletionResponse,
  Error,
  PrivacyDeletionRequest
> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PrivacyDeletionRequest) =>
      requestDeletion(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'deletion'),
      });
    },
  });
}

/** List all deletion requests for the current user. */
export function useDeletionRequests(): UseQueryResult<PrivacyDeletionResponse[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'deletion'),
    queryFn: () => listDeletions(config.client, config.basePath!),
  });
}

/** Get the status of a specific deletion request. */
export function useDeletionStatus(requestId: string): UseQueryResult<PrivacyDeletionResponse> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'deletion', requestId),
    queryFn: () => getDeletionStatus(config.client, config.basePath!, requestId),
    enabled: requestId.length > 0,
  });
}

/** Cancel a deferred deletion request during the cooling-off period. */
export function useCancelDeletion(): UseMutationResult<void, Error, string> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => cancelDeletion(config.client, config.basePath!, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'deletion'),
      });
    },
  });
}
