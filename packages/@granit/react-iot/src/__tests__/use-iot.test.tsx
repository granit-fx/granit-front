import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  sampleDevices,
  sampleLatestTelemetry,
  sampleTelemetryAggregate,
} from '@granit/react-iot/testing';

import {
  useDecommissionDevice,
  useDevice,
  useLatestTelemetry,
  useProvisionDevice,
  useTelemetryAggregate,
  useUpdateDevice,
} from '../hooks/use-iot';
import { IotProvider } from '../providers/iot-provider';

import type { IotConfig } from '../providers/iot-provider';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: IotConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <IotProvider config={config}>{children}</IotProvider>
    );
  };
}

const sampleDevice = sampleDevices[0]!;

describe('use-iot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useDevice', () => {
    it('fetches a device by ID with the default basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleDevice });

      const { result } = renderHook(() => useDevice('dev_001'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/iot/devices/dev_001');
      expect(result.current.data).toEqual(sampleDevice);
    });

    it('is disabled for an empty id', () => {
      const client = createMockClient();
      const { result } = renderHook(() => useDevice(''), { wrapper: createWrapper(client) });
      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useProvisionDevice', () => {
    it('POSTs a provision request to /devices', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleDevice });

      const { result } = renderHook(() => useProvisionDevice(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        serialNumber: 'SN-001',
        hardwareModel: 'Acme-X1',
        firmwareVersion: '1.4.2',
        label: null,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/iot/devices', {
        serialNumber: 'SN-001',
        hardwareModel: 'Acme-X1',
        firmwareVersion: '1.4.2',
        label: null,
      });
    });
  });

  describe('useUpdateDevice', () => {
    it('PUTs to /devices/:id with the concurrency stamp', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleDevice });

      const { result } = renderHook(() => useUpdateDevice(), { wrapper: createWrapper(client) });

      result.current.mutate({
        id: 'dev_001',
        request: { concurrencyStamp: 'stamp-001', firmwareVersion: '1.5.0' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalledWith('/api/v1/iot/devices/dev_001', {
        concurrencyStamp: 'stamp-001',
        firmwareVersion: '1.5.0',
      });
    });
  });

  describe('useDecommissionDevice', () => {
    it('DELETEs /devices/:id', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useDecommissionDevice(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('dev_001');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/api/v1/iot/devices/dev_001');
    });
  });

  describe('useLatestTelemetry', () => {
    it('GETs the latest telemetry for a device', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleLatestTelemetry });

      const { result } = renderHook(() => useLatestTelemetry('dev_001'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/iot/telemetry/dev_001/latest');
    });
  });

  describe('useTelemetryAggregate', () => {
    it('GETs the aggregate with query params when args provided', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleTelemetryAggregate });

      const { result } = renderHook(
        () =>
          useTelemetryAggregate({ deviceId: 'dev_001', metric: 'temperature', aggregation: 'Avg' }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/iot/telemetry/dev_001/aggregate', {
        params: { metric: 'temperature', aggregation: 'Avg' },
      });
    });

    it('is disabled when args is null', () => {
      const client = createMockClient();
      const { result } = renderHook(() => useTelemetryAggregate(null), {
        wrapper: createWrapper(client),
      });
      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });
});
