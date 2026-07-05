import { toEntityId, toISODateString } from '@granit/types';

import type {
  Device,
  DeviceResponse,
  TelemetryAggregateResponse,
  TelemetryPoint,
  TelemetryPointResponse,
} from '@granit/iot';
import type { Mutable } from '@granit/testing';
import type { TenantId } from '@granit/types';

const TENANT_ID = toEntityId<'Tenant'>('tnt_001') as unknown as TenantId;

export const sampleDevices: Mutable<DeviceResponse>[] = [
  {
    id: toEntityId<'Device'>('dev_001'),
    serialNumber: 'SN-001',
    hardwareModel: 'Acme-X1',
    firmwareVersion: '1.4.2',
    status: 'Active',
    label: 'Lobby temperature sensor',
    lastHeartbeatAt: toISODateString('2026-07-05T08:00:00Z'),
    createdAt: toISODateString('2026-04-01T00:00:00Z'),
    modifiedAt: toISODateString('2026-06-15T10:30:00Z'),
    concurrencyStamp: 'stamp-001',
  },
  {
    id: toEntityId<'Device'>('dev_002'),
    serialNumber: 'SN-002',
    hardwareModel: 'Acme-X1',
    firmwareVersion: '1.3.0',
    status: 'Provisioning',
    label: null,
    lastHeartbeatAt: null,
    createdAt: toISODateString('2026-06-20T00:00:00Z'),
    modifiedAt: null,
    concurrencyStamp: 'stamp-002',
  },
  {
    id: toEntityId<'Device'>('dev_003'),
    serialNumber: 'SN-003',
    hardwareModel: 'Acme-Z9',
    firmwareVersion: '2.0.1',
    status: 'Suspended',
    label: 'Warehouse gateway',
    lastHeartbeatAt: toISODateString('2026-07-01T12:00:00Z'),
    createdAt: toISODateString('2026-05-10T00:00:00Z'),
    modifiedAt: toISODateString('2026-07-02T09:00:00Z'),
    concurrencyStamp: 'stamp-003',
  },
];

/** QueryEngine entity rows for the device fleet grid (`GET /devices`). */
export const sampleDeviceEntities: Mutable<Device>[] = sampleDevices.map((d) => ({
  concurrencyStamp: d.concurrencyStamp,
  serialNumber: d.serialNumber,
  model: d.hardwareModel,
  firmware: d.firmwareVersion,
  status: d.status,
  label: d.label,
  credential: null,
  lastHeartbeatAt: d.lastHeartbeatAt,
  suspensionReason: d.status === 'Suspended' ? 'Manual administrative hold' : null,
  tags: null,
  tenantId: TENANT_ID,
  modifiedAt: d.modifiedAt,
  modifiedBy: d.modifiedAt ? 'usr_admin' : null,
  createdAt: d.createdAt,
  createdBy: 'usr_seed',
  id: d.id,
}));

export const sampleLatestTelemetry: Mutable<TelemetryPointResponse> = {
  id: toEntityId<'TelemetryPoint'>('tp_100'),
  deviceId: toEntityId<'Device'>('dev_001'),
  recordedAt: toISODateString('2026-07-05T08:00:00Z'),
  metrics: { temperature: 21.5, humidity: 48 },
  source: 'mqtt',
  createdAt: toISODateString('2026-07-05T08:00:01Z'),
};

/** QueryEngine entity rows for the telemetry grid (`GET /telemetry`). */
export const sampleTelemetryEntities: Mutable<TelemetryPoint>[] = [
  {
    deviceId: toEntityId<'Device'>('dev_001'),
    recordedAt: toISODateString('2026-07-05T08:00:00Z'),
    metrics: { temperature: 21.5, humidity: 48 },
    messageId: 'msg-100',
    source: 'mqtt',
    tenantId: TENANT_ID,
    createdAt: toISODateString('2026-07-05T08:00:01Z'),
    createdBy: 'ingest',
    id: toEntityId<'TelemetryPoint'>('tp_100'),
  },
  {
    deviceId: toEntityId<'Device'>('dev_001'),
    recordedAt: toISODateString('2026-07-05T07:00:00Z'),
    metrics: { temperature: 21.1, humidity: 49 },
    messageId: 'msg-099',
    source: 'mqtt',
    tenantId: TENANT_ID,
    createdAt: toISODateString('2026-07-05T07:00:01Z'),
    createdBy: 'ingest',
    id: toEntityId<'TelemetryPoint'>('tp_099'),
  },
];

export const sampleTelemetryAggregate: Mutable<TelemetryAggregateResponse> = {
  value: 21.4,
  count: 24,
  metricName: 'temperature',
  aggregation: 'Avg',
  rangeStart: toISODateString('2026-07-04T00:00:00Z'),
  rangeEnd: toISODateString('2026-07-05T00:00:00Z'),
};
