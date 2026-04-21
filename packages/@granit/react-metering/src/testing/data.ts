import { toEntityId, toISODateString } from '@granit/types';

import type {
  MeterDefinitionResponse,
  MeteringQuotaStatusResponse,
  UsageAggregateResponse,
} from '@granit/metering';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export const sampleMeters: Mutable<MeterDefinitionResponse>[] = [
  {
    id: toEntityId<'MeterDefinition'>('mtr_001'),
    name: 'API Calls',
    description: 'Track API call usage per tenant',
    aggregationType: 'Count',
    unit: 'calls',
    activated: true,
  },
  {
    id: toEntityId<'MeterDefinition'>('mtr_002'),
    name: 'Storage Usage',
    description: 'Track storage consumption in bytes',
    aggregationType: 'Sum',
    unit: 'bytes',
    activated: true,
  },
  {
    id: toEntityId<'MeterDefinition'>('mtr_003'),
    name: 'Compute Minutes',
    description: 'Track compute time usage',
    aggregationType: 'Sum',
    unit: 'minutes',
    activated: true,
  },
];

export const sampleUsage: Mutable<UsageAggregateResponse> = {
  id: toEntityId<'UsageAggregate'>('usage_001'),
  meterDefinitionId: toEntityId<'MeterDefinition'>('mtr_001'),
  period: 'BillingPeriod',
  periodStart: toISODateString('2026-04-01T00:00:00Z'),
  periodEnd: toISODateString('2026-04-30T23:59:59Z'),
  aggregatedValue: 45230,
  eventCount: 45230,
};

export const sampleQuota: Mutable<MeteringQuotaStatusResponse> = {
  meterName: 'API Calls',
  currentUsage: 45230,
  limit: 50000,
  percentUsed: 90.46,
  isExceeded: false,
};
