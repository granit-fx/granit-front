// Types
export type {
  BillingInterval,
  BulkMigratePriceRequest,
  BulkMigratePriceResponse,
  CreatePriceVersionRequest,
  MigratePriceRequest,
  PlanCreateRequest,
  PlanId,
  PlanLifecycleStatus,
  PlanPriceId,
  PlanPriceResponse,
  PlanResponse,
  PlanUpdateRequest,
  PricingModel,
  SeatAssignRequest,
  SeatResponse,
  SubscriptionCancelRequest,
  SubscriptionChangePlanRequest,
  SubscriptionCreateRequest,
  SubscriptionId,
  SubscriptionResponse,
  SubscriptionStatus,
} from './types/index';

// Permissions
export { SubscriptionsPermissions } from './permissions';

// Validation constraints (generated from contracts/openapi/subscriptions.json)
export { subscriptionsConstraints } from './constraints';

// API — Plans
export {
  archivePlan,
  createPlan,
  createPriceVersion,
  getPlanById,
  getPlanPriceHistory,
  listActivePlans,
  publishPlan,
  updatePlan,
} from './api/subscriptions-api';

// API — Subscriptions
export {
  bulkMigrateSubscriptionPrice,
  cancelSubscription,
  changeSubscriptionPlan,
  createSubscription,
  getActiveSubscription,
  getSubscriptionById,
  listSubscriptions,
  migrateSubscriptionPrice,
} from './api/subscriptions-api';

// API — Seats
export { assignSeat, listSeats, revokeSeat } from './api/subscriptions-api';
