import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  sampleMeterDefinitions,
  sampleMeters,
  sampleQuota,
  sampleUsage,
  sampleUsageAggregates,
} from './data';

import type { MeterDefinitionResponse } from '@granit/metering';
import type { QueryMetadata } from '@granit/query-engine';

const AGGREGATION_TYPES = ['Sum', 'Max', 'Count', 'Last', 'CountDistinct'];
const LIFECYCLE_STATES = ['Draft', 'Published', 'Archived'];
const AGGREGATION_PERIODS = ['Hourly', 'Daily', 'BillingPeriod'];

/** Mock /meta payload for the meter admin grid (`GET /meters`). */
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
      name: 'lifecycleStatus',
      label: 'Status',
      type: 'String',
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
    {
      name: 'lifecycleStatus',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: LIFECYCLE_STATES,
    },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'modifiedAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'name' },
    { name: 'unit' },
    { name: 'aggregationType' },
    { name: 'lifecycleStatus' },
    { name: 'createdAt' },
    { name: 'modifiedAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'published', label: 'Published', isDefault: true },
    { name: 'draft', label: 'Draft', isDefault: false },
    { name: 'archived', label: 'Archived', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [
    { name: 'aggregationType', type: 'String' },
    { name: 'lifecycleStatus', type: 'String' },
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

/** Mock /meta payload for the usage-aggregate admin grid. */
export const usageAggregateQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'meterDefinitionId',
      label: 'Meter',
      type: 'Guid',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'period',
      label: 'Period',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'periodStart',
      label: 'Period start',
      type: 'DateTime',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'periodEnd',
      label: 'Period end',
      type: 'DateTime',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'aggregatedValue',
      label: 'Value',
      type: 'Decimal',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'eventCount',
      label: 'Events',
      type: 'Int64',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 6,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'meterDefinitionId', type: 'Guid', operators: ENUM_OPERATORS },
    {
      name: 'period',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: AGGREGATION_PERIODS,
    },
    { name: 'periodStart', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'periodEnd', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'aggregatedValue', type: 'Decimal', operators: NUMBER_OPERATORS },
    { name: 'eventCount', type: 'Int64', operators: NUMBER_OPERATORS },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
  ],
  sortableFields: [
    { name: 'meterDefinitionId' },
    { name: 'period' },
    { name: 'periodStart' },
    { name: 'periodEnd' },
    { name: 'aggregatedValue' },
    { name: 'eventCount' },
  ],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [
    { name: 'meterDefinitionId', type: 'Guid' },
    { name: 'period', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-periodStart',
};

/**
 * Create stateful MSW handlers for metering endpoints.
 * Meter mutations (create / update / publish / archive) persist in the
 * in-memory list.
 *
 * @param baseUrl - API base path (default: `/api/v1/metering`)
 */
export function createMeteringHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let meters = [...sampleMeters];

  return [
    // GET /meters/meta — QueryEngine metadata (registered before /meters/:id)
    createQueryMetaHandler(`${baseUrl}/meters`, meterQueryMetadata),

    // GET /meters/active — Published catalog (plain array, no envelope)
    http.get(`${baseUrl}/meters/active`, () => {
      const active = meters.filter((m) => m.lifecycleStatus === 'Published');
      return HttpResponse.json(active);
    }),

    // GET /meters — QueryEngine admin grid (paged)
    http.get(`${baseUrl}/meters`, () => {
      return HttpResponse.json({
        items: sampleMeterDefinitions,
        totalCount: sampleMeterDefinitions.length,
      });
    }),

    // GET /meters/:id — single meter
    http.get(`${baseUrl}/meters/:id`, ({ params }) => {
      const meter = meters.find((m) => m.id === params.id);
      if (!meter) return notFound();
      return HttpResponse.json(meter);
    }),

    // POST /meters — create (starts in Draft)
    http.post(`${baseUrl}/meters`, async ({ request }) => {
      const body = (await request.json()) as Partial<MeterDefinitionResponse>;
      const newMeter: MeterDefinitionResponse = {
        id: toEntityId<'MeterDefinition'>(`mtr_${String(meters.length + 1).padStart(3, '0')}`),
        name: body.name ?? '',
        description: body.description ?? null,
        aggregationType: body.aggregationType ?? 'Count',
        unit: body.unit ?? '',
        productId: body.productId ?? null,
        lifecycleStatus: 'Draft',
        distinctProperty: body.distinctProperty ?? null,
      };
      meters = [...meters, newMeter];
      return HttpResponse.json(newMeter, { status: 201 });
    }),

    // PUT /meters/:id — update editable fields
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

    // POST /meters/:id/publish — Draft → Published
    http.post(`${baseUrl}/meters/:id/publish`, ({ params }) => {
      const id = params.id as string;
      const existing = meters.find((m) => m.id === id);
      if (!existing) return notFound();
      meters = meters.map((m) => (m.id === id ? { ...m, lifecycleStatus: 'Published' } : m));
      return noContent();
    }),

    // POST /meters/:id/archive — Published → Archived
    http.post(`${baseUrl}/meters/:id/archive`, ({ params }) => {
      const id = params.id as string;
      const existing = meters.find((m) => m.id === id);
      if (!existing) return notFound();
      meters = meters.map((m) => (m.id === id ? { ...m, lifecycleStatus: 'Archived' } : m));
      return noContent();
    }),

    // GET /usage?meterId&periodStart&periodEnd — single aggregate
    http.get(`${baseUrl}/usage`, ({ request }) => {
      const meterId = new URL(request.url).searchParams.get('meterId');
      return HttpResponse.json({
        ...sampleUsage,
        meterDefinitionId: toEntityId<'MeterDefinition'>(meterId ?? sampleUsage.meterDefinitionId),
      });
    }),

    // GET /quota/:meterId — quota status
    http.get(`${baseUrl}/quota/:meterId`, () => {
      return HttpResponse.json({ ...sampleQuota });
    }),

    // POST /events — record usage events
    http.post(`${baseUrl}/events`, async ({ request }) => {
      await request.json();
      return noContent();
    }),

    // GET /usage-aggregates/meta — QueryEngine metadata
    createQueryMetaHandler(`${baseUrl}/usage-aggregates`, usageAggregateQueryMetadata),

    // GET /usage-aggregates — QueryEngine admin grid (paged)
    http.get(`${baseUrl}/usage-aggregates`, () => {
      return HttpResponse.json({
        items: sampleUsageAggregates,
        totalCount: sampleUsageAggregates.length,
      });
    }),
  ];
}
