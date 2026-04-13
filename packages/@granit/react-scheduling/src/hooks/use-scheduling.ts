import {
  cancelScheduledAction,
  fetchScheduledActionById,
  fetchScheduledActions,
  rescheduleScheduledAction,
} from '@granit/scheduling';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSchedulingConfig } from '../providers/scheduling-provider.js';

import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type { RescheduleActionRequest, ScheduledActionResponse } from '@granit/scheduling';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Options for the list hook (query parameters and polling interval). */
export interface SchedulingListOptions {
  /** QueryEngine request parameters (pagination, filters, sort, etc.). */
  readonly request?: QueryRequest;
  /** Auto-refetch interval in milliseconds. Defaults to `15_000` (15 s). Set to `false` to disable. */
  readonly refetchInterval?: number | false;
}

/** Mutation variables for rescheduling an action. */
export interface RescheduleVariables {
  readonly id: string;
  readonly request: RescheduleActionRequest;
}

/** Query key factory for scheduling queries. */
export const schedulingKeys = {
  all: ['scheduling', 'actions'] as const,
  list: (request?: QueryRequest) => [...schedulingKeys.all, 'list', request ?? {}] as const,
  detail: (id: string) => [...schedulingKeys.all, 'detail', id] as const,
};

/**
 * Query hook that fetches a paginated list of scheduled actions via QueryEngine.
 *
 * Polls every 15 seconds by default to reflect live scheduler state.
 *
 * @example
 * ```tsx
 * const { data } = useScheduledActions({ request: { page: 1, pageSize: 20 } });
 * // data.items, data.totalCount
 * ```
 */
export function useScheduledActions(
  options?: SchedulingListOptions
): UseQueryResult<PagedResult<ScheduledActionResponse>> {
  const config = useSchedulingConfig();
  const actionsPath = `${config.basePath}/scheduled-actions`;
  const { request, refetchInterval = 15_000 } = options ?? {};

  return useQuery({
    queryKey: schedulingKeys.list(request),
    queryFn: () => fetchScheduledActions(config.client, actionsPath, request),
    refetchInterval,
  });
}

/**
 * Query hook that fetches a single scheduled action by ID.
 *
 * Polls every 15 seconds by default. The query is disabled when the ID is empty.
 *
 * @example
 * ```tsx
 * const { data: action } = useScheduledAction('550e8400-...');
 * ```
 */
export function useScheduledAction(
  id: string,
  options?: { readonly refetchInterval?: number | false }
): UseQueryResult<ScheduledActionResponse> {
  const config = useSchedulingConfig();
  const actionsPath = `${config.basePath}/scheduled-actions`;
  const { refetchInterval = 15_000 } = options ?? {};

  return useQuery({
    queryKey: schedulingKeys.detail(id),
    queryFn: () => fetchScheduledActionById(config.client, actionsPath, id),
    refetchInterval,
    enabled: id.length > 0,
  });
}

/**
 * Mutation hook to cancel a pending scheduled action.
 *
 * Sends `DELETE {basePath}/{id}` and invalidates the actions list on success.
 *
 * @example
 * ```tsx
 * const { mutate: cancel } = useCancelScheduledAction();
 * cancel('550e8400-...');
 * ```
 */
export function useCancelScheduledAction(): UseMutationResult<void, Error, string> {
  const config = useSchedulingConfig();
  const actionsPath = `${config.basePath}/scheduled-actions`;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await cancelScheduledAction(config.client, actionsPath, id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: schedulingKeys.all });
    },
  });
}

/**
 * Mutation hook to reschedule a pending action to a new execution time.
 *
 * Sends `PUT {basePath}/{id}/reschedule` and invalidates both the list and the
 * specific action detail on success.
 *
 * @example
 * ```tsx
 * const { mutate: reschedule } = useRescheduleScheduledAction();
 * reschedule({ id: '550e8400-...', request: { newExecuteAt: '2026-04-10T09:00:00Z' } });
 * ```
 */
export function useRescheduleScheduledAction(): UseMutationResult<ScheduledActionResponse, Error, RescheduleVariables> {
  const config = useSchedulingConfig();
  const actionsPath = `${config.basePath}/scheduled-actions`;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, request }: RescheduleVariables) =>
      rescheduleScheduledAction(config.client, actionsPath, id, request),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: schedulingKeys.all });
      await queryClient.invalidateQueries({ queryKey: schedulingKeys.detail(id) });
    },
  });
}
