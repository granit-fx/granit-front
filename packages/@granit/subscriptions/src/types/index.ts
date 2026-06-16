import type { EntityId, ISODateString } from '@granit/types';

/** Branded identifier for a plan. */
export type PlanId = EntityId<'Plan'>;

/** Branded identifier for a plan price version. */
export type PlanPriceId = EntityId<'PlanPrice'>;

/** Branded identifier for a subscription. */
export type SubscriptionId = EntityId<'Subscription'>;

export type PricingModel = 'Flat' | 'PerSeat' | 'PerUnit' | 'Tiered';
export type BillingInterval = 'Monthly' | 'Quarterly' | 'Yearly';
export type PlanLifecycleStatus = 'Draft' | 'PendingReview' | 'Published' | 'Archived';
export type SubscriptionStatus =
  | 'Trial'
  | 'Active'
  | 'PastDue'
  | 'Suspended'
  | 'Cancelled'
  | 'Expired';

export interface PlanCreateRequest {
  readonly name: string;
  readonly description: string | null;
  readonly pricingModel: PricingModel;
  readonly defaultInterval: BillingInterval;
  readonly trialDays?: number | null;
  readonly seatLimit?: number | null;
}

export interface PlanUpdateRequest {
  readonly name: string;
  readonly description: string | null;
  readonly sortOrder: number;
}

export interface CreatePriceVersionRequest {
  readonly amount: number;
  readonly currency: string;
  readonly interval: string;
  readonly productId?: string | null;
}

export interface SubscriptionCreateRequest {
  readonly partyId: string;
  readonly planId: string;
  readonly currency: string;
  readonly trialEndsAt: ISODateString | null;
}

export interface SubscriptionCancelRequest {
  readonly reason?: string | null;
  readonly atPeriodEnd?: boolean;
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
  readonly effectiveFrom: ISODateString;
  readonly isCurrent: boolean;
  readonly replacedByPriceId: string | null;
  readonly replacedAt: ISODateString | null;
  readonly productId?: string | null;
}

export interface SubscriptionResponse {
  readonly id: string;
  readonly partyId: string;
  readonly planId: string;
  readonly status: SubscriptionStatus;
  readonly currency: string;
  readonly currentPeriodStart: ISODateString;
  readonly currentPeriodEnd: ISODateString;
  readonly trialEndsAt: ISODateString | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly cancelledAt: ISODateString | null;
  readonly cancellationReason: string | null;
  readonly seatCount: number;
  /** UTC instant the subscription was created (ISO 8601). Always present. */
  readonly createdAt: ISODateString;
  /** Last-modification timestamp; `null` until first modified (coalesce `?? createdAt`). */
  readonly modifiedAt: ISODateString | null;
  readonly planPriceId: string | null;
}

export interface SeatResponse {
  readonly id: string;
  readonly userId: string;
  readonly assignedAt: ISODateString;
}

export interface BulkMigratePriceResponse {
  readonly migratedCount: number;
}
