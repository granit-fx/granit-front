import type { CurrencyCode, EntityId, ISODateString, UserId } from '@granit/types';

export type PlanId = EntityId<'Plan'>;
export type PlanPriceId = EntityId<'PlanPrice'>;
export type SubscriptionId = EntityId<'Subscription'>;
export type SeatId = EntityId<'Seat'>;

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
  readonly currency: CurrencyCode;
  readonly interval: BillingInterval;
}

export interface SubscriptionCreateRequest {
  readonly planId: PlanId;
  readonly currency: CurrencyCode;
  readonly trialEndsAt: ISODateString | null;
}

export interface SubscriptionCancelRequest {
  readonly reason: string | null;
  readonly atPeriodEnd: boolean;
}

export interface SubscriptionChangePlanRequest {
  readonly newPlanId: PlanId;
}

export interface MigratePriceRequest {
  readonly newPlanPriceId: PlanPriceId;
}

export interface BulkMigratePriceRequest {
  readonly planId: PlanId;
  readonly newPlanPriceId: PlanPriceId;
  readonly oldPlanPriceId: PlanPriceId | null;
}

export interface SeatAssignRequest {
  readonly userId: UserId;
}

export interface PlanResponse {
  readonly id: PlanId;
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
  readonly id: PlanPriceId;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly interval: string;
  readonly effectiveFrom: ISODateString;
  readonly isActive: boolean;
  readonly replacedByPriceId: PlanPriceId | null;
  readonly replacedAt: ISODateString | null;
}

export interface SubscriptionResponse {
  readonly id: SubscriptionId;
  readonly planId: PlanId;
  readonly status: SubscriptionStatus;
  readonly currency: CurrencyCode;
  readonly currentPeriodStart: ISODateString;
  readonly currentPeriodEnd: ISODateString;
  readonly trialEndsAt: ISODateString | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly cancelledAt: ISODateString | null;
  readonly cancellationReason: string | null;
  readonly dunningAttempt: number;
  readonly seatCount: number;
  readonly planPriceId: PlanPriceId | null;
}

export interface SeatResponse {
  readonly id: SeatId;
  readonly userId: UserId;
  readonly assignedAt: ISODateString;
}

export interface BulkMigratePriceResponse {
  readonly migratedCount: number;
}
