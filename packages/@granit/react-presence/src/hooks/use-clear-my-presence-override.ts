import { clearMyPresenceOverride } from '@granit/presence';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildPresenceQueryKey, usePresenceConfig } from '../providers/presence-provider';

import { presenceKeys } from './query-keys';

import type { PresenceResponse } from '@granit/presence';
import type { UseMutationResult } from '@tanstack/react-query';

/** Mutation that clears the current user's manual override. */
export function useClearMyPresenceOverride(): UseMutationResult<PresenceResponse, Error, void> {
  const config = usePresenceConfig();
  const queryClient = useQueryClient();
  const queryKey = buildPresenceQueryKey(config, ...presenceKeys.my());

  return useMutation({
    mutationFn: () => clearMyPresenceOverride(config.client, config.basePath),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}
