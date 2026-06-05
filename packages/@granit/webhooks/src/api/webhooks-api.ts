import type {
  WebhookEventTypeResponse,
  WebhookModuleConfigResponse,
  WebhookSigningKeyCreatedResponse,
  WebhookSigningKeyResponse,
  WebhookSubscriptionCreateRequest,
  WebhookSubscriptionCreatedResponse,
  WebhookSubscriptionDeactivateRequest,
  WebhookSubscriptionResponse,
  WebhookSubscriptionStatsResponse,
  WebhookSubscriptionTestPingResponse,
  WebhookSubscriptionUpdateRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

// ── Subscription CRUD ───────────────────────────────────────────────────────

/**
 * Get a single webhook subscription by ID.
 *
 * `GET {basePath}/{id}`
 */
export async function getSubscription(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<WebhookSubscriptionResponse> {
  const { data } = await client.get<WebhookSubscriptionResponse>(
    `${basePath}/${encodeURIComponent(id)}`
  );
  return data;
}

/**
 * Create a new webhook subscription.
 *
 * `POST {basePath}`
 */
export async function createSubscription(
  client: AxiosInstance,
  basePath: string,
  request: WebhookSubscriptionCreateRequest
): Promise<WebhookSubscriptionCreatedResponse> {
  const { data } = await client.post<WebhookSubscriptionCreatedResponse>(basePath, request);
  return data;
}

/**
 * Update a webhook subscription's target URL.
 *
 * `PUT {basePath}/{id}`
 */
export async function updateSubscription(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: WebhookSubscriptionUpdateRequest
): Promise<WebhookSubscriptionResponse> {
  const { data } = await client.put<WebhookSubscriptionResponse>(
    `${basePath}/${encodeURIComponent(id)}`,
    request
  );
  return data;
}

/**
 * Delete a webhook subscription.
 *
 * `DELETE {basePath}/{id}`
 */
export async function deleteSubscription(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}`);
}

// ── Lifecycle transitions ───────────────────────────────────────────────────

/**
 * Activate a suspended webhook subscription.
 *
 * `POST {basePath}/{id}/activate`
 */
export async function activateSubscription(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<WebhookSubscriptionResponse> {
  const { data } = await client.post<WebhookSubscriptionResponse>(
    `${basePath}/${encodeURIComponent(id)}/activate`
  );
  return data;
}

/**
 * Suspend a webhook subscription.
 *
 * `POST {basePath}/{id}/suspend`
 */
export async function suspendSubscription(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<WebhookSubscriptionResponse> {
  const { data } = await client.post<WebhookSubscriptionResponse>(
    `${basePath}/${encodeURIComponent(id)}/suspend`
  );
  return data;
}

/**
 * Deactivate a webhook subscription permanently.
 *
 * `POST {basePath}/{id}/deactivate`
 */
export async function deactivateSubscription(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: WebhookSubscriptionDeactivateRequest
): Promise<WebhookSubscriptionResponse> {
  const { data } = await client.post<WebhookSubscriptionResponse>(
    `${basePath}/${encodeURIComponent(id)}/deactivate`,
    request
  );
  return data;
}

// ── Signing keys ──────────────────────────────────────────────────────────

/**
 * List the signing keys of a subscription (Active, Retired, Revoked).
 *
 * `GET {basePath}/{id}/keys`
 */
export async function listSigningKeys(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<WebhookSigningKeyResponse[]> {
  const { data } = await client.get<WebhookSigningKeyResponse[]>(
    `${basePath}/${encodeURIComponent(id)}/keys`
  );
  return data;
}

/**
 * Rotate the signing key of a subscription. The previous Active key moves to
 * Retired for a grace period; the new plaintext secret is returned exactly once.
 *
 * `POST {basePath}/{id}/keys`
 */
export async function rotateSigningKey(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<WebhookSigningKeyCreatedResponse> {
  const { data } = await client.post<WebhookSigningKeyCreatedResponse>(
    `${basePath}/${encodeURIComponent(id)}/keys`
  );
  return data;
}

/**
 * Revoke a specific signing key. The last Active key cannot be revoked — rotate
 * first to introduce a new Active key, then revoke the old one.
 *
 * `DELETE {basePath}/{id}/keys/{keyId}`
 */
export async function revokeSigningKey(
  client: AxiosInstance,
  basePath: string,
  id: string,
  keyId: string
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}/keys/${encodeURIComponent(keyId)}`);
}

// ── Operations ──────────────────────────────────────────────────────────────

/**
 * Send a test ping to a subscription's target URL.
 *
 * `POST {basePath}/{id}/test-ping`
 */
export async function testPing(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<WebhookSubscriptionTestPingResponse> {
  const { data } = await client.post<WebhookSubscriptionTestPingResponse>(
    `${basePath}/${encodeURIComponent(id)}/test-ping`
  );
  return data;
}

/**
 * Get all registered webhook event types.
 *
 * `GET {basePath}/event-types`
 *
 * @param basePath - The webhooks root path (e.g. `/api/v1/webhooks`), **not** the subscriptions path.
 */
export async function getEventTypes(
  client: AxiosInstance,
  basePath: string
): Promise<WebhookEventTypeResponse[]> {
  const { data } = await client.get<WebhookEventTypeResponse[]>(`${basePath}/event-types`);
  return data;
}

/**
 * Get webhook module configuration.
 *
 * `GET {basePath}/config`
 *
 * @param basePath - The webhooks root path (e.g. `/api/v1/webhooks`), **not** the subscriptions path.
 */
export async function getConfig(
  client: AxiosInstance,
  basePath: string
): Promise<WebhookModuleConfigResponse> {
  const { data } = await client.get<WebhookModuleConfigResponse>(`${basePath}/config`);
  return data;
}

/**
 * Get aggregated webhook statistics.
 *
 * `GET {basePath}/stats`
 */
export async function getStats(
  client: AxiosInstance,
  basePath: string
): Promise<WebhookSubscriptionStatsResponse> {
  const { data } = await client.get<WebhookSubscriptionStatsResponse>(`${basePath}/stats`);
  return data;
}

// ── Delivery audit trail ────────────────────────────────────────────────────

// The delivery list (`GET {basePath}/deliveries`) and its `/meta` are served by
// the Granit query engine (`MapGranitQuery<WebhookDeliveryAttempt>`) and consumed
// generically via `@granit/react-query-engine` — there is no dedicated API
// function. Filter by subscription with `filter[subscriptionId.Eq]=…`.

/**
 * Retry a previously failed webhook delivery attempt.
 *
 * `POST {basePath}/deliveries/{deliveryId}/retry`
 *
 * @param basePath - The webhooks root path (e.g. `/api/v1/webhooks`), **not** the subscriptions path.
 */
export async function retryDelivery(
  client: AxiosInstance,
  basePath: string,
  deliveryId: string
): Promise<void> {
  await client.post(`${basePath}/deliveries/${encodeURIComponent(deliveryId)}/retry`);
}
