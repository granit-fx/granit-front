import { createMswServer } from '@granit/testing/msw';
import { describe, expect, it } from 'vitest';

import { createWebhooksHandlers, webhookSubscriptionQueryMetadata } from '../testing/index';

import type {
  WebhookSigningKeyResponse,
  WebhookSubscriptionResponse,
  WebhookSubscriptionStatsResponse,
} from '@granit/webhooks';

const BASE = 'http://api.test/api/v1/webhooks';
const server = createMswServer();

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

  it('rotating a signing key refreshes the hint exposed by subsequent GETs', async () => {
    server.use(...createWebhooksHandlers(BASE));

    const before = (await (
      await fetch(`${BASE}/subscriptions/ws-1`)
    ).json()) as WebhookSubscriptionResponse;
    expect(before.signingSecretHint).toMatch(HINT_PATTERN);

    const rotate = await fetch(`${BASE}/subscriptions/ws-1/keys`, { method: 'POST' });
    expect(rotate.status).toBe(201);
    const created = (await rotate.json()) as { plainSecret: string };
    expect(created.plainSecret).toMatch(/^whsec_[0-9a-f]{32}$/);

    const after = (await (
      await fetch(`${BASE}/subscriptions/ws-1`)
    ).json()) as WebhookSubscriptionResponse;
    expect(after.signingSecretHint).toMatch(HINT_PATTERN);
    expect(after.signingSecretHint).not.toBe(before.signingSecretHint);
  });
});

describe('createWebhooksHandlers signing keys', () => {
  it('lists keys and rotation moves the previous Active key to Retired', async () => {
    server.use(...createWebhooksHandlers(BASE));

    const initial = (await (
      await fetch(`${BASE}/subscriptions/ws-1/keys`)
    ).json()) as WebhookSigningKeyResponse[];
    expect(initial.filter((k) => k.status === 'Active')).toHaveLength(1);

    await fetch(`${BASE}/subscriptions/ws-1/keys`, { method: 'POST' });

    const after = (await (
      await fetch(`${BASE}/subscriptions/ws-1/keys`)
    ).json()) as WebhookSigningKeyResponse[];
    expect(after.filter((k) => k.status === 'Active')).toHaveLength(1);
    expect(after.filter((k) => k.status === 'Retired').length).toBeGreaterThanOrEqual(1);
  });

  it('refuses to revoke the last Active key (400)', async () => {
    server.use(...createWebhooksHandlers(BASE));

    const keys = (await (
      await fetch(`${BASE}/subscriptions/ws-1/keys`)
    ).json()) as WebhookSigningKeyResponse[];
    const active = keys.find((k) => k.status === 'Active')!;

    const revoke = await fetch(`${BASE}/subscriptions/ws-1/keys/${active.id}`, {
      method: 'DELETE',
    });
    expect(revoke.status).toBe(400);
  });

  it('revokes a Retired key (204)', async () => {
    server.use(...createWebhooksHandlers(BASE));

    const keys = (await (
      await fetch(`${BASE}/subscriptions/ws-1/keys`)
    ).json()) as WebhookSigningKeyResponse[];
    const retired = keys.find((k) => k.status === 'Retired')!;

    const revoke = await fetch(`${BASE}/subscriptions/ws-1/keys/${retired.id}`, {
      method: 'DELETE',
    });
    expect(revoke.status).toBe(204);
  });
});

describe('createWebhooksHandlers deliveries', () => {
  it('serves a PagedResult at the flat /deliveries route', async () => {
    server.use(...createWebhooksHandlers(BASE));
    const response = await fetch(`${BASE}/deliveries?pageSize=100`);
    expect(response.status).toBe(200);
    const page = (await response.json()) as { items: unknown[]; totalCount: number };
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.items.length).toBeGreaterThan(0);
  });

  it('scopes by subscription via filter[subscriptionId.eq]', async () => {
    server.use(...createWebhooksHandlers(BASE));
    const response = await fetch(`${BASE}/deliveries?pageSize=100&filter[subscriptionId.Eq]=ws-3`);
    const page = (await response.json()) as {
      items: { subscriptionId: string }[];
    };
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((d) => d.subscriptionId === 'ws-3')).toBe(true);
  });

  it('exposes /deliveries/meta', async () => {
    server.use(...createWebhooksHandlers(BASE));
    const response = await fetch(`${BASE}/deliveries/meta`);
    expect(response.status).toBe(200);
    const meta = (await response.json()) as { columns: unknown[] };
    expect(meta.columns.length).toBeGreaterThan(0);
  });
});
