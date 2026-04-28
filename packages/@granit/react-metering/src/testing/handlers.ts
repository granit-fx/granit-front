import {
  BOOLEAN_OPERATORS,
  DATE_OPERATORS,
  ENUM_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { sampleMeters, sampleQuota, sampleUsage } from './data.js';

import type { MeterDefinitionResponse } from '@granit/metering';
import type { QueryMetadata } from '@granit/query-engine';

const AGGREGATION_TYPES = ['Sum', 'Count', 'Max', 'Last'];

/** Mock /meta payload for the meters resource. */
export const meterQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'unit',
      label: 'Unit',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'aggregationType',
      label: 'Aggregation',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'activated',
      label: 'Active',
      type: 'Boolean',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'modifiedAt',
      label: 'Modified at',
      type: 'DateTime',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: STRING_OPERATORS },
    { name: 'unit', type: 'String', operators: STRING_OPERATORS },
    {
      name: 'aggregationType',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: AGGREGATION_TYPES,
    },
    { name: 'activated', type: 'Boolean', operators: BOOLEAN_OPERATORS },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'modifiedAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'name' },
    { name: 'unit' },
    { name: 'aggregationType' },
    { name: 'activated' },
    { name: 'createdAt' },
    { name: 'modifiedAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'active', label: 'Active', isDefault: true },
    { name: 'inactive', label: 'Inactive', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [
    { name: 'aggregationType', type: 'String' },
    { name: 'unit', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
};

/**
 * Create stateful MSW handlers for metering endpoints.
 * Meter mutations (create/update/deactivate) persist in the in-memory list.
 *
 * @param baseUrl - API base path (default: `/api/v1/metering`)
 */
export function createMeteringHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let meters = [...sampleMeters];

  return [
    // GET /meters/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/meters`, meterQueryMetadata),

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

    // POST create meter
    http.post(`${baseUrl}/meters`, async ({ request }) => {
      const body = (await request.json()) as Partial<MeterDefinitionResponse>;
      const newMeter: MeterDefinitionResponse = {
        id: toEntityId<'MeterDefinition'>(`mtr_${String(meters.length + 1).padStart(3, '0')}`),
        name: body.name ?? '',
        description: body.description ?? '',
        aggregationType: body.aggregationType ?? 'Count',
        unit: body.unit ?? '',
        activated: true,
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

      meters = meters.map((m) => (m.id === id ? { ...m, activated: false } : m));
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
