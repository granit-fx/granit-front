import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  checkMeteringQuota,
  createMeterDefinition,
  deactivateMeterDefinition,
  getMeterDefinition,
  getUsageForPeriod,
  listActiveMeters,
  recordUsageEvents,
  updateMeterDefinition,
} from '../api/metering-api.js';

import type {
  MeterDefinitionCreateRequest,
  MeterDefinitionResponse,
  MeterDefinitionUpdateRequest,
  MeteringQuotaStatusResponse,
  RecordUsageRequest,
  UsageAggregateResponse,
} from '../types.js';

const basePath = '/api/granit/metering';

const sampleMeter: MeterDefinitionResponse = {
  id: 'meter-1',
  name: 'API Calls',
  unit: 'calls',
  description: 'Number of API calls',
  aggregationType: 'Sum',
  isActive: true,
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
