import { getPage } from '@granit/query-engine';

import type {
  BulkMigratePriceRequest,
  BulkMigratePriceResponse,
  CreatePriceVersionRequest,
  MigratePriceRequest,
  PlanCreateRequest,
  PlanPriceResponse,
  PlanResponse,
  PlanUpdateRequest,
  SeatAssignRequest,
  SeatResponse,
  SubscriptionCancelRequest,
  SubscriptionChangePlanRequest,
  SubscriptionCreateRequest,
  SubscriptionResponse,
} from '../types.js';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, QueryRequest } from '@granit/query-engine';

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

/**
 * List all plans.
 *
 * `GET {basePath}/plans`
 */
export async function listPlans(
  client: AxiosInstance,
  basePath: string
): Promise<readonly PlanResponse[]> {
  const response = await client.get<readonly PlanResponse[]>(`${basePath}/plans`);
  return response.data;
}

/**
 * Get a plan by its identifier.
 *
 * `GET {basePath}/plans/{id}`
 */
export async function getPlanById(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<PlanResponse> {
  const response = await client.get<PlanResponse>(`${basePath}/plans/${encodeURIComponent(id)}`);
  return response.data;
}

/**
 * Create a new plan.
 *
 * `POST {basePath}/plans`
 */
export async function createPlan(
  client: AxiosInstance,
  basePath: string,
  request: PlanCreateRequest
): Promise<PlanResponse> {
  const response = await client.post<PlanResponse>(`${basePath}/plans`, request);
  return response.data;
}

/**
 * Update an existing plan.
 *
 * `PUT {basePath}/plans/{id}`
 */
export async function updatePlan(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: PlanUpdateRequest
): Promise<PlanResponse> {
  const response = await client.put<PlanResponse>(
    `${basePath}/plans/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Publish a draft plan, making it available for subscriptions.
 *
 * `POST {basePath}/plans/{id}/publish`
 */
export async function publishPlan(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/plans/${encodeURIComponent(id)}/publish`);
}

/**
 * Archive a plan, preventing new subscriptions.
 *
 * `POST {basePath}/plans/{id}/archive`
 */
export async function archivePlan(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/plans/${encodeURIComponent(id)}/archive`);
}

/**
 * Create a new price version for a plan.
 *
 * `POST {basePath}/plans/{planId}/prices`
 */
export async function createPriceVersion(
  client: AxiosInstance,
  basePath: string,
  planId: string,
  request: CreatePriceVersionRequest
): Promise<PlanPriceResponse> {
  const response = await client.post<PlanPriceResponse>(
    `${basePath}/plans/${encodeURIComponent(planId)}/prices`,
    request
  );
  return response.data;
}

/**
 * Get the full price history for a plan.
 *
 * `GET {basePath}/plans/{planId}/prices/history`
 */
export async function getPlanPriceHistory(
  client: AxiosInstance,
  basePath: string,
  planId: string
): Promise<readonly PlanPriceResponse[]> {
  const response = await client.get<readonly PlanPriceResponse[]>(
    `${basePath}/plans/${encodeURIComponent(planId)}/prices/history`
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

/**
 * List subscriptions (paginated).
 *
 * `GET {basePath}/subscriptions`
 *
 * Delegates to {@link getPage} from `@granit/query-engine` so query
 * parameters (page, pageSize, filters, sort, …) are serialized consistently.
 */
export async function listSubscriptions(
  client: AxiosInstance,
  basePath: string,
  params?: QueryRequest
): Promise<PagedResult<SubscriptionResponse>> {
  return getPage<SubscriptionResponse>(client, `${basePath}/subscriptions`, params ?? {});
}

/**
 * Get the currently active subscription.
 *
 * `GET {basePath}/subscriptions/active`
 */
export async function getActiveSubscription(
  client: AxiosInstance,
  basePath: string
): Promise<SubscriptionResponse> {
  const response = await client.get<SubscriptionResponse>(`${basePath}/subscriptions/active`);
  return response.data;
}

/**
 * Get a subscription by its identifier.
 *
 * `GET {basePath}/subscriptions/{id}`
 */
export async function getSubscriptionById(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<SubscriptionResponse> {
  const response = await client.get<SubscriptionResponse>(
    `${basePath}/subscriptions/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Create a new subscription.
 *
 * `POST {basePath}/subscriptions`
 */
export async function createSubscription(
  client: AxiosInstance,
  basePath: string,
  request: SubscriptionCreateRequest
): Promise<SubscriptionResponse> {
  const response = await client.post<SubscriptionResponse>(`${basePath}/subscriptions`, request);
  return response.data;
}

/**
 * Cancel a subscription.
 *
 * `POST {basePath}/subscriptions/{id}/cancel`
 */
export async function cancelSubscription(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: SubscriptionCancelRequest
): Promise<SubscriptionResponse> {
  const response = await client.post<SubscriptionResponse>(
    `${basePath}/subscriptions/${encodeURIComponent(id)}/cancel`,
    request
  );
  return response.data;
}

/**
 * Change the plan of an existing subscription.
 *
 * `POST {basePath}/subscriptions/{id}/change-plan`
 */
export async function changeSubscriptionPlan(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: SubscriptionChangePlanRequest
): Promise<SubscriptionResponse> {
  const response = await client.post<SubscriptionResponse>(
    `${basePath}/subscriptions/${encodeURIComponent(id)}/change-plan`,
    request
  );
  return response.data;
}

/**
 * Migrate a subscription to a new price version.
 *
 * `POST {basePath}/subscriptions/{id}/migrate-price`
 */
export async function migrateSubscriptionPrice(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: MigratePriceRequest
): Promise<SubscriptionResponse> {
  const response = await client.post<SubscriptionResponse>(
    `${basePath}/subscriptions/${encodeURIComponent(id)}/migrate-price`,
    request
  );
  return response.data;
}

/**
 * Bulk-migrate subscriptions to a new price version.
 *
 * `POST {basePath}/subscriptions/bulk-migrate-price`
 */
export async function bulkMigrateSubscriptionPrice(
  client: AxiosInstance,
  basePath: string,
  request: BulkMigratePriceRequest
): Promise<BulkMigratePriceResponse> {
  const response = await client.post<BulkMigratePriceResponse>(
    `${basePath}/subscriptions/bulk-migrate-price`,
    request
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Seats
// ---------------------------------------------------------------------------

/**
 * List all seats for a subscription.
 *
 * `GET {basePath}/subscriptions/{subscriptionId}/seats`
 */
export async function listSeats(
  client: AxiosInstance,
  basePath: string,
  subscriptionId: string
): Promise<readonly SeatResponse[]> {
  const response = await client.get<readonly SeatResponse[]>(
    `${basePath}/subscriptions/${encodeURIComponent(subscriptionId)}/seats`
  );
  return response.data;
}

/**
 * Assign a seat to a user within a subscription.
 *
 * `POST {basePath}/subscriptions/{subscriptionId}/seats`
 */
export async function assignSeat(
  client: AxiosInstance,
  basePath: string,
  subscriptionId: string,
  request: SeatAssignRequest
): Promise<SeatResponse> {
  const response = await client.post<SeatResponse>(
    `${basePath}/subscriptions/${encodeURIComponent(subscriptionId)}/seats`,
    request
  );
  return response.data;
}

/**
 * Revoke a seat from a user within a subscription.
 *
 * `DELETE {basePath}/subscriptions/{subscriptionId}/seats/{userId}`
 */
export async function revokeSeat(
  client: AxiosInstance,
  basePath: string,
  subscriptionId: string,
  userId: string
): Promise<void> {
  await client.delete(
    `${basePath}/subscriptions/${encodeURIComponent(subscriptionId)}/seats/${encodeURIComponent(userId)}`
  );
}
