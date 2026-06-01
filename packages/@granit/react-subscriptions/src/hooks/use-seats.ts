import { assignSeat, listSeats, revokeSeat } from '@granit/subscriptions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildSubscriptionsQueryKey,
  useSubscriptionsConfig,
} from '../providers/subscriptions-provider';

import type { SeatAssignRequest, SeatResponse } from '@granit/subscriptions';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * List all seats for a subscription.
 *
 * The query is automatically disabled when `subscriptionId` is empty.
 *
 * @example
 * ```tsx
 * const { data: seats } = useSeats(subscriptionId);
 * ```
 */
export function useSeats(subscriptionId: string): UseQueryResult<readonly SeatResponse[]> {
  const config = useSubscriptionsConfig();
  const basePath = config.basePath;

  return useQuery({
    queryKey: buildSubscriptionsQueryKey(config, 'subscriptions', subscriptionId, 'seats'),
    queryFn: () => listSeats(config.client, basePath, subscriptionId),
    enabled: subscriptionId.length > 0,
  });
}

/** Variables for `useAssignSeat` mutation. */
export type AssignSeatVariables = SeatAssignRequest;

/**
 * Assign a seat to a user within a subscription.
 * Invalidates seat queries for the given subscription on success.
 *
 * @example
 * ```tsx
 * const assign = useAssignSeat('sub-1');
 * await assign.mutateAsync({ userId: 'user-1' });
 * ```
 */
export function useAssignSeat(
  subscriptionId: string
): UseMutationResult<SeatResponse, Error, AssignSeatVariables> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath;

  return useMutation({
    mutationFn: (request: AssignSeatVariables) =>
      assignSeat(config.client, basePath, subscriptionId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'subscriptions', subscriptionId, 'seats'),
      });
    },
  });
}

/** Variables for `useRevokeSeat` mutation. */
export type RevokeSeatVariables = {
  readonly userId: string;
};

/**
 * Revoke a seat from a user within a subscription.
 * Invalidates seat queries for the given subscription on success.
 *
 * @example
 * ```tsx
 * const revoke = useRevokeSeat('sub-1');
 * await revoke.mutateAsync({ userId: 'user-1' });
 * ```
 */
export function useRevokeSeat(
  subscriptionId: string
): UseMutationResult<void, Error, RevokeSeatVariables> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath;

  return useMutation({
    mutationFn: ({ userId }: RevokeSeatVariables) =>
      revokeSeat(config.client, basePath, subscriptionId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'subscriptions', subscriptionId, 'seats'),
      });
    },
  });
}
