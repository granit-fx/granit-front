import {
  cancelScheduledAction,
  fetchScheduledActionById,
  fetchScheduledActions,
  rescheduleScheduledAction,
} from '@granit/scheduling';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type { RescheduleActionRequest, ScheduledActionResponse } from '@granit/scheduling';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';

const DEFAULT_BASE_PATH = '/api/granit/scheduling';

/** Options accepted by all scheduling hooks. */
export interface SchedulingOptions {
  /** Axios instance used for all requests. */
  readonly client: AxiosInstance;
  /** Base URL for the scheduling API. Defaults to `/api/granit/scheduling`. */
  readonly basePath?: string;
}

/** Options for the list hook, extending base options with QueryEngine params. */
export interface SchedulingListOptions extends SchedulingOptions {
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
 * const { data } = useScheduledActions({ client: api, request: { page: 1, pageSize: 20 } });
 * // data.items, data.totalCount
 * ```
 */
export function useScheduledActions(
  options: SchedulingListOptions
): UseQueryResult<PagedResult<ScheduledActionResponse>> {
  const { client, basePath = DEFAULT_BASE_PATH, request, refetchInterval = 15_000 } = options;

  return useQuery({
    queryKey: schedulingKeys.list(request),
    queryFn: () => fetchScheduledActions(client, basePath, request),
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
 * const { data: action } = useScheduledAction('550e8400-...', { client: api });
 * ```
 */
export function useScheduledAction(
  id: string,
  options: SchedulingOptions & { readonly refetchInterval?: number | false }
): UseQueryResult<ScheduledActionResponse> {
  const { client, basePath = DEFAULT_BASE_PATH, refetchInterval = 15_000 } = options;

  return useQuery({
    queryKey: schedulingKeys.detail(id),
    queryFn: () => fetchScheduledActionById(client, basePath, id),
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
 * const { mutate: cancel } = useCancelScheduledAction({ client: api });
 * cancel('550e8400-...');
 * ```
 */
export function useCancelScheduledAction(
  options: SchedulingOptions
): UseMutationResult<void, Error, string> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await cancelScheduledAction(client, basePath, id);
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
 * const { mutate: reschedule } = useRescheduleScheduledAction({ client: api });
 * reschedule({ id: '550e8400-...', request: { newExecuteAt: '2026-04-10T09:00:00Z' } });
 * ```
 */
export function useRescheduleScheduledAction(
  options: SchedulingOptions
): UseMutationResult<ScheduledActionResponse, Error, RescheduleVariables> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, request }: RescheduleVariables) =>
      rescheduleScheduledAction(client, basePath, id, request),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: schedulingKeys.all });
      await queryClient.invalidateQueries({ queryKey: schedulingKeys.detail(id) });
    },
  });
}
