import {
  cancelActivity,
  completeActivity,
  createActivity,
  reassignActivity,
  rescheduleActivity,
} from '@granit/activities';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildActivitiesQueryKey, useActivitiesConfig } from '../providers/activities-provider';

import type { ResolvedActivitiesConfig } from '../providers/activities-provider';
import type {
  ActivityResponse,
  CancelActivityRequest,
  CompleteActivityRequest,
  CreateActivityRequest,
  ReassignActivityRequest,
  RescheduleActivityRequest,
} from '@granit/activities';
import type { QueryClient, UseMutationResult } from '@tanstack/react-query';

interface ActivityIdMutationArgs<TRequest> {
  readonly id: string;
  readonly request: TRequest;
}

/**
 * Invalidate the cache layers impacted by a write on a single activity:
 * - all `list` queries (any filter combination)
 * - all `calendar` queries (any time window)
 * - the `detail` query for the impacted activity (when known)
 */
function invalidateActivity(
  queryClient: QueryClient,
  config: ResolvedActivitiesConfig,
  id: string | null
): void {
  queryClient.invalidateQueries({ queryKey: buildActivitiesQueryKey(config, 'list') });
  queryClient.invalidateQueries({ queryKey: buildActivitiesQueryKey(config, 'calendar') });
  if (id !== null) {
    queryClient.invalidateQueries({ queryKey: buildActivitiesQueryKey(config, 'detail', id) });
  }
}

/**
 * Create a new activity. Invalidates list + calendar queries on success
 * (no detail key yet — id is server-assigned).
 *
 * @example
 * ```tsx
 * const create = useCreateActivity();
 * await create.mutateAsync({ entityType: 'Quote', entityId, type: 'FollowUp', ... });
 * ```
 */
export function useCreateActivity(): UseMutationResult<
  ActivityResponse,
  Error,
  CreateActivityRequest
> {
  const config = useActivitiesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateActivityRequest) =>
      createActivity(config.client, config.basePath, request),
    onSuccess: () => {
      invalidateActivity(queryClient, config, null);
    },
  });
}

/**
 * Mark an activity as completed. Invalidates list + calendar + detail(id).
 *
 * @example
 * ```tsx
 * const complete = useCompleteActivity();
 * await complete.mutateAsync({ id: 'act-1', request: {} });
 * ```
 */
export function useCompleteActivity(): UseMutationResult<
  ActivityResponse,
  Error,
  ActivityIdMutationArgs<CompleteActivityRequest>
> {
  const config = useActivitiesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: ActivityIdMutationArgs<CompleteActivityRequest>) =>
      completeActivity(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => {
      invalidateActivity(queryClient, config, id);
    },
  });
}

/**
 * Cancel an activity. Invalidates list + calendar + detail(id).
 *
 * @example
 * ```tsx
 * const cancel = useCancelActivity();
 * await cancel.mutateAsync({ id: 'act-1', request: {} });
 * ```
 */
export function useCancelActivity(): UseMutationResult<
  ActivityResponse,
  Error,
  ActivityIdMutationArgs<CancelActivityRequest>
> {
  const config = useActivitiesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: ActivityIdMutationArgs<CancelActivityRequest>) =>
      cancelActivity(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => {
      invalidateActivity(queryClient, config, id);
    },
  });
}

/**
 * Reassign an activity to another user. Invalidates list + calendar + detail(id).
 *
 * @example
 * ```tsx
 * const reassign = useReassignActivity();
 * await reassign.mutateAsync({ id: 'act-1', request: { newAssigneeUserId: 'user-3' } });
 * ```
 */
export function useReassignActivity(): UseMutationResult<
  ActivityResponse,
  Error,
  ActivityIdMutationArgs<ReassignActivityRequest>
> {
  const config = useActivitiesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: ActivityIdMutationArgs<ReassignActivityRequest>) =>
      reassignActivity(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => {
      invalidateActivity(queryClient, config, id);
    },
  });
}

/**
 * Reschedule an activity (update its due date). Invalidates list + calendar + detail(id).
 *
 * @example
 * ```tsx
 * const reschedule = useRescheduleActivity();
 * await reschedule.mutateAsync({ id: 'act-1', request: { newDueAt: '...' } });
 * ```
 */
export function useRescheduleActivity(): UseMutationResult<
  ActivityResponse,
  Error,
  ActivityIdMutationArgs<RescheduleActivityRequest>
> {
  const config = useActivitiesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: ActivityIdMutationArgs<RescheduleActivityRequest>) =>
      rescheduleActivity(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => {
      invalidateActivity(queryClient, config, id);
    },
  });
}
