import { getOptOutStatus, requestOptOut } from '@granit/privacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPrivacyQueryKey, usePrivacyConfig } from '../providers/privacy-provider';

import type { PrivacyOptOutStatusResponse } from '@granit/privacy';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Returns the current opt-out status for the requesting user or visitor. */
export function useOptOutStatus(): UseQueryResult<PrivacyOptOutStatusResponse> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'opt-out'),
    queryFn: () => getOptOutStatus(config.client, config.basePath!),
  });
}

/** Opts out of data sale/sharing (CCPA — Do Not Sell or Share). */
export function useRequestOptOut(): UseMutationResult<PrivacyOptOutStatusResponse, Error, void> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requestOptOut(config.client, config.basePath!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'opt-out'),
      });
    },
  });
}
