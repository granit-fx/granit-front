import type { BillingInterval, PlanLifecycleStatus, PricingModel } from '@granit/subscriptions';

/**
 * Row shape returned by the `Granit.Subscriptions.PlanQuery`
 * QueryEngine endpoint. Thinner than `PlanResponse` — only the
 * columns projected by `PlanQueryDefinition` on the backend.
 */
export interface PlanQueryItem {
  readonly id: string;
  readonly name: string;
  readonly pricingModel: PricingModel;
  readonly defaultInterval: BillingInterval;
  readonly lifecycleStatus: PlanLifecycleStatus;
  readonly createdAt: string;
}

export type { PlanCreateRequest } from '@granit/subscriptions';
