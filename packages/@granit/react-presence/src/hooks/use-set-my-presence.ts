import { setMyPresence } from '@granit/presence';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildPresenceQueryKey, usePresenceConfig } from '../providers/presence-provider';

import { presenceKeys } from './query-keys';

import type { PresenceResponse, SetPresenceRequest } from '@granit/presence';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Mutation that sets the current user's manual override.
 *
 * Performs an optimistic update on `useMyPresence`'s cache and rolls back
 * if the server returns an error (typically 400 ValidationProblem).
 */
export function useSetMyPresence(): UseMutationResult<
  PresenceResponse,
  Error,
  SetPresenceRequest,
  { previous: PresenceResponse | undefined }
> {
  const config = usePresenceConfig();
  const queryClient = useQueryClient();
  const queryKey = buildPresenceQueryKey(config, ...presenceKeys.my());

  return useMutation({
    mutationFn: (request: SetPresenceRequest) =>
      setMyPresence(config.client, config.basePath, request),
    onMutate: async (request) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PresenceResponse>(queryKey);
      if (previous) {
        const isAvailable = request.manualStatus === 'Available';
        const optimistic: PresenceResponse = {
          ...previous,
          manualOverride: isAvailable ? null : request.manualStatus,
          overrideUntilUtc: isAvailable ? null : request.untilUtc,
          effectiveStatus: (() => {
            if (isAvailable) return previous.effectiveStatus;
            if (request.manualStatus === 'AppearOffline') return 'Offline';
            return request.manualStatus;
          })(),
        };
        queryClient.setQueryData(queryKey, optimistic);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}
