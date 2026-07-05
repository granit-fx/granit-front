import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  decommissionDevice,
  getDevice,
  getDevicesQueryMeta,
  getLatestTelemetry,
  getTelemetryAggregate,
  getTelemetryQueryMeta,
  listDevices,
  listTelemetry,
  provisionDevice,
  updateDevice,
} from '../api/iot-api';

import type {
  Device,
  DeviceProvisionRequest,
  DeviceResponse,
  DeviceUpdateRequest,
  TelemetryPoint,
  TelemetryPointResponse,
} from '../types/index';
import type { QueryMetadata } from '@granit/query-engine';
import type { ISODateString, TenantId } from '@granit/types';

const basePath = '/iot';

const sampleDevice: DeviceResponse = {
  id: 'dev-1',
  serialNumber: 'SN-001',
  hardwareModel: 'Acme-X1',
  firmwareVersion: '1.4.2',
  status: 'Active',
  label: 'Lobby sensor',
  lastHeartbeatAt: '2026-07-05T08:00:00Z' as ISODateString,
  createdAt: '2026-04-01T00:00:00Z' as ISODateString,
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
};

describe('iot-api / devices', () => {
  describe('provisionDevice', () => {
    it('should POST {basePath}/devices with the request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleDevice });

      const request: DeviceProvisionRequest = {
        serialNumber: 'SN-001',
        hardwareModel: 'Acme-X1',
        firmwareVersion: '1.4.2',
        label: 'Lobby sensor',
      };

      const result = await provisionDevice(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/iot/devices', request);
      expect(result).toEqual(sampleDevice);
    });
  });

  describe('getDevice', () => {
    it('should GET {basePath}/devices/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleDevice });

      const result = await getDevice(client, basePath, 'dev-1');

      expect(client.get).toHaveBeenCalledWith('/iot/devices/dev-1');
      expect(result).toEqual(sampleDevice);
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleDevice });

      await getDevice(client, basePath, 'dev/special');

      expect(client.get).toHaveBeenCalledWith('/iot/devices/dev%2Fspecial');
    });
  });

  describe('updateDevice', () => {
    it('should PUT {basePath}/devices/{id} with the request body', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleDevice });

      const request: DeviceUpdateRequest = {
        concurrencyStamp: 'stamp-1',
        firmwareVersion: '1.5.0',
      };

      const result = await updateDevice(client, basePath, 'dev-1', request);

      expect(client.put).toHaveBeenCalledWith('/iot/devices/dev-1', request);
      expect(result).toEqual(sampleDevice);
    });
  });

  describe('decommissionDevice', () => {
    it('should DELETE {basePath}/devices/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await decommissionDevice(client, basePath, 'dev-1');

      expect(client.delete).toHaveBeenCalledWith('/iot/devices/dev-1');
    });
  });
});

// ---------------------------------------------------------------------------
// QueryEngine wrappers
// ---------------------------------------------------------------------------

const sampleDeviceEntity: Device = {
  concurrencyStamp: 'stamp-1',
  serialNumber: 'SN-001',
  model: 'Acme-X1',
  firmware: '1.4.2',
  status: 'Active',
  label: 'Lobby sensor',
  credential: null,
  lastHeartbeatAt: '2026-07-05T08:00:00Z' as ISODateString,
  suspensionReason: null,
  tags: null,
  tenantId: 'tenant-1' as TenantId,
  modifiedAt: null,
  modifiedBy: null,
  createdAt: '2026-04-01T00:00:00Z' as ISODateString,
  createdBy: 'user-1',
  id: 'dev-1',
};

const sampleTelemetryEntity: TelemetryPoint = {
  deviceId: 'dev-1',
  recordedAt: '2026-07-05T08:00:00Z' as ISODateString,
  metrics: { temperature: 21.5 },
  messageId: 'msg-1',
  source: 'mqtt',
  tenantId: 'tenant-1' as TenantId,
  createdAt: '2026-07-05T08:00:01Z' as ISODateString,
  createdBy: 'ingest',
  id: 'tp-1',
};

const sampleMeta: QueryMetadata = {
  columns: [],
  filterableFields: [],
} as unknown as QueryMetadata;

describe('iot-api / QueryEngine grids', () => {
  it('listDevices should GET {basePath}/devices with serialized params', async () => {
    const client = createMockClient();
    const page = { items: [sampleDeviceEntity], totalCount: 1 };
    vi.mocked(client.get).mockResolvedValue({ data: page });

    const result = await listDevices(client, basePath, { page: 1, pageSize: 25 });

    const url = vi.mocked(client.get).mock.calls[0]?.[0] as string;
    expect(url).toContain('/iot/devices');
    expect(url).toContain('page=1');
    expect(url).toContain('pageSize=25');
    expect(result).toEqual(page);
  });

  it('getDevicesQueryMeta should GET {basePath}/devices/meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleMeta });

    const result = await getDevicesQueryMeta(client, basePath);

    expect(client.get).toHaveBeenCalledWith('/iot/devices/meta', undefined);
    expect(result).toEqual(sampleMeta);
  });

  it('listTelemetry should GET {basePath}/telemetry with serialized params', async () => {
    const client = createMockClient();
    const page = { items: [sampleTelemetryEntity], totalCount: 1 };
    vi.mocked(client.get).mockResolvedValue({ data: page });

    await listTelemetry(client, basePath, { page: 2, pageSize: 50 });

    const url = vi.mocked(client.get).mock.calls[0]?.[0] as string;
    expect(url).toContain('/iot/telemetry');
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=50');
  });

  it('getTelemetryQueryMeta should GET {basePath}/telemetry/meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleMeta });

    await getTelemetryQueryMeta(client, basePath);

    expect(client.get).toHaveBeenCalledWith('/iot/telemetry/meta', undefined);
  });
});

// ---------------------------------------------------------------------------
// Telemetry readings
// ---------------------------------------------------------------------------

const sampleLatest: TelemetryPointResponse = {
  id: 'tp-1',
  deviceId: 'dev-1',
  recordedAt: '2026-07-05T08:00:00Z' as ISODateString,
  metrics: { temperature: 21.5, humidity: 48 },
  source: 'mqtt',
  createdAt: '2026-07-05T08:00:01Z' as ISODateString,
};

describe('iot-api / telemetry readings', () => {
  it('getLatestTelemetry should GET {basePath}/telemetry/{deviceId}/latest', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleLatest });

    const result = await getLatestTelemetry(client, basePath, 'dev-1');

    expect(client.get).toHaveBeenCalledWith('/iot/telemetry/dev-1/latest');
    expect(result).toEqual(sampleLatest);
  });

  it('getTelemetryAggregate should GET the aggregate route with query params', async () => {
    const client = createMockClient();
    const aggregate = {
      value: 21.5,
      count: 12,
      metricName: 'temperature',
      aggregation: 'Avg' as const,
      rangeStart: '2026-07-01T00:00:00Z' as ISODateString,
      rangeEnd: '2026-07-05T00:00:00Z' as ISODateString,
    };
    vi.mocked(client.get).mockResolvedValue({ data: aggregate });

    const result = await getTelemetryAggregate(client, basePath, 'dev-1', {
      metric: 'temperature',
      aggregation: 'Avg',
    });

    expect(client.get).toHaveBeenCalledWith('/iot/telemetry/dev-1/aggregate', {
      params: { metric: 'temperature', aggregation: 'Avg' },
    });
    expect(result).toEqual(aggregate);
  });
});
