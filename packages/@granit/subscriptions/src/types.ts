import type { ISODateString } from '@granit/types';

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
  readonly trialEndsAt: ISODateString | null;
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
  readonly effectiveFrom: ISODateString;
  readonly isActive: boolean;
  readonly replacedByPriceId: string | null;
  readonly replacedAt: ISODateString | null;
}

export interface SubscriptionResponse {
  readonly id: string;
  readonly planId: string;
  readonly status: SubscriptionStatus;
  readonly currency: string;
  readonly currentPeriodStart: ISODateString;
  readonly currentPeriodEnd: ISODateString;
  readonly trialEndsAt: ISODateString | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly cancelledAt: ISODateString | null;
  readonly cancellationReason: string | null;
  readonly dunningAttempt: number;
  readonly seatCount: number;
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
