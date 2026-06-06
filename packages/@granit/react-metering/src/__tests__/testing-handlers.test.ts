import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import {
  createMeteringHandlers,
  meterQueryMetadata,
  usageAggregateQueryMetadata,
} from '../testing/index';

const BASE = 'http://api.test/api/v1/metering';
const server = createMswServer();

describe('createMeteringHandlers', () => {
  it('responds with meterQueryMetadata at /meters/meta', async () => {
    server.use(...createMeteringHandlers(BASE));
    const response = await fetch(`${BASE}/meters/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(meterQueryMetadata);
  });

  it('returns only Published meters at /meters/active', async () => {
    server.use(...createMeteringHandlers(BASE));
    const response = await fetch(`${BASE}/meters/active`);
    expect(response.status).toBe(200);
    const meters = (await response.json()) as { lifecycleStatus: string }[];
    expect(meters.length).toBeGreaterThan(0);
    expect(meters.every((m) => m.lifecycleStatus === 'Published')).toBe(true);
  });

  it('publishes a Draft meter (Draft → Published)', async () => {
    server.use(...createMeteringHandlers(BASE));
    // mtr_003 seeds as Draft and is therefore absent from the active catalog.
    const before = (await (await fetch(`${BASE}/meters/active`)).json()) as { id: string }[];
    expect(before.some((m) => m.id === 'mtr_003')).toBe(false);

    const publish = await fetch(`${BASE}/meters/mtr_003/publish`, { method: 'POST' });
    expect(publish.status).toBe(204);

    const after = (await (await fetch(`${BASE}/meters/active`)).json()) as { id: string }[];
    expect(after.some((m) => m.id === 'mtr_003')).toBe(true);
  });

  it('returns a single aggregate at /usage for the requested meter', async () => {
    server.use(...createMeteringHandlers(BASE));
    const response = await fetch(
      `${BASE}/usage?meterId=mtr_002&periodStart=2026-04-01T00:00:00Z&periodEnd=2026-05-01T00:00:00Z`
    );
    expect(response.status).toBe(200);
    const usage = (await response.json()) as { meterDefinitionId: string };
    expect(usage.meterDefinitionId).toBe('mtr_002');
  });

  it('serves the usage-aggregates query grid (meta + list)', async () => {
    server.use(...createMeteringHandlers(BASE));

    const meta = await fetch(`${BASE}/usage-aggregates/meta`);
    expect(meta.status).toBe(200);
    expect(await meta.json()).toEqual(usageAggregateQueryMetadata);

    const list = await fetch(`${BASE}/usage-aggregates`);
    expect(list.status).toBe(200);
    const page = (await list.json()) as { items: unknown[]; totalCount: number };
    expect(page.totalCount).toBe(page.items.length);
    expect(page.items.length).toBeGreaterThan(0);
  });
});
