import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createWebhooksHandlers, webhookSubscriptionQueryMetadata } from '../testing/index';

import type {
  WebhookSubscriptionResponse,
  WebhookSubscriptionStatsResponse,
} from '@granit/webhooks';

const BASE = 'http://api.test/api/v1/webhooks';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Backend contract — see WebhookSubscriptionResponse.SigningSecretHint XML doc.
const HINT_PATTERN = /^whsec_[0-9a-f]{4}\*{16}[0-9a-f]{4}$/;

describe('createWebhooksHandlers /meta', () => {
  it('responds with webhookSubscriptionQueryMetadata at /subscriptions/meta', async () => {
    server.use(...createWebhooksHandlers(BASE));
    const response = await fetch(`${BASE}/subscriptions/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(webhookSubscriptionQueryMetadata);
  });
});

describe('createWebhooksHandlers /stats', () => {
  // Regression: the handler must sit at `${baseUrl}/stats` — the path getStats
  // hits — not under `/subscriptions`. A mismatch lets the request fall through
  // (server uses onUnhandledRequest: 'error'), so the dashboard receives a
  // body without `successRateLast24h` and crashes on `.toFixed`.
  it('responds with stats at /stats and carries every required field', async () => {
    server.use(...createWebhooksHandlers(BASE));
    const response = await fetch(`${BASE}/stats`);
    expect(response.status).toBe(200);

    const stats = (await response.json()) as WebhookSubscriptionStatsResponse;
    expect(typeof stats.successRateLast24h).toBe('number');
    expect(typeof stats.avgResponseTimeMsLast24h).toBe('number');
    expect(typeof stats.totalSubscriptions).toBe('number');
  });
});

describe('createWebhooksHandlers signingSecretHint', () => {
  it('fixtures expose both populated hints and a legacy null hint', async () => {
    server.use(...createWebhooksHandlers(BASE));
    const response = await fetch(`${BASE}/subscriptions?pageSize=100`);
    const page = (await response.json()) as { items: WebhookSubscriptionResponse[] };

    const withHint = page.items.filter((s) => s.signingSecretHint !== null);
    const legacy = page.items.filter((s) => s.signingSecretHint === null);

    expect(withHint.length).toBeGreaterThan(0);
    expect(legacy.length).toBeGreaterThan(0);
    for (const sub of withHint) {
      expect(sub.signingSecretHint).toMatch(HINT_PATTERN);
    }
  });

  it('create emits a freshly-shaped hint and never exposes plaintext on the returned subscription', async () => {
    server.use(...createWebhooksHandlers(BASE));
    const response = await fetch(`${BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetUrl: 'https://new.example.com/webhook',
        eventType: 'document.uploaded',
      }),
    });
    expect(response.status).toBe(201);
    const created = (await response.json()) as WebhookSubscriptionResponse & {
      signingSecret?: string;
    };

    expect(created.signingSecretHint).toMatch(HINT_PATTERN);
    // The subscription resource never carries the plaintext secret; only the
    // create-/rotate-response DTOs do (and the UI's one-shot modal consumes those).
    expect(created.signingSecret).toBeUndefined();
  });

  it('rotate-secret refreshes the hint exposed by subsequent GETs', async () => {
    server.use(...createWebhooksHandlers(BASE));

    const before = (await (
      await fetch(`${BASE}/subscriptions/ws-1`)
    ).json()) as WebhookSubscriptionResponse;
    expect(before.signingSecretHint).toMatch(HINT_PATTERN);

    const rotate = await fetch(`${BASE}/subscriptions/ws-1/rotate-secret`, { method: 'POST' });
    expect(rotate.status).toBe(200);

    const after = (await (
      await fetch(`${BASE}/subscriptions/ws-1`)
    ).json()) as WebhookSubscriptionResponse;
    expect(after.signingSecretHint).toMatch(HINT_PATTERN);
    expect(after.signingSecretHint).not.toBe(before.signingSecretHint);
  });
});
