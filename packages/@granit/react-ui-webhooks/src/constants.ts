import type { QueryConfig } from '@granit/query-engine';

export const SUBSCRIPTIONS_QUERY_CONFIG: QueryConfig = {
  basePath: '/api/v1/webhooks/subscriptions',
  queryKeyPrefix: ['webhooks', 'subscriptions'],
};

/**
 * Deliveries are a flat query-engine resource (`GET /webhooks/deliveries`,
 * `MapGranitQuery<WebhookDeliveryAttempt>`) — there is no nested
 * `/subscriptions/{id}/deliveries` route. The grid is scoped to a single
 * subscription with a `subscriptionId.Eq` base filter (see WebhookDeliveryTable);
 * the subscription id is kept in the query-key prefix so each detail view caches
 * separately and `useRetryDelivery` can invalidate it.
 */
export function buildDeliveriesQueryConfig(subscriptionId: string): QueryConfig {
  return {
    basePath: '/api/v1/webhooks/deliveries',
    queryKeyPrefix: ['webhooks', 'deliveries', subscriptionId],
  };
}

export const DEFAULT_PAGE_SIZE = 20;

export const WEBHOOK_API_BASE = '/api/v1/webhooks';
export const WEBHOOK_CONFIG_PATH = `${WEBHOOK_API_BASE}/config`;
export const WEBHOOK_STATS_PATH = `${WEBHOOK_API_BASE}/stats`;
