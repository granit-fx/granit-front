import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { createIotHandlers, deviceQueryMetadata, telemetryQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/iot';
const server = createMswServer();

describe('createIotHandlers', () => {
  it('responds with deviceQueryMetadata at /devices/meta', async () => {
    server.use(...createIotHandlers(BASE));
    const response = await fetch(`${BASE}/devices/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(deviceQueryMetadata);
  });

  it('serves the device grid (paged envelope)', async () => {
    server.use(...createIotHandlers(BASE));
    const response = await fetch(`${BASE}/devices`);
    expect(response.status).toBe(200);
    const page = (await response.json()) as { items: unknown[]; totalCount: number };
    expect(page.totalCount).toBe(page.items.length);
    expect(page.items.length).toBeGreaterThan(0);
  });

  it('provisions a device (starts in Provisioning)', async () => {
    server.use(...createIotHandlers(BASE));
    const response = await fetch(`${BASE}/devices`, {
      method: 'POST',
      body: JSON.stringify({
        serialNumber: 'SN-999',
        hardwareModel: 'Acme-X1',
        firmwareVersion: '1.4.2',
      }),
    });
    expect(response.status).toBe(201);
    const device = (await response.json()) as { status: string; serialNumber: string };
    expect(device.status).toBe('Provisioning');
    expect(device.serialNumber).toBe('SN-999');
  });

  it('decommissions a device (status → Decommissioned)', async () => {
    server.use(...createIotHandlers(BASE));
    const del = await fetch(`${BASE}/devices/dev_001`, { method: 'DELETE' });
    expect(del.status).toBe(204);

    const after = await fetch(`${BASE}/devices/dev_001`);
    const device = (await after.json()) as { status: string };
    expect(device.status).toBe('Decommissioned');
  });

  it('404s for an unknown device', async () => {
    server.use(...createIotHandlers(BASE));
    const response = await fetch(`${BASE}/devices/nope`);
    expect(response.status).toBe(404);
  });

  it('serves the telemetry grid (meta + list)', async () => {
    server.use(...createIotHandlers(BASE));

    const meta = await fetch(`${BASE}/telemetry/meta`);
    expect(meta.status).toBe(200);
    expect(await meta.json()).toEqual(telemetryQueryMetadata);

    const list = await fetch(`${BASE}/telemetry`);
    const page = (await list.json()) as { items: unknown[]; totalCount: number };
    expect(page.totalCount).toBe(page.items.length);
  });

  it('returns the latest telemetry point for the requested device', async () => {
    server.use(...createIotHandlers(BASE));
    const response = await fetch(`${BASE}/telemetry/dev_042/latest`);
    expect(response.status).toBe(200);
    const point = (await response.json()) as { deviceId: string; metrics: Record<string, number> };
    expect(point.deviceId).toBe('dev_042');
    expect(point.metrics.temperature).toBeTypeOf('number');
  });

  it('aggregates a metric reflecting the query params', async () => {
    server.use(...createIotHandlers(BASE));
    const response = await fetch(
      `${BASE}/telemetry/dev_001/aggregate?metric=humidity&aggregation=Max`
    );
    expect(response.status).toBe(200);
    const agg = (await response.json()) as { metricName: string; aggregation: string };
    expect(agg.metricName).toBe('humidity');
    expect(agg.aggregation).toBe('Max');
  });
});
