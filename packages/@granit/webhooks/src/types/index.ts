import type { EntityId, TenantId } from '@granit/types';

// ---------------------------------------------------------------------------
// Webhook types — mirrors Granit.Webhooks .NET contract
// ---------------------------------------------------------------------------

/** Branded webhook subscription identifier. */
export type WebhookSubscriptionId = EntityId<'WebhookSubscription'>;

/** Branded webhook delivery identifier. */
export type WebhookDeliveryId = EntityId<'WebhookDelivery'>;

/**
 * Webhook subscription lifecycle status.
 *
 * Mirrors `Granit.Webhooks.Domain.WebhookSubscriptionStatus` (.NET).
 */
export const WebhookSubscriptionStatus = {
  Active: 0,
  Suspended: 1,
  Deactivated: 2,
} as const;

export type WebhookSubscriptionStatusValue =
  (typeof WebhookSubscriptionStatus)[keyof typeof WebhookSubscriptionStatus];

// ── Subscription requests ───────────────────────────────────────────────────

/** Request body for `POST /subscriptions`. */
export interface WebhookSubscriptionCreateRequest {
  readonly targetUrl: string;
  readonly eventType: string;
}

/** Request body for `PUT /subscriptions/{id}`. */
export interface WebhookSubscriptionUpdateRequest {
  readonly targetUrl: string;
}

/** Request body for `POST /subscriptions/{id}/deactivate`. */
export interface WebhookSubscriptionDeactivateRequest {
  readonly reason: string;
}

// ── Subscription responses ──────────────────────────────────────────────────

/** Subscription descriptor returned by most endpoints. */
export interface WebhookSubscriptionResponse {
  readonly id: WebhookSubscriptionId;
  readonly targetUrl: string;
  readonly eventType: string;
  readonly status: WebhookSubscriptionStatusValue;
  readonly consecutiveFailureCount: number;
  readonly lastSuccessAt: string | null;
  readonly createdAt: string;
  readonly modifiedAt: string | null;
}

/** Response from `POST /subscriptions` (201 Created). Contains the signing secret (shown once). */
export interface WebhookSubscriptionCreatedResponse {
  readonly id: WebhookSubscriptionId;
  readonly targetUrl: string;
  readonly eventType: string;
  readonly status: WebhookSubscriptionStatusValue;
  readonly signingSecret: string;
}

/** Response from `POST /subscriptions/{id}/rotate-secret`. */
export interface WebhookSubscriptionRotateSecretResponse {
  readonly signingSecret: string;
}

/** Response from `POST /subscriptions/{id}/test-ping`. */
export interface WebhookSubscriptionTestPingResponse {
  readonly success: boolean;
  readonly httpStatusCode: number;
  readonly durationMs: number;
}

/** Response from `GET /stats`. */
export interface WebhookSubscriptionStatsResponse {
  readonly totalSubscriptions: number;
  readonly activeCount: number;
  readonly suspendedCount: number;
  readonly deactivatedCount: number;
  readonly deliveriesLast24h: number;
  readonly successRateLast24h: number;
  readonly avgResponseTimeMsLast24h: number;
}

// ── Event type discovery ──────────────────────────────────────────────────

/** Registered webhook event type descriptor. Sorted by category, then eventType. */
export interface WebhookEventTypeResponse {
  readonly eventType: string;
  readonly displayName: string | null;
  readonly description: string | null;
  readonly category: string | null;
}

// ── Module configuration ──────────────────────────────────────────────────

/** Response from `GET /config`. */
export interface WebhookModuleConfig {
  readonly storePayload: boolean;
}

// ── Delivery audit trail ────────────────────────────────────────────────────

/** Immutable delivery attempt record (ISO 27001 audit trail). */
export interface WebhookDeliveryAttemptResponse {
  readonly deliveryId: WebhookDeliveryId;
  readonly subscriptionId: WebhookSubscriptionId;
  readonly tenantId: TenantId | null;
  readonly eventType: string;
  readonly targetUrl: string;
  readonly httpStatusCode: number | null;
  readonly payloadHash: string;
  readonly occurredAt: string;
  readonly durationMs: number;
  readonly errorMessage: string | null;
  readonly isSuccess: boolean;
  /** Serialized JSON body. `null` when `WebhooksOptions.StorePayload` is `false` (default). */
  readonly payload: string | null;
}
