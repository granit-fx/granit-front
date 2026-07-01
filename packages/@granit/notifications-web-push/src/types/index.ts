// ---------------------------------------------------------------------------
// Web Push subscription DTOs — mirror Granit.Notifications.WebPush .NET contracts
// (contracts/openapi/notifications-web-push.json). The register payload is the
// W3C `PushSubscription.toJSON()` shape the browser emits.
// ---------------------------------------------------------------------------

/** W3C Push API subscription keys. Mirrors `WebPushSubscriptionKeys` from .NET. */
export interface WebPushSubscriptionKeys {
  readonly p256dh: string;
  readonly auth: string;
}

/**
 * Web Push subscription registration payload — the W3C
 * `PushSubscription.toJSON()` shape. Mirrors `WebPushSubscriptionRegisterRequest`.
 */
export interface WebPushSubscriptionRegisterRequest {
  readonly endpoint: string;
  /** Subscription expiry (epoch ms), or `null` when the subscription never expires. */
  readonly expirationTime?: number | null;
  readonly keys: WebPushSubscriptionKeys;
}

/** Web Push unsubscribe payload. Mirrors `WebPushSubscriptionRemoveRequest`. */
export interface WebPushSubscriptionRemoveRequest {
  readonly endpoint: string;
}
