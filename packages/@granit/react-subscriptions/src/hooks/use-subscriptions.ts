import {
  bulkMigrateSubscriptionPrice,
  cancelSubscription,
  changeSubscriptionPlan,
  createSubscription,
  getActiveSubscription,
  getSubscriptionById,
  listSubscriptions,
  migrateSubscriptionPrice,
} from '@granit/subscriptions';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildSubscriptionsQueryKey,
  useSubscriptionsConfig,
} from '../providers/subscriptions-provider';

import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type {
  BulkMigratePriceRequest,
  BulkMigratePriceResponse,
  MigratePriceRequest,
  SubscriptionCancelRequest,
  SubscriptionChangePlanRequest,
  SubscriptionCreateRequest,
  SubscriptionResponse,
} from '@granit/subscriptions';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * List subscriptions (paginated).
 *
 * Returns a {@link PagedResult} with `items` and `totalCount` — matches the
 * backend `PagedResult<SubscriptionResponse>` shape.
 *
 * @example
 * ```tsx
 * const { data } = useSubscriptions();
 * const { items, totalCount } = data ?? { items: [], totalCount: 0 };
 * ```
 */
export function useSubscriptions(
  params?: QueryRequest
): UseQueryResult<PagedResult<SubscriptionResponse>> {
  const config = useSubscriptionsConfig();
  const basePath = config.basePath;

  return useQuery({
    queryKey: buildSubscriptionsQueryKey(config, 'subscriptions', JSON.stringify(params ?? {})),
    queryFn: () => listSubscriptions(config.client, basePath, params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Get the currently active subscription.
 *
 * @example
 * ```tsx
 * const { data: active } = useActiveSubscription();
 * ```
 */
export function useActiveSubscription(): UseQueryResult<SubscriptionResponse> {
  const config = useSubscriptionsConfig();
  const basePath = config.basePath;

  return useQuery({
    queryKey: buildSubscriptionsQueryKey(config, 'subscriptions', 'active'),
    queryFn: () => getActiveSubscription(config.client, basePath),
  });
}

/**
 * Get a subscription by its identifier.
 *
 * The query is automatically disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: subscription } = useSubscription(selectedId);
 * ```
 */
export function useSubscription(id: string): UseQueryResult<SubscriptionResponse> {
  const config = useSubscriptionsConfig();
  const basePath = config.basePath;

  return useQuery({
    queryKey: buildSubscriptionsQueryKey(config, 'subscriptions', id),
    queryFn: () => getSubscriptionById(config.client, basePath, id),
    enabled: id.length > 0,
  });
}

/** Variables for `useCreateSubscription` mutation. */
export type CreateSubscriptionVariables = SubscriptionCreateRequest;

/**
 * Create a new subscription.
 * Invalidates subscription queries on success.
 *
 * @example
 * ```tsx
 * const create = useCreateSubscription();
 * await create.mutateAsync({ planId: 'plan-1', currency: 'EUR', trialEndsAt: null });
 * ```
 */
export function useCreateSubscription(): UseMutationResult<
  SubscriptionResponse,
  Error,
  CreateSubscriptionVariables
> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath;

  return useMutation({
    mutationFn: (request: CreateSubscriptionVariables) =>
      createSubscription(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'subscriptions'),
      });
    },
  });
}

/** Variables for `useCancelSubscription` mutation. */
export type CancelSubscriptionVariables = {
  readonly id: string;
  readonly request: SubscriptionCancelRequest;
};

/**
 * Cancel a subscription.
 * Invalidates subscription queries on success.
 *
 * @example
 * ```tsx
 * const cancel = useCancelSubscription();
 * await cancel.mutateAsync({ id: 'sub-1', request: { reason: null, atPeriodEnd: true } });
 * ```
 */
export function useCancelSubscription(): UseMutationResult<
  SubscriptionResponse,
  Error,
  CancelSubscriptionVariables
> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath;

  return useMutation({
    mutationFn: ({ id, request }: CancelSubscriptionVariables) =>
      cancelSubscription(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'subscriptions'),
      });
    },
  });
}

/** Variables for `useChangeSubscriptionPlan` mutation. */
export type ChangeSubscriptionPlanVariables = {
  readonly id: string;
  readonly request: SubscriptionChangePlanRequest;
};

/**
 * Change the plan of an existing subscription.
 * Invalidates subscription queries on success.
 *
 * @example
 * ```tsx
 * const changePlan = useChangeSubscriptionPlan();
 * await changePlan.mutateAsync({ id: 'sub-1', request: { newPlanId: 'plan-2' } });
 * ```
 */
export function useChangeSubscriptionPlan(): UseMutationResult<
  SubscriptionResponse,
  Error,
  ChangeSubscriptionPlanVariables
> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath;

  return useMutation({
    mutationFn: ({ id, request }: ChangeSubscriptionPlanVariables) =>
      changeSubscriptionPlan(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'subscriptions'),
      });
    },
  });
}

/** Variables for `useMigrateSubscriptionPrice` mutation. */
export type MigrateSubscriptionPriceVariables = {
  readonly id: string;
  readonly request: MigratePriceRequest;
};

/**
 * Migrate a subscription to a new price version.
 * Invalidates subscription queries on success.
 *
 * @example
 * ```tsx
 * const migrate = useMigrateSubscriptionPrice();
 * await migrate.mutateAsync({ id: 'sub-1', request: { newPlanPriceId: 'price-2' } });
 * ```
 */
export function useMigrateSubscriptionPrice(): UseMutationResult<
  SubscriptionResponse,
  Error,
  MigrateSubscriptionPriceVariables
> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath;

  return useMutation({
    mutationFn: ({ id, request }: MigrateSubscriptionPriceVariables) =>
      migrateSubscriptionPrice(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'subscriptions'),
      });
    },
  });
}

/** Variables for `useBulkMigrateSubscriptionPrice` mutation. */
export type BulkMigrateSubscriptionPriceVariables = BulkMigratePriceRequest;

/**
 * Bulk-migrate subscriptions to a new price version.
 * Invalidates subscription queries on success.
 *
 * @example
 * ```tsx
 * const bulkMigrate = useBulkMigrateSubscriptionPrice();
 * await bulkMigrate.mutateAsync({ planId: 'plan-1', newPlanPriceId: 'price-2', oldPlanPriceId: null });
 * ```
 */
export function useBulkMigrateSubscriptionPrice(): UseMutationResult<
  BulkMigratePriceResponse,
  Error,
  BulkMigrateSubscriptionPriceVariables
> {
  const config = useSubscriptionsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath;

  return useMutation({
    mutationFn: (request: BulkMigrateSubscriptionPriceVariables) =>
      bulkMigrateSubscriptionPrice(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSubscriptionsQueryKey(config, 'subscriptions'),
      });
    },
  });
}
