import type { EntityId, ISODateString, TenantId } from '@granit/types';

// ---------------------------------------------------------------------------
// Webhook types — mirrors Granit.Webhooks .NET contract
// ---------------------------------------------------------------------------

/** Branded webhook subscription identifier. */
export type WebhookSubscriptionId = EntityId<'WebhookSubscription'>;

/** Branded webhook delivery identifier. */
export type WebhookDeliveryId = EntityId<'WebhookDelivery'>;

/** Branded webhook signing-key identifier. */
export type WebhookSigningKeyId = EntityId<'WebhookSigningKey'>;

/**
 * Webhook subscription lifecycle status.
 *
 * Mirrors `Granit.Webhooks.Domain.WebhookSubscriptionStatus` (.NET).
 * Serialized as PascalCase strings via the framework's global
 * `JsonStringEnumConverter`.
 */
export type WebhookSubscriptionStatus = 'Active' | 'Suspended' | 'Deactivated';

export const WebhookSubscriptionStatus = {
  Active: 'Active',
  Suspended: 'Suspended',
  Deactivated: 'Deactivated',
} as const satisfies Record<string, WebhookSubscriptionStatus>;

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
  readonly status: WebhookSubscriptionStatus;
  readonly consecutiveFailureCount: number;
  readonly lastSuccessAt: ISODateString | null;
  readonly createdAt: ISODateString;
  readonly modifiedAt: ISODateString | null;
  /**
   * Stripe-style masked preview of the active signing secret
   * (e.g. `whsec_b46a****************5182`) — a fixed 30-char hint
   * for admin UIs to display on the detail/edit view without ever
   * re-exposing the plaintext. Refreshed on every signing-key rotation.
   *
   * `null` for legacy subscriptions created before the hint was introduced —
   * UIs should fall back to a static placeholder in that case.
   */
  readonly signingSecretHint: string | null;
}

/** Response from `POST /subscriptions` (201 Created). Contains the signing secret (shown once). */
export interface WebhookSubscriptionCreatedResponse {
  readonly id: WebhookSubscriptionId;
  readonly targetUrl: string;
  readonly eventType: string;
  readonly status: WebhookSubscriptionStatus;
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

// ── Signing keys ──────────────────────────────────────────────────────────

/**
 * Signing-key lifecycle status.
 *
 * Mirrors `Granit.Webhooks.Domain.WebhookSigningKeyStatus` (.NET). Keys rotate
 * with overlap: a new key becomes `Active` while the previous one is `Retired`
 * for a grace period (both verify), then it can be `Revoked`.
 */
export type WebhookSigningKeyStatus = 'Active' | 'Retired' | 'Revoked';

export const WebhookSigningKeyStatus = {
  Active: 'Active',
  Retired: 'Retired',
  Revoked: 'Revoked',
} as const satisfies Record<string, WebhookSigningKeyStatus>;

/**
 * Read-only projection of a signing key. The protected secret is never
 * disclosed — the plaintext is returned once, at rotation time, via
 * {@link WebhookSigningKeyCreatedResponse}.
 */
export interface WebhookSigningKeyResponse {
  readonly id: WebhookSigningKeyId;
  readonly subscriptionId: WebhookSubscriptionId;
  readonly createdAt: ISODateString;
  readonly expiresAt: ISODateString | null;
  readonly revokedAt: ISODateString | null;
  readonly lastRotationNotificationAt: ISODateString | null;
  readonly status: WebhookSigningKeyStatus;
}

/**
 * Response from `POST /subscriptions/{id}/keys` (201 Created). The
 * `plainSecret` is returned exactly once — store it securely.
 */
export interface WebhookSigningKeyCreatedResponse {
  readonly id: WebhookSigningKeyId;
  readonly subscriptionId: WebhookSubscriptionId;
  readonly createdAt: ISODateString;
  readonly plainSecret: string;
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

/**
 * Response from `GET /config` (opt-in `MapGranitWebhooksConfig` endpoint).
 *
 * Mirrors `Granit.Webhooks.Dtos.WebhookModuleConfigResponse` (.NET).
 */
export interface WebhookModuleConfigResponse {
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
  readonly occurredAt: ISODateString;
  readonly durationMs: number;
  readonly errorMessage: string | null;
  readonly isSuccess: boolean;
  /** Serialized JSON body. `null` when `WebhooksOptions.StorePayload` is `false` (default). */
  readonly payload: string | null;
}
