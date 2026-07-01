import type { BillingInterval, PlanLifecycleStatus, PricingModel } from '@granit/subscriptions';
import type { ISODateString } from '@granit/types';

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
  readonly createdAt: ISODateString;
}

export type { PlanCreateRequest } from '@granit/subscriptions';
