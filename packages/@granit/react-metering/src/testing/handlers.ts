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
      return HttpResponse.json(meters.filter((m) => m.isActive));
    }),

    // GET single meter by ID
    http.get(`${baseUrl}/meters/:id`, ({ params }) => {
      const meter = meters.find((m) => m.id === params.id);
      if (!meter) return notFound();
      return HttpResponse.json(meter);
    }),

    // POST create meter
    http.post(`${baseUrl}/meters`, async ({ request }) => {
      const body = (await request.json()) as Partial<MeterDefinitionResponse>;
      const newMeter: MeterDefinitionResponse = {
        id: toEntityId<'MeterDefinition'>(`mtr_${String(meters.length + 1).padStart(3, '0')}`),
        name: body.name ?? '',
        description: body.description ?? '',
        aggregationType: body.aggregationType ?? 'Count',
        unit: body.unit ?? '',
        isActive: true,
      };
      meters = [...meters, newMeter];
      return HttpResponse.json(newMeter, { status: 201 });
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

    // DELETE deactivate meter
    http.delete(`${baseUrl}/meters/:id`, ({ params }) => {
      const id = params.id as string;
      const index = meters.findIndex((m) => m.id === id);
      if (index === -1) return notFound();

      meters = meters.map((m) => (m.id === id ? { ...m, isActive: false } : m));
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
