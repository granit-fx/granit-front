import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useActiveMeters,
  useCreateMeterDefinition,
  useDeactivateMeterDefinition,
  useMeterDefinition,
  useMeteringQuota,
  useRecordUsageEvents,
  useUpdateMeterDefinition,
  useUsageForPeriod,
} from '../hooks/use-metering.js';
import { MeteringProvider } from '../providers/metering-provider.js';

import type { MeteringConfig } from '../providers/metering-provider.js';
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
  activated: true,
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('use-metering', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useActiveMeters', () => {
    it('fetches active meters with default basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({
        data: { items: [sampleMeter], totalCount: 1 },
      });

      const { result } = renderHook(() => useActiveMeters(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/metering/meters');
      expect(result.current.data).toEqual([sampleMeter]);
    });

    it('uses custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({
        data: { items: [], totalCount: 0 },
      });

      const { result } = renderHook(() => useActiveMeters(), {
        wrapper: createWrapper(client, '/custom/metering'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/metering/meters');
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
    it('fetches usage data', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleUsage] });

      const { result } = renderHook(() => useUsageForPeriod(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/metering/usage');
      expect(result.current.data).toEqual([sampleUsage]);
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

  describe('useDeactivateMeterDefinition', () => {
    it('deactivates a meter via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useDeactivateMeterDefinition(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('meter-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/metering/meters/meter-1/deactivate');
    });
  });

  describe('useRecordUsageEvents', () => {
    it('records events via POST', async () => {
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
      expect(client.post).toHaveBeenCalledWith('/api/v1/metering/events', request);
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
