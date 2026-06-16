import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  archiveMeterDefinition,
  backfillUsageEvents,
  checkMeteringQuota,
  createMeterDefinition,
  deprecateMeterEvent,
  getMeterDefinition,
  getMeterDefinitionsQueryMeta,
  getUsageAggregatesQueryMeta,
  getUsageForPeriod,
  listActiveMeters,
  listMeterDefinitions,
  listUsageAggregates,
  publishMeterDefinition,
  recomputeMeterUsage,
  recordUsageEvents,
  updateMeterDefinition,
} from '../api/metering-api';

import type {
  MeterDefinition,
  MeterDefinitionCreateRequest,
  MeterDefinitionResponse,
  MeterDefinitionUpdateRequest,
  MeteringQuotaStatusResponse,
  RecordUsageRequest,
  UsageAggregate,
  UsageAggregateResponse,
} from '../types/index';
import type { QueryMetadata } from '@granit/query-engine';
import type { ISODateString, TenantId } from '@granit/types';

const basePath = '/metering';

const sampleMeter: MeterDefinitionResponse = {
  id: 'meter-1',
  name: 'API Calls',
  unit: 'calls',
  description: 'Number of API calls',
  aggregationType: 'Sum',
  productId: null,
  lifecycleStatus: 'Published',
  distinctProperty: null,
};

const sampleUsage: UsageAggregateResponse = {
  id: 'agg-1',
  meterDefinitionId: 'meter-1',
  period: 'Daily',
  periodStart: toISODateString('2026-04-01T00:00:00Z'),
  periodEnd: toISODateString('2026-04-02T00:00:00Z'),
  aggregatedValue: 150,
  eventCount: 30,
};

const sampleQuota: MeteringQuotaStatusResponse = {
  meterName: 'API Calls',
  currentUsage: 150,
  limit: 1000,
  percentUsed: 15,
  isExceeded: false,
};

describe('metering-api', () => {
  describe('listActiveMeters', () => {
    it('should GET {basePath}/meters/active and return the array', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleMeter] });

      const result = await listActiveMeters(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/metering/meters/active');
      expect(result).toEqual([sampleMeter]);
    });
  });

  describe('getMeterDefinition', () => {
    it('should GET {basePath}/meters/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeter });

      const result = await getMeterDefinition(client, basePath, 'meter-1');

      expect(client.get).toHaveBeenCalledWith('/metering/meters/meter-1');
      expect(result).toEqual(sampleMeter);
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeter });

      await getMeterDefinition(client, basePath, 'meter/special');

      expect(client.get).toHaveBeenCalledWith('/metering/meters/meter%2Fspecial');
    });
  });

  describe('createMeterDefinition', () => {
    it('should POST {basePath}/meters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleMeter });

      const request: MeterDefinitionCreateRequest = {
        name: 'API Calls',
        unit: 'calls',
        aggregationType: 'Sum',
        description: 'Number of API calls',
      };

      const result = await createMeterDefinition(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/metering/meters', request);
      expect(result).toEqual(sampleMeter);
    });

    it('should carry productId and distinctProperty for a CountDistinct meter', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleMeter });

      const request: MeterDefinitionCreateRequest = {
        name: 'Monthly Active Users',
        unit: 'users',
        aggregationType: 'CountDistinct',
        description: null,
        productId: 'prod-1',
        distinctProperty: 'user_id',
      };

      await createMeterDefinition(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/metering/meters', request);
    });
  });

  describe('updateMeterDefinition', () => {
    it('should PUT {basePath}/meters/{id}', async () => {
      const client = createMockClient();
      const updated = { ...sampleMeter, name: 'Updated Meter' };
      vi.mocked(client.put).mockResolvedValue({ data: updated });

      const request: MeterDefinitionUpdateRequest = {
        name: 'Updated Meter',
        unit: 'calls',
        description: null,
      };

      const result = await updateMeterDefinition(client, basePath, 'meter-1', request);

      expect(client.put).toHaveBeenCalledWith('/metering/meters/meter-1', request);
      expect(result).toEqual(updated);
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleMeter });

      const request: MeterDefinitionUpdateRequest = {
        name: 'Meter',
        unit: 'calls',
        description: null,
      };

      await updateMeterDefinition(client, basePath, 'meter/special', request);

      expect(client.put).toHaveBeenCalledWith('/metering/meters/meter%2Fspecial', request);
    });
  });

  describe('publishMeterDefinition', () => {
    it('should POST {basePath}/meters/{id}/publish', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await publishMeterDefinition(client, basePath, 'meter-1');

      expect(client.post).toHaveBeenCalledWith('/metering/meters/meter-1/publish');
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await publishMeterDefinition(client, basePath, 'meter/special');

      expect(client.post).toHaveBeenCalledWith('/metering/meters/meter%2Fspecial/publish');
    });
  });

  describe('archiveMeterDefinition', () => {
    it('should POST {basePath}/meters/{id}/archive', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await archiveMeterDefinition(client, basePath, 'meter-1');

      expect(client.post).toHaveBeenCalledWith('/metering/meters/meter-1/archive');
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await archiveMeterDefinition(client, basePath, 'meter/special');

      expect(client.post).toHaveBeenCalledWith('/metering/meters/meter%2Fspecial/archive');
    });
  });

  describe('recomputeMeterUsage', () => {
    it('should POST {basePath}/meters/{id}/recompute with the window', async () => {
      const client = createMockClient();
      const response = {
        meterDefinitionId: 'meter-1',
        windowStart: toISODateString('2026-04-01T00:00:00Z'),
        windowEnd: toISODateString('2026-04-30T00:00:00Z'),
        eventsScanned: 1200,
        aggregatesRebuilt: 30,
        durationMilliseconds: 84,
      };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const request = { from: '2026-04-01T00:00:00Z', to: '2026-04-30T00:00:00Z' };
      const result = await recomputeMeterUsage(client, basePath, 'meter-1', request);

      expect(client.post).toHaveBeenCalledWith('/metering/meters/meter-1/recompute', request);
      expect(result).toEqual(response);
    });
  });

  describe('getUsageForPeriod', () => {
    it('should GET {basePath}/usage with the meterId and period bounds', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleUsage });

      const result = await getUsageForPeriod(
        client,
        basePath,
        'meter-1',
        '2026-04-01T00:00:00Z',
        '2026-05-01T00:00:00Z'
      );

      expect(client.get).toHaveBeenCalledWith('/metering/usage', {
        params: {
          meterId: 'meter-1',
          periodStart: toISODateString('2026-04-01T00:00:00Z'),
          periodEnd: toISODateString('2026-05-01T00:00:00Z'),
        },
      });
      expect(result).toEqual(sampleUsage);
    });
  });

  describe('checkMeteringQuota', () => {
    it('should GET {basePath}/quota/{meterId}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleQuota });

      const result = await checkMeteringQuota(client, basePath, 'meter-1');

      expect(client.get).toHaveBeenCalledWith('/metering/quota/meter-1');
      expect(result).toEqual(sampleQuota);
    });

    it('should encode the meterId', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleQuota });

      await checkMeteringQuota(client, basePath, 'meter/special');

      expect(client.get).toHaveBeenCalledWith('/metering/quota/meter%2Fspecial');
    });
  });

  describe('recordUsageEvents', () => {
    const request: RecordUsageRequest = {
      events: [
        {
          meterDefinitionId: 'meter-1',
          idempotencyKey: 'key-1',
          quantity: 1,
          timestamp: '2026-04-04T12:00:00Z',
          metadata: null,
        },
      ],
    };

    it('should POST {basePath}/events without a header when no key is supplied', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await recordUsageEvents(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/metering/events', request, undefined);
    });

    it('should send the Idempotency-Key header when supplied', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await recordUsageEvents(client, basePath, request, 'batch-key-1');

      expect(client.post).toHaveBeenCalledWith('/metering/events', request, {
        headers: { 'Idempotency-Key': 'batch-key-1' },
      });
    });
  });

  describe('backfillUsageEvents', () => {
    it('should POST {basePath}/events/backfill', async () => {
      const client = createMockClient();
      const response = { eventsAccepted: 2, metersAffected: 1, aggregatesRebuilt: 3 };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const request = {
        events: [
          {
            meterDefinitionId: 'meter-1',
            idempotencyKey: 'key-1',
            quantity: 5,
            timestamp: '2026-01-04T12:00:00Z',
            metadata: null,
          },
        ],
      };

      const result = await backfillUsageEvents(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/metering/events/backfill', request, undefined);
      expect(result).toEqual(response);
    });
  });

  describe('deprecateMeterEvent', () => {
    it('should POST {basePath}/events/{id}/deprecate', async () => {
      const client = createMockClient();
      const response = {
        eventId: 'evt-1',
        meterDefinitionId: 'meter-1',
        deprecatedAt: toISODateString('2026-04-04T12:00:00Z'),
        aggregatesRebuilt: 1,
      };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const request = { reason: 'Duplicate ingestion' };
      const result = await deprecateMeterEvent(client, basePath, 'evt-1', request);

      expect(client.post).toHaveBeenCalledWith('/metering/events/evt-1/deprecate', request);
      expect(result).toEqual(response);
    });
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleMeter] });

    await listActiveMeters(client, '/custom/metering');

    expect(client.get).toHaveBeenCalledWith('/custom/metering/meters/active');
  });
});

// ---------------------------------------------------------------------------
// QueryEngine wrappers
// ---------------------------------------------------------------------------

const sampleMeterDefinition: MeterDefinition = {
  id: 'md-1',
  tenantId: 'tenant-1' as TenantId,
  name: 'API Calls',
  unit: 'calls',
  description: null,
  aggregationType: 'Sum',
  distinctProperty: null,
  lifecycleStatus: 'Published',
  productId: null,
  createdAt: toISODateString('2026-04-01T00:00:00Z') as ISODateString,
  createdBy: 'user-1',
  modifiedAt: null,
  modifiedBy: null,
};

const sampleUsageAggregate: UsageAggregate = {
  id: 'ua-1',
  tenantId: 'tenant-1' as TenantId,
  meterDefinitionId: 'md-1',
  period: 'Daily',
  periodStart: toISODateString('2026-04-01T00:00:00Z') as ISODateString,
  periodEnd: toISODateString('2026-04-02T00:00:00Z') as ISODateString,
  aggregatedValue: 150,
  eventCount: 30,
};

const sampleMeta: QueryMetadata = {
  columns: [],
  filterableFields: [],
} as unknown as QueryMetadata;

describe('metering-api / QueryEngine — meter definitions', () => {
  describe('listMeterDefinitions', () => {
    it('should GET {basePath}/meters with serialized params', async () => {
      const client = createMockClient();
      const page = { items: [sampleMeterDefinition], totalCount: 1 };
      vi.mocked(client.get).mockResolvedValue({ data: page });

      const result = await listMeterDefinitions(client, basePath, {
        page: 1,
        pageSize: 25,
      });

      expect(client.get).toHaveBeenCalledTimes(1);
      const url = vi.mocked(client.get).mock.calls[0]?.[0] as string;
      expect(url).toContain('/metering/meters');
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=25');
      expect(result).toEqual(page);
    });

    it('should GET {basePath}/meters with no query string when params omitted', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0 } });

      await listMeterDefinitions(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/metering/meters', undefined);
    });
  });

  describe('getMeterDefinitionsQueryMeta', () => {
    it('should GET {basePath}/meters/meta', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeta });

      const result = await getMeterDefinitionsQueryMeta(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/metering/meters/meta', undefined);
      expect(result).toEqual(sampleMeta);
    });
  });
});

describe('metering-api / QueryEngine — usage aggregates', () => {
  describe('listUsageAggregates', () => {
    it('should GET {basePath}/usage-aggregates with serialized params', async () => {
      const client = createMockClient();
      const page = { items: [sampleUsageAggregate], totalCount: 1 };
      vi.mocked(client.get).mockResolvedValue({ data: page });

      const result = await listUsageAggregates(client, basePath, {
        page: 1,
        pageSize: 25,
        sort: [{ field: 'periodStart', direction: 'desc' }],
      });

      expect(client.get).toHaveBeenCalledTimes(1);
      const url = vi.mocked(client.get).mock.calls[0]?.[0] as string;
      expect(url).toContain('/metering/usage-aggregates');
      expect(url).toContain('sort=-periodStart');
      expect(result).toEqual(page);
    });

    it('should GET {basePath}/usage-aggregates with no query string when params omitted', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0 } });

      await listUsageAggregates(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/metering/usage-aggregates', undefined);
    });
  });

  describe('getUsageAggregatesQueryMeta', () => {
    it('should GET {basePath}/usage-aggregates/meta', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeta });

      const result = await getUsageAggregatesQueryMeta(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/metering/usage-aggregates/meta', undefined);
      expect(result).toEqual(sampleMeta);
    });
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0 } });

    await listUsageAggregates(client, '/custom/metering');

    expect(client.get).toHaveBeenCalledWith('/custom/metering/usage-aggregates', undefined);
  });
});
