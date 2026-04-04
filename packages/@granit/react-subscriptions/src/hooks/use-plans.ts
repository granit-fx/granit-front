import {
  archivePlan,
  createPlan,
  createPriceVersion,
  getPlanById,
  getPlanPriceHistory,
  listPlans,
  publishPlan,
  updatePlan,
} from '@granit/subscriptions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildSubscriptionsQueryKey,
  useSubscriptionsConfig,
} from '../providers/subscriptions-provider.js';

import type {
  CreatePriceVersionRequest,
  PlanCreateRequest,
  PlanPriceResponse,
  PlanResponse,
  PlanUpdateRequest,
} from '@granit/subscriptions';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * List all plans.
 *
 * @example
 * ```tsx
 * const { data: plans } = usePlans();
 * ```
 */
export function usePlans(): UseQueryResult<readonly PlanResponse[]> {
  const config = useSubscriptionsConfig();
  const basePath = config.basePath ?? '/api/granit/subscriptions';

  return useQuery({
    queryKey: buildSubscriptionsQueryKey(config, 'plans'),
    queryFn: () => listPlans(config.client, basePath),
  });
}

/**
 * Get a single plan by its identifier.
 *
 * The query is automatically disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: plan } = usePlan(selectedPlanId);
 * ```
 */
export function usePlan(id: string): UseQueryResult<PlanResponse> {
  const config = useSubscriptionsConfig();
  const basePath = config.basePath ?? '/api/granit/subscriptions';

  return useQuery({
    queryKey: buildSubscriptionsQueryKey(config, 'plans', id),
    queryFn: () => getPlanById(config.client, basePath, id),
    enabled: id.length > 0,
  });
}

/** Variables for `useCreatePlan` mutation. */
export type CreatePlanVariables = PlanCreateRequest;

/**
 * Create a new plan.
 * Invalidates plan queries on success.
 *
 * @example
 * ```tsx
 * const create = useCreatePlan();
 * await create.mutateAsync({ name: 'Pro', ... });
 * ```
 */
export function useCreatePlan(): UseMutationResult<PlanResponse, Error, CreatePlanVariables> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? '/api/granit/subscriptions';

  return useMutation({
    mutationFn: (request: CreatePlanVariables) => createPlan(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'plans'),
      });
    },
  });
}

/** Variables for `useUpdatePlan` mutation. */
export type UpdatePlanVariables = {
  readonly id: string;
  readonly request: PlanUpdateRequest;
};

/**
 * Update an existing plan.
 * Invalidates plan queries on success.
 *
 * @example
 * ```tsx
 * const update = useUpdatePlan();
 * await update.mutateAsync({ id: 'plan-1', request: { name: 'Pro v2', ... } });
 * ```
 */
export function useUpdatePlan(): UseMutationResult<PlanResponse, Error, UpdatePlanVariables> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? '/api/granit/subscriptions';

  return useMutation({
    mutationFn: ({ id, request }: UpdatePlanVariables) =>
      updatePlan(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'plans'),
      });
    },
  });
}

/** Variables for `usePublishPlan` mutation. */
export type PublishPlanVariables = {
  readonly id: string;
};

/**
 * Publish a draft plan.
 * Invalidates plan queries on success.
 *
 * @example
 * ```tsx
 * const publish = usePublishPlan();
 * await publish.mutateAsync({ id: 'plan-1' });
 * ```
 */
export function usePublishPlan(): UseMutationResult<void, Error, PublishPlanVariables> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? '/api/granit/subscriptions';

  return useMutation({
    mutationFn: ({ id }: PublishPlanVariables) => publishPlan(config.client, basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'plans'),
      });
    },
  });
}

/** Variables for `useArchivePlan` mutation. */
export type ArchivePlanVariables = {
  readonly id: string;
};

/**
 * Archive a plan, preventing new subscriptions.
 * Invalidates plan queries on success.
 *
 * @example
 * ```tsx
 * const archive = useArchivePlan();
 * await archive.mutateAsync({ id: 'plan-1' });
 * ```
 */
export function useArchivePlan(): UseMutationResult<void, Error, ArchivePlanVariables> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? '/api/granit/subscriptions';

  return useMutation({
    mutationFn: ({ id }: ArchivePlanVariables) => archivePlan(config.client, basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'plans'),
      });
    },
  });
}

/** Variables for `useCreatePriceVersion` mutation. */
export type CreatePriceVersionVariables = {
  readonly planId: string;
  readonly request: CreatePriceVersionRequest;
};

/**
 * Create a new price version for a plan.
 * Invalidates plan queries on success.
 *
 * @example
 * ```tsx
 * const createPrice = useCreatePriceVersion();
 * await createPrice.mutateAsync({ planId: 'plan-1', request: { amount: 29.99, ... } });
 * ```
 */
export function useCreatePriceVersion(): UseMutationResult<
  PlanPriceResponse,
  Error,
  CreatePriceVersionVariables
> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? '/api/granit/subscriptions';

  return useMutation({
    mutationFn: ({ planId, request }: CreatePriceVersionVariables) =>
      createPriceVersion(config.client, basePath, planId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'plans'),
      });
    },
  });
}

/**
 * Get the full price history for a plan.
 *
 * The query is automatically disabled when `planId` is empty.
 *
 * @example
 * ```tsx
 * const { data: history } = usePlanPriceHistory(selectedPlanId);
 * ```
 */
export function usePlanPriceHistory(planId: string): UseQueryResult<readonly PlanPriceResponse[]> {
  const config = useSubscriptionsConfig();
  const basePath = config.basePath ?? '/api/granit/subscriptions';

  return useQuery({
    queryKey: buildSubscriptionsQueryKey(config, 'plans', planId, 'prices', 'history'),
    queryFn: () => getPlanPriceHistory(config.client, basePath, planId),
    enabled: planId.length > 0,
  });
}
