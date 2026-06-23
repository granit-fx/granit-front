import { describe, expect, it } from 'vitest';

import {
  buildDeliveriesQueryConfig,
  DEFAULT_PAGE_SIZE,
  SUBSCRIPTIONS_QUERY_CONFIG,
  WEBHOOK_API_BASE,
  WEBHOOK_CONFIG_PATH,
  WEBHOOK_STATS_PATH,
} from '../constants';

describe('SUBSCRIPTIONS_QUERY_CONFIG', () => {
  it('should have a basePath targeting the subscriptions endpoint', () => {
    expect(SUBSCRIPTIONS_QUERY_CONFIG.basePath).toBe('/api/v1/webhooks/subscriptions');
  });

  it('should not have a client (resolved via GranitClientProvider)', () => {
    expect(SUBSCRIPTIONS_QUERY_CONFIG.client).toBeUndefined();
  });

  it('should have a queryKeyPrefix containing webhooks and subscriptions', () => {
    expect(SUBSCRIPTIONS_QUERY_CONFIG.queryKeyPrefix).toEqual(['webhooks', 'subscriptions']);
  });
});

describe('buildDeliveriesQueryConfig', () => {
  it('should target the flat deliveries query-engine endpoint', () => {
    const config = buildDeliveriesQueryConfig('ws-42');

    expect(config.basePath).toBe('/api/v1/webhooks/deliveries');
  });

  it('should include the subscription id in the queryKeyPrefix', () => {
    const config = buildDeliveriesQueryConfig('ws-99');

    expect(config.queryKeyPrefix).toEqual(['webhooks', 'deliveries', 'ws-99']);
  });

  it('should not have a client (resolved via GranitClientProvider)', () => {
    const config = buildDeliveriesQueryConfig('ws-1');

    expect(config.client).toBeUndefined();
  });

  it('should return per-subscription query keys while sharing the flat endpoint', () => {
    const configA = buildDeliveriesQueryConfig('ws-a');
    const configB = buildDeliveriesQueryConfig('ws-b');

    expect(configA.basePath).toBe(configB.basePath);
    expect(configA.queryKeyPrefix).not.toEqual(configB.queryKeyPrefix);
  });
});

describe('API path constants', () => {
  it('should have WEBHOOK_API_BASE pointing to webhooks root', () => {
    expect(WEBHOOK_API_BASE).toBe('/api/v1/webhooks');
  });

  it('should have WEBHOOK_CONFIG_PATH pointing to config', () => {
    expect(WEBHOOK_CONFIG_PATH).toBe('/api/v1/webhooks/config');
  });

  it('should have WEBHOOK_STATS_PATH pointing to stats', () => {
    expect(WEBHOOK_STATS_PATH).toBe('/api/v1/webhooks/stats');
  });

  it('should all start with /api/v1/webhooks', () => {
    expect(WEBHOOK_API_BASE).toMatch(/^\/api\/v1\/webhooks/);
    expect(WEBHOOK_CONFIG_PATH).toMatch(/^\/api\/v1\/webhooks\//);
    expect(WEBHOOK_STATS_PATH).toMatch(/^\/api\/v1\/webhooks\//);
  });
});

describe('DEFAULT_PAGE_SIZE', () => {
  it('should be 20', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
  });
});
