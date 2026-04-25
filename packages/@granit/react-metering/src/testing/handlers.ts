import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { sampleMeters, sampleQuota, sampleUsage } from './data.js';

import type { MeterDefinitionResponse } from '@granit/metering';

/**
 * Create stateful MSW handlers for metering endpoints.
 * Meter mutations (create/update/deactivate) persist in the in-memory list.
 *
 * @param baseUrl - API base path (default: `/api/v1/metering`)
 */
export function createMeteringHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let meters = [...sampleMeters];

  return [
    // GET list active meters
    http.get(`${baseUrl}/meters`, () => {
      return HttpResponse.json(meters.filter((m) => m.activated));
    }),

    // GET single meter by ID
    http.get(`${baseUrl}/meters/:id`, ({ params }) => {
      const meter = meters.find((m) => m.id === params.id);
      if (!meter) return notFound();
      return HttpResponse.json(meter);
    }),

    // POST create meter (Draft)
    http.post(`${baseUrl}/meters`, async ({ request }) => {
      const body = (await request.json()) as Partial<MeterDefinitionResponse>;
      const newMeter: MeterDefinitionResponse = {
        id: toEntityId<'MeterDefinition'>(`mtr_${String(meters.length + 1).padStart(3, '0')}`),
        name: body.name ?? '',
        description: body.description ?? '',
        aggregationType: body.aggregationType ?? 'Count',
        unit: body.unit ?? '',
        activated: false,
        productId: body.productId ?? null,
        lifecycleStatus: 'Draft',
        distinctProperty: body.distinctProperty ?? null,
      };
      meters = [...meters, newMeter];
      return HttpResponse.json(newMeter, { status: 201 });
    }),

    // POST publish
    http.post(`${baseUrl}/meters/:id/publish`, ({ params }) => {
      const id = params.id as string;
      const existing = meters.find((m) => m.id === id);
      if (!existing) return notFound();
      const updated: MeterDefinitionResponse = {
        ...existing,
        activated: true,
        lifecycleStatus: 'Published',
      };
      meters = meters.map((m) => (m.id === id ? updated : m));
      return HttpResponse.json(updated);
    }),

    // POST archive
    http.post(`${baseUrl}/meters/:id/archive`, ({ params }) => {
      const id = params.id as string;
      const existing = meters.find((m) => m.id === id);
      if (!existing) return notFound();
      const updated: MeterDefinitionResponse = {
        ...existing,
        activated: false,
        lifecycleStatus: 'Archived',
      };
      meters = meters.map((m) => (m.id === id ? updated : m));
      return HttpResponse.json(updated);
    }),

    // POST recompute
    http.post(`${baseUrl}/meters/:id/recompute`, async ({ params, request }) => {
      const id = params.id as string;
      const existing = meters.find((m) => m.id === id);
      if (!existing) return notFound();
      const body = (await request.json()) as { from: string; to: string };
      return HttpResponse.json({
        meterDefinitionId: id,
        windowStart: body.from,
        windowEnd: body.to,
        eventsScanned: 0,
        aggregatesRebuilt: 0,
        durationMilliseconds: 0,
      });
    }),

    // POST backfill
    http.post(`${baseUrl}/events/backfill`, async ({ request }) => {
      const body = (await request.json()) as { events: readonly unknown[] };
      return HttpResponse.json({
        eventsAccepted: body.events.length,
        metersAffected: 1,
        aggregatesRebuilt: body.events.length,
      });
    }),

    // POST event deprecate
    http.post(`${baseUrl}/events/:id/deprecate`, async ({ params }) => {
      const id = params.id as string;
      return HttpResponse.json({
        eventId: id,
        meterDefinitionId: meters[0]?.id ?? 'mtr_001',
        deprecatedAt: new Date().toISOString(),
        aggregatesRebuilt: 1,
      });
    }),

    // PUT update meter
    http.put(`${baseUrl}/meters/:id`, async ({ params, request }) => {
      const id = params.id as string;
      const body = (await request.json()) as Partial<MeterDefinitionResponse>;
      const existing = meters.find((m) => m.id === id);
      if (!existing) return notFound();

      const updated: MeterDefinitionResponse = {
        ...existing,
        ...body,
        id: toEntityId<'MeterDefinition'>(id),
      };
      meters = meters.map((m) => (m.id === id ? updated : m));
      return HttpResponse.json(updated);
    }),

    // POST deactivate (deprecated alias — backend keeps it for one release;
    // mirrors the legacy behavior so existing integration tests keep passing).
    http.post(`${baseUrl}/meters/:id/deactivate`, ({ params }) => {
      const id = params.id as string;
      const existing = meters.find((m) => m.id === id);
      if (!existing) return notFound();
      meters = meters.map((m) =>
        m.id === id ? { ...m, activated: false, lifecycleStatus: 'Archived' } : m
      );
      return noContent();
    }),

    // GET usage aggregate for a meter
    http.get(`${baseUrl}/usage/:id`, ({ params }) => {
      const usage = {
        ...sampleUsage,
        meterDefinitionId: toEntityId<'MeterDefinition'>(params.id as string),
      };
      return HttpResponse.json(usage);
    }),

    // GET quota status for a meter
    http.get(`${baseUrl}/quota/:id`, () => {
      return HttpResponse.json({ ...sampleQuota });
    }),

    // POST record usage events
    http.post(`${baseUrl}/events`, async ({ request }) => {
      await request.json();
      return HttpResponse.json({ recorded: true }, { status: 201 });
    }),
  ];
}
