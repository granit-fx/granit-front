import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useActiveMeters,
  useArchiveMeterDefinition,
  useCreateMeterDefinition,
  useMeterDefinition,
  useMeteringQuota,
  usePublishMeterDefinition,
  useRecordUsageEvents,
  useUpdateMeterDefinition,
  useUsageForPeriod,
} from '../hooks/use-metering';
import { MeteringProvider } from '../providers/metering-provider';

import type { MeteringConfig } from '../providers/metering-provider';
import type {
  MeterDefinitionResponse,
  MeteringQuotaStatusResponse,
  UsageAggregateResponse,
} from '@granit/metering';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: MeteringConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <MeteringProvider config={config}>{children}</MeteringProvider>
    );
  };
}

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('use-metering', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useActiveMeters', () => {
    it('fetches the active catalog with default basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleMeter] });

      const { result } = renderHook(() => useActiveMeters(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/metering/meters/active');
      expect(result.current.data).toEqual([sampleMeter]);
    });

    it('uses custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useActiveMeters(), {
        wrapper: createWrapper(client, '/custom/metering'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/metering/meters/active');
    });
  });

  describe('useMeterDefinition', () => {
    it('fetches a meter by ID', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeter });

      const { result } = renderHook(() => useMeterDefinition('meter-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/metering/meters/meter-1');
    });

    it('is disabled when id is empty', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useMeterDefinition(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useUsageForPeriod', () => {
    it('fetches usage for the given meter and period', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleUsage });

      const { result } = renderHook(
        () =>
          useUsageForPeriod({
            meterId: 'meter-1',
            periodStart: toISODateString('2026-04-01T00:00:00Z'),
            periodEnd: toISODateString('2026-05-01T00:00:00Z'),
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/metering/usage', {
        params: {
          meterId: 'meter-1',
          periodStart: toISODateString('2026-04-01T00:00:00Z'),
          periodEnd: toISODateString('2026-05-01T00:00:00Z'),
        },
      });
      expect(result.current.data).toEqual(sampleUsage);
    });

    it('is disabled when params is null', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useUsageForPeriod(null), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useMeteringQuota', () => {
    it('fetches quota for a meter', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleQuota });

      const { result } = renderHook(() => useMeteringQuota('meter-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/metering/quota/meter-1');
      expect(result.current.data).toEqual(sampleQuota);
    });

    it('is disabled when meterId is empty', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useMeteringQuota(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateMeterDefinition', () => {
    it('creates a meter via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleMeter });

      const { result } = renderHook(() => useCreateMeterDefinition(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        name: 'API Calls',
        unit: 'calls',
        aggregationType: 'Sum',
        description: null,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/metering/meters', {
        name: 'API Calls',
        unit: 'calls',
        aggregationType: 'Sum',
        description: null,
      });
    });
  });

  describe('useUpdateMeterDefinition', () => {
    it('updates a meter via PUT', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleMeter });

      const { result } = renderHook(() => useUpdateMeterDefinition(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        id: 'meter-1',
        request: { name: 'Updated', unit: 'calls', description: null },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalledWith('/api/v1/metering/meters/meter-1', {
        name: 'Updated',
        unit: 'calls',
        description: null,
      });
    });
  });

  describe('usePublishMeterDefinition', () => {
    it('publishes a meter via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => usePublishMeterDefinition(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('meter-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/metering/meters/meter-1/publish');
    });
  });

  describe('useArchiveMeterDefinition', () => {
    it('archives a meter via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useArchiveMeterDefinition(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('meter-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/metering/meters/meter-1/archive');
    });
  });

  describe('useRecordUsageEvents', () => {
    it('records events via POST with an Idempotency-Key header', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useRecordUsageEvents(), {
        wrapper: createWrapper(client),
      });

      const request = {
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

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/metering/events', request, {
        headers: { 'Idempotency-Key': expect.any(String) },
      });
    });
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useActiveMeters(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});
