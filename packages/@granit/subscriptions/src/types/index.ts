import type { EntityId } from '@granit/types';

/** Branded identifier for a plan. */
export type PlanId = EntityId<'Plan'>;

/** Branded identifier for a plan price version. */
export type PlanPriceId = EntityId<'PlanPrice'>;

/** Branded identifier for a subscription. */
export type SubscriptionId = EntityId<'Subscription'>;

export type PricingModel = 'Flat' | 'PerSeat' | 'Tiered' | 'UsageBased';
export type BillingInterval = 'Monthly' | 'Quarterly' | 'SemiAnnual' | 'Annual';
export type PlanLifecycleStatus = 'Draft' | 'Published' | 'Archived';
export type SubscriptionStatus = 'Active' | 'Trial' | 'PastDue' | 'Canceled' | 'Expired';

export interface PlanCreateRequest {
  readonly name: string;
  readonly description: string | null;
  readonly pricingModel: PricingModel;
  readonly defaultInterval: BillingInterval;
  readonly trialDays: number | null;
  readonly seatLimit: number | null;
}

export interface PlanUpdateRequest {
  readonly name: string;
  readonly description: string | null;
  readonly sortOrder: number;
}

export interface CreatePriceVersionRequest {
  readonly amount: number;
  readonly currency: string;
  readonly interval: BillingInterval;
}

export interface SubscriptionCreateRequest {
  readonly planId: string;
  readonly currency: string;
  readonly trialEndsAt: string | null;
}

export interface SubscriptionCancelRequest {
  readonly reason: string | null;
  readonly atPeriodEnd: boolean;
}

export interface SubscriptionChangePlanRequest {
  readonly newPlanId: string;
}

export interface MigratePriceRequest {
  readonly newPlanPriceId: string;
}

export interface BulkMigratePriceRequest {
  readonly planId: string;
  readonly newPlanPriceId: string;
  readonly oldPlanPriceId: string | null;
}

export interface SeatAssignRequest {
  readonly userId: string;
}

export interface PlanResponse {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly pricingModel: string;
  readonly defaultInterval: string;
  readonly trialDays: number | null;
  readonly seatLimit: number | null;
  readonly sortOrder: number;
  readonly lifecycleStatus: PlanLifecycleStatus;
  readonly prices: readonly PlanPriceResponse[];
}

export interface PlanPriceResponse {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly interval: string;
  readonly effectiveFrom: string;
  readonly isCurrent: boolean;
  readonly replacedByPriceId: string | null;
  readonly replacedAt: string | null;
}

export interface SubscriptionResponse {
  readonly id: string;
  readonly planId: string;
  readonly status: SubscriptionStatus;
  readonly currency: string;
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly trialEndsAt: string | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly cancelledAt: string | null;
  readonly cancellationReason: string | null;
  readonly dunningAttempt: number;
  readonly seatCount: number;
  readonly planPriceId: string | null;
}

export interface SeatResponse {
  readonly id: string;
  readonly userId: string;
  readonly assignedAt: string;
}

export interface BulkMigratePriceResponse {
  readonly migratedCount: number;
}
