import type {
  WebhookDeliveryAttemptResponse,
  WebhookEventTypeResponse,
  WebhookModuleConfig,
  WebhookSubscriptionCreateRequest,
  WebhookSubscriptionCreatedResponse,
  WebhookSubscriptionDeactivateRequest,
  WebhookSubscriptionResponse,
  WebhookSubscriptionRotateSecretResponse,
  WebhookSubscriptionStatsResponse,
  WebhookSubscriptionTestPingResponse,
  WebhookSubscriptionUpdateRequest,
} from '../types/index.js';
import type { AxiosInstance } from 'axios';

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

// ── Operations ──────────────────────────────────────────────────────────────

/**
 * Rotate the signing secret of a subscription. The new secret is returned once.
 *
 * `POST {basePath}/{id}/rotate-secret`
 */
export async function rotateSecret(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<WebhookSubscriptionRotateSecretResponse> {
  const { data } = await client.post<WebhookSubscriptionRotateSecretResponse>(
    `${basePath}/${encodeURIComponent(id)}/rotate-secret`
  );
  return data;
}

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
): Promise<WebhookModuleConfig> {
  const { data } = await client.get<WebhookModuleConfig>(`${basePath}/config`);
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

/**
 * Query webhook delivery attempts.
 *
 * `GET {basePath}/deliveries`
 *
 * @param basePath - The webhooks root path (e.g. `/api/v1/webhooks`), **not** the subscriptions path.
 */
export async function getDeliveries(
  client: AxiosInstance,
  basePath: string,
  params?: { subscriptionId?: string }
): Promise<WebhookDeliveryAttemptResponse[]> {
  const { data } = await client.get<WebhookDeliveryAttemptResponse[]>(`${basePath}/deliveries`, {
    params,
  });
  return data;
}

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
