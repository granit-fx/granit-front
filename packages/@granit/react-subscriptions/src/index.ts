// Provider
export {
  SubscriptionsProvider,
  buildSubscriptionsQueryKey,
  useSubscriptionsConfig,
} from './providers/subscriptions-provider.js';
export type {
  ResolvedSubscriptionsConfig,
  SubscriptionsConfig,
  SubscriptionsProviderProps,
} from './providers/subscriptions-provider.js';

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
} from './hooks/use-plans.js';
export type {
  ArchivePlanVariables,
  CreatePlanVariables,
  CreatePriceVersionVariables,
  PublishPlanVariables,
  UpdatePlanVariables,
} from './hooks/use-plans.js';

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
} from './hooks/use-subscriptions.js';
export type {
  BulkMigrateSubscriptionPriceVariables,
  CancelSubscriptionVariables,
  ChangeSubscriptionPlanVariables,
  CreateSubscriptionVariables,
  MigrateSubscriptionPriceVariables,
} from './hooks/use-subscriptions.js';

// Hooks — Seats
export { useAssignSeat, useRevokeSeat, useSeats } from './hooks/use-seats.js';
export type { AssignSeatVariables, RevokeSeatVariables } from './hooks/use-seats.js';
