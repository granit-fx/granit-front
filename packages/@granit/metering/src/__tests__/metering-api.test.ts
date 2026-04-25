import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  archiveMeterDefinition,
  backfillUsageEvents,
  checkMeteringQuota,
  createMeterDefinition,
  createMeterDefinitionsSavedView,
  createUsageAggregatesSavedView,
  deactivateMeterDefinition,
  deleteMeterDefinitionsSavedView,
  deleteUsageAggregatesSavedView,
  deprecateMeterEvent,
  getMeterDefinition,
  getMeterDefinitionsQueryMeta,
  getUsageAggregatesQueryMeta,
  getUsageForPeriod,
  listActiveMeters,
  listMeterDefinitions,
  listMeterDefinitionsSavedViews,
  listUsageAggregates,
  listUsageAggregatesSavedViews,
  publishMeterDefinition,
  recomputeMeterUsage,
  recordUsageEvents,
  setDefaultMeterDefinitionsSavedView,
  setDefaultUsageAggregatesSavedView,
  updateMeterDefinition,
  updateMeterDefinitionsSavedView,
  updateUsageAggregatesSavedView,
} from '../api/metering-api.js';

import type {
  MeterDefinition,
  MeterDefinitionCreateRequest,
  MeterDefinitionResponse,
  MeterDefinitionUpdateRequest,
  MeteringQuotaStatusResponse,
  RecordUsageRequest,
  UsageAggregate,
  UsageAggregateResponse,
} from '../types.js';
import type {
  CreateSavedViewRequest,
  QueryMetadata,
  SavedViewSummary,
  UpdateSavedViewRequest,
} from '@granit/query-engine';
import type { ISODateString, TenantId } from '@granit/types';

const basePath = '/api/granit/metering';

const sampleMeter: MeterDefinitionResponse = {
  id: 'meter-1',
  name: 'API Calls',
  unit: 'calls',
  description: 'Number of API calls',
  aggregationType: 'Sum',
  activated: true,
  productId: null,
  lifecycleStatus: 'Published',
  distinctProperty: null,
};

const sampleUsage: UsageAggregateResponse = {
  id: 'agg-1',
  meterDefinitionId: 'meter-1',
  period: 'Daily',
  periodStart: '2026-04-01T00:00:00Z',
  periodEnd: '2026-04-02T00:00:00Z',
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
    it('should GET {basePath}/meters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleMeter] });

      const result = await listActiveMeters(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/meters');
      expect(result).toEqual([sampleMeter]);
    });
  });

  describe('getMeterDefinition', () => {
    it('should GET {basePath}/meters/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeter });

      const result = await getMeterDefinition(client, basePath, 'meter-1');

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/meters/meter-1');
      expect(result).toEqual(sampleMeter);
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeter });

      await getMeterDefinition(client, basePath, 'meter/special');

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/meters/meter%2Fspecial');
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

      expect(client.post).toHaveBeenCalledWith('/api/granit/metering/meters', request);
      expect(result).toEqual(sampleMeter);
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

      expect(client.put).toHaveBeenCalledWith('/api/granit/metering/meters/meter-1', request);
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

      expect(client.put).toHaveBeenCalledWith(
        '/api/granit/metering/meters/meter%2Fspecial',
        request
      );
    });
  });

  describe('deactivateMeterDefinition', () => {
    it('should POST {basePath}/meters/{id}/deactivate', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await deactivateMeterDefinition(client, basePath, 'meter-1');

      expect(client.post).toHaveBeenCalledWith('/api/granit/metering/meters/meter-1/deactivate');
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await deactivateMeterDefinition(client, basePath, 'meter/special');

      expect(client.post).toHaveBeenCalledWith(
        '/api/granit/metering/meters/meter%2Fspecial/deactivate'
      );
    });
  });

  describe('getUsageForPeriod', () => {
    it('should GET {basePath}/usage', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleUsage] });

      const result = await getUsageForPeriod(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/usage');
      expect(result).toEqual([sampleUsage]);
    });
  });

  describe('checkMeteringQuota', () => {
    it('should GET {basePath}/quota/{meterId}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleQuota });

      const result = await checkMeteringQuota(client, basePath, 'meter-1');

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/quota/meter-1');
      expect(result).toEqual(sampleQuota);
    });

    it('should encode the meterId', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleQuota });

      await checkMeteringQuota(client, basePath, 'meter/special');

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/quota/meter%2Fspecial');
    });
  });

  describe('recordUsageEvents', () => {
    it('should POST {basePath}/events', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

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

      await recordUsageEvents(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/api/granit/metering/events', request);
    });
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleMeter] });

    await listActiveMeters(client, '/custom/metering');

    expect(client.get).toHaveBeenCalledWith('/custom/metering/meters');
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
  aggregationType: 'Sum',
  activated: true,
  lifecycleStatus: 'Published',
  distinctProperty: null,
  productId: null,
  createdAt: '2026-04-01T00:00:00Z' as ISODateString,
  modifiedAt: '2026-04-01T00:00:00Z' as ISODateString,
};

const sampleUsageAggregate: UsageAggregate = {
  id: 'ua-1',
  tenantId: 'tenant-1' as TenantId,
  meterDefinitionId: 'md-1',
  period: 'Daily',
  periodStart: '2026-04-01T00:00:00Z' as ISODateString,
  periodEnd: '2026-04-02T00:00:00Z' as ISODateString,
  aggregatedValue: 150,
  eventCount: 30,
};

const sampleSavedView: SavedViewSummary = {
  id: 'sv-1',
  name: 'My view',
  isShared: false,
  isDefault: false,
};

const sampleMeta: QueryMetadata = {
  columns: [],
  filterableFields: [],
} as unknown as QueryMetadata;

describe('metering-api / QueryEngine — meter definitions', () => {
  describe('listMeterDefinitions', () => {
    it('should GET {basePath}/meter-definitions with serialized params', async () => {
      const client = createMockClient();
      const page = { items: [sampleMeterDefinition], totalCount: 1 };
      vi.mocked(client.get).mockResolvedValue({ data: page });

      const result = await listMeterDefinitions(client, basePath, {
        page: 1,
        pageSize: 25,
      });

      expect(client.get).toHaveBeenCalledTimes(1);
      const url = vi.mocked(client.get).mock.calls[0]?.[0] as string;
      expect(url).toContain('/api/granit/metering/meter-definitions');
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=25');
      expect(result).toEqual(page);
    });

    it('should GET {basePath}/meter-definitions with no query string when params omitted', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0 } });

      await listMeterDefinitions(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/meter-definitions');
    });
  });

  describe('getMeterDefinitionsQueryMeta', () => {
    it('should GET {basePath}/meter-definitions/meta', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeta });

      const result = await getMeterDefinitionsQueryMeta(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/meter-definitions/meta');
      expect(result).toEqual(sampleMeta);
    });
  });

  describe('listMeterDefinitionsSavedViews', () => {
    it('should GET {basePath}/meter-definitions/saved-views', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleSavedView] });

      const result = await listMeterDefinitionsSavedViews(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/meter-definitions/saved-views');
      expect(result).toEqual([sampleSavedView]);
    });
  });

  describe('createMeterDefinitionsSavedView', () => {
    it('should POST {basePath}/meter-definitions/saved-views', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleSavedView });
      const request: CreateSavedViewRequest = {
        name: 'My view',
        isShared: false,
        isDefault: false,
      };

      const result = await createMeterDefinitionsSavedView(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(
        '/api/granit/metering/meter-definitions/saved-views',
        request
      );
      expect(result).toEqual(sampleSavedView);
    });
  });

  describe('updateMeterDefinitionsSavedView', () => {
    it('should PUT {basePath}/meter-definitions/saved-views/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: undefined });
      const request: UpdateSavedViewRequest = {
        name: 'Renamed',
        isShared: true,
      };

      await updateMeterDefinitionsSavedView(client, basePath, 'sv-1', request);

      expect(client.put).toHaveBeenCalledWith(
        '/api/granit/metering/meter-definitions/saved-views/sv-1',
        request
      );
    });
  });

  describe('deleteMeterDefinitionsSavedView', () => {
    it('should DELETE {basePath}/meter-definitions/saved-views/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await deleteMeterDefinitionsSavedView(client, basePath, 'sv-1');

      expect(client.delete).toHaveBeenCalledWith(
        '/api/granit/metering/meter-definitions/saved-views/sv-1'
      );
    });
  });

  describe('setDefaultMeterDefinitionsSavedView', () => {
    it('should POST {basePath}/meter-definitions/saved-views/{id}/set-default', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await setDefaultMeterDefinitionsSavedView(client, basePath, 'sv-1');

      expect(client.post).toHaveBeenCalledWith(
        '/api/granit/metering/meter-definitions/saved-views/sv-1/set-default'
      );
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
      expect(url).toContain('/api/granit/metering/usage-aggregates');
      expect(url).toContain('sort=-periodStart');
      expect(result).toEqual(page);
    });

    it('should GET {basePath}/usage-aggregates with no query string when params omitted', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0 } });

      await listUsageAggregates(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/usage-aggregates');
    });
  });

  describe('getUsageAggregatesQueryMeta', () => {
    it('should GET {basePath}/usage-aggregates/meta', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeta });

      const result = await getUsageAggregatesQueryMeta(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/usage-aggregates/meta');
      expect(result).toEqual(sampleMeta);
    });
  });

  describe('listUsageAggregatesSavedViews', () => {
    it('should GET {basePath}/usage-aggregates/saved-views', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleSavedView] });

      const result = await listUsageAggregatesSavedViews(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/metering/usage-aggregates/saved-views');
      expect(result).toEqual([sampleSavedView]);
    });
  });

  describe('createUsageAggregatesSavedView', () => {
    it('should POST {basePath}/usage-aggregates/saved-views', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleSavedView });
      const request: CreateSavedViewRequest = {
        name: 'My view',
        isShared: false,
        isDefault: false,
      };

      const result = await createUsageAggregatesSavedView(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(
        '/api/granit/metering/usage-aggregates/saved-views',
        request
      );
      expect(result).toEqual(sampleSavedView);
    });
  });

  describe('updateUsageAggregatesSavedView', () => {
    it('should PUT {basePath}/usage-aggregates/saved-views/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: undefined });
      const request: UpdateSavedViewRequest = {
        name: 'Renamed',
        isShared: true,
      };

      await updateUsageAggregatesSavedView(client, basePath, 'sv-1', request);

      expect(client.put).toHaveBeenCalledWith(
        '/api/granit/metering/usage-aggregates/saved-views/sv-1',
        request
      );
    });
  });

  describe('deleteUsageAggregatesSavedView', () => {
    it('should DELETE {basePath}/usage-aggregates/saved-views/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await deleteUsageAggregatesSavedView(client, basePath, 'sv-1');

      expect(client.delete).toHaveBeenCalledWith(
        '/api/granit/metering/usage-aggregates/saved-views/sv-1'
      );
    });
  });

  describe('setDefaultUsageAggregatesSavedView', () => {
    it('should POST {basePath}/usage-aggregates/saved-views/{id}/set-default', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await setDefaultUsageAggregatesSavedView(client, basePath, 'sv-1');

      expect(client.post).toHaveBeenCalledWith(
        '/api/granit/metering/usage-aggregates/saved-views/sv-1/set-default'
      );
    });
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0 } });

    await listUsageAggregates(client, '/custom/metering');

    expect(client.get).toHaveBeenCalledWith('/custom/metering/usage-aggregates');
  });
});

// ---------------------------------------------------------------------------
// Lifecycle + admin operations (publish/archive/recompute/backfill/deprecate)
// ---------------------------------------------------------------------------

describe('metering-api / lifecycle + admin operations', () => {
  describe('publishMeterDefinition', () => {
    it('should POST {basePath}/meters/{id}/publish', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleMeter });

      const result = await publishMeterDefinition(client, basePath, 'meter-1');

      expect(client.post).toHaveBeenCalledWith('/api/granit/metering/meters/meter-1/publish');
      expect(result).toEqual(sampleMeter);
    });
  });

  describe('archiveMeterDefinition', () => {
    it('should POST {basePath}/meters/{id}/archive', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleMeter });

      const result = await archiveMeterDefinition(client, basePath, 'meter-1');

      expect(client.post).toHaveBeenCalledWith('/api/granit/metering/meters/meter-1/archive');
      expect(result).toEqual(sampleMeter);
    });
  });

  describe('recomputeMeterUsage', () => {
    it('should POST {basePath}/meters/{id}/recompute with window', async () => {
      const client = createMockClient();
      const response = {
        meterDefinitionId: 'meter-1',
        windowStart: '2026-04-01T00:00:00Z',
        windowEnd: '2026-04-02T00:00:00Z',
        eventsScanned: 120,
        aggregatesRebuilt: 24,
        durationMilliseconds: 314,
      };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const result = await recomputeMeterUsage(client, basePath, 'meter-1', {
        from: '2026-04-01T00:00:00Z',
        to: '2026-04-02T00:00:00Z',
      });

      expect(client.post).toHaveBeenCalledWith('/api/granit/metering/meters/meter-1/recompute', {
        from: '2026-04-01T00:00:00Z',
        to: '2026-04-02T00:00:00Z',
      });
      expect(result).toEqual(response);
    });
  });

  describe('backfillUsageEvents', () => {
    it('should POST {basePath}/events/backfill', async () => {
      const client = createMockClient();
      const response = { eventsAccepted: 3, metersAffected: 1, aggregatesRebuilt: 5 };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const events = [
        {
          meterDefinitionId: 'meter-1',
          idempotencyKey: 'k1',
          quantity: 1,
          timestamp: '2025-01-01T00:00:00Z',
          metadata: null,
        },
      ];

      const result = await backfillUsageEvents(client, basePath, { events });

      expect(client.post).toHaveBeenCalledWith('/api/granit/metering/events/backfill', { events });
      expect(result).toEqual(response);
    });
  });

  describe('deprecateMeterEvent', () => {
    it('should POST {basePath}/events/{id}/deprecate', async () => {
      const client = createMockClient();
      const response = {
        eventId: 'evt-1',
        meterDefinitionId: 'meter-1',
        deprecatedAt: '2026-04-25T08:00:00Z',
        aggregatesRebuilt: 1,
      };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const result = await deprecateMeterEvent(client, basePath, 'evt-1', {
        reason: 'duplicate from retried client',
      });

      expect(client.post).toHaveBeenCalledWith('/api/granit/metering/events/evt-1/deprecate', {
        reason: 'duplicate from retried client',
      });
      expect(result).toEqual(response);
    });
  });
});
