// Provider
export {
  SubscriptionsProvider,
  buildSubscriptionsQueryKey,
  useSubscriptionsConfig,
} from './providers/subscriptions-provider';
export type {
  ResolvedSubscriptionsConfig,
  SubscriptionsConfig,
  SubscriptionsProviderProps,
} from './providers/subscriptions-provider';

// Hooks — Plans
export {
  useArchivePlan,
  useCreatePlan,
  useCreatePriceVersion,
  usePlan,
  usePlanPriceHistory,
  usePlans,
  usePublishPlan,
  useUpdatePlan,
} from './hooks/use-plans';
export type {
  ArchivePlanVariables,
  CreatePlanVariables,
  CreatePriceVersionVariables,
  PublishPlanVariables,
  UpdatePlanVariables,
} from './hooks/use-plans';

// Hooks — Subscriptions
export {
  useActiveSubscription,
  useBulkMigrateSubscriptionPrice,
  useCancelSubscription,
  useChangeSubscriptionPlan,
  useCreateSubscription,
  useMigrateSubscriptionPrice,
  useSubscription,
  useSubscriptions,
} from './hooks/use-subscriptions';
export type {
  BulkMigrateSubscriptionPriceVariables,
  CancelSubscriptionVariables,
  ChangeSubscriptionPlanVariables,
  CreateSubscriptionVariables,
  MigrateSubscriptionPriceVariables,
} from './hooks/use-subscriptions';

// Hooks — Seats
export { useAssignSeat, useRevokeSeat, useSeats } from './hooks/use-seats';
export type { AssignSeatVariables, RevokeSeatVariables } from './hooks/use-seats';
