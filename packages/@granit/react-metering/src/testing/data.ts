import { toEntityId, toISODateString } from '@granit/types';

import type {
  MeterDefinition,
  MeterDefinitionResponse,
  MeteringQuotaStatusResponse,
  UsageAggregate,
  UsageAggregateResponse,
} from '@granit/metering';
import type { Mutable } from '@granit/testing';
import type { TenantId } from '@granit/types';

const TENANT_ID = toEntityId<'Tenant'>('tnt_001') as unknown as TenantId;

export const sampleMeters: Mutable<MeterDefinitionResponse>[] = [
  {
    id: toEntityId<'MeterDefinition'>('mtr_001'),
    name: 'API Calls',
    description: 'Track API call usage per tenant',
    aggregationType: 'Count',
    unit: 'calls',
    productId: null,
    lifecycleStatus: 'Published',
    distinctProperty: null,
  },
  {
    id: toEntityId<'MeterDefinition'>('mtr_002'),
    name: 'Storage Usage',
    description: 'Track storage consumption in bytes',
    aggregationType: 'Sum',
    unit: 'bytes',
    productId: null,
    lifecycleStatus: 'Published',
    distinctProperty: null,
  },
  {
    id: toEntityId<'MeterDefinition'>('mtr_003'),
    name: 'Monthly Active Users',
    description: 'Distinct users seen in the billing period',
    aggregationType: 'CountDistinct',
    unit: 'users',
    productId: null,
    lifecycleStatus: 'Draft',
    distinctProperty: 'user_id',
  },
];

/** QueryEngine entity rows for the meter admin grid (`GET /meters`). */
export const sampleMeterDefinitions: Mutable<MeterDefinition>[] = sampleMeters.map((m) => ({
  id: m.id,
  tenantId: TENANT_ID,
  name: m.name,
  unit: m.unit,
  description: m.description,
  aggregationType: m.aggregationType,
  distinctProperty: m.distinctProperty,
  lifecycleStatus: m.lifecycleStatus,
  productId: m.productId,
  createdAt: toISODateString('2026-04-01T00:00:00Z'),
  createdBy: 'usr_seed',
  modifiedAt: null,
  modifiedBy: null,
}));

export const sampleUsage: Mutable<UsageAggregateResponse> = {
  id: toEntityId<'UsageAggregate'>('usage_001'),
  meterDefinitionId: toEntityId<'MeterDefinition'>('mtr_001'),
  period: 'BillingPeriod',
  periodStart: toISODateString('2026-04-01T00:00:00Z'),
  periodEnd: toISODateString('2026-04-30T23:59:59Z'),
  aggregatedValue: 45230,
  eventCount: 45230,
};

/** QueryEngine entity rows for the usage-aggregate admin grid. */
export const sampleUsageAggregates: Mutable<UsageAggregate>[] = [
  {
    id: toEntityId<'UsageAggregate'>('usage_001'),
    tenantId: TENANT_ID,
    meterDefinitionId: toEntityId<'MeterDefinition'>('mtr_001'),
    period: 'Daily',
    periodStart: toISODateString('2026-04-01T00:00:00Z'),
    periodEnd: toISODateString('2026-04-02T00:00:00Z'),
    aggregatedValue: 1820,
    eventCount: 1820,
  },
  {
    id: toEntityId<'UsageAggregate'>('usage_002'),
    tenantId: TENANT_ID,
    meterDefinitionId: toEntityId<'MeterDefinition'>('mtr_002'),
    period: 'BillingPeriod',
    periodStart: toISODateString('2026-04-01T00:00:00Z'),
    periodEnd: toISODateString('2026-04-30T23:59:59Z'),
    aggregatedValue: 1_073_741_824,
    eventCount: 512,
  },
];

export const sampleQuota: Mutable<MeteringQuotaStatusResponse> = {
  meterName: 'API Calls',
  currentUsage: 45230,
  limit: 50000,
  percentUsed: 90.46,
  isExceeded: false,
};
