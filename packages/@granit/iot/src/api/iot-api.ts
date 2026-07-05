import { getPage, getQueryMeta } from '@granit/query-engine';

import type {
  Device,
  DeviceListParams,
  DevicePage,
  DeviceProvisionRequest,
  DeviceResponse,
  DeviceUpdateRequest,
  TelemetryAggregateParams,
  TelemetryAggregateResponse,
  TelemetryListParams,
  TelemetryPage,
  TelemetryPoint,
  TelemetryPointResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { QueryMetadata } from '@granit/query-engine';

// ---------------------------------------------------------------------------
// Device lifecycle (CRUD)
// ---------------------------------------------------------------------------

/**
 * Provision a new device into the fleet. The backend issues the device
 * credential and starts it in `Provisioning`. Requires `IoT.Devices.Manage`.
 *
 * `POST {basePath}/devices`
 */
export async function provisionDevice(
  client: AxiosInstance,
  basePath: string,
  request: DeviceProvisionRequest
): Promise<DeviceResponse> {
  const response = await client.post<DeviceResponse>(`${basePath}/devices`, request);
  return response.data;
}

/**
 * Get a single device by ID. Scoped to the current tenant. Requires
 * `IoT.Devices.Read`.
 *
 * `GET {basePath}/devices/{id}`
 */
export async function getDevice(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<DeviceResponse> {
  const response = await client.get<DeviceResponse>(
    `${basePath}/devices/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Update a device's firmware version and/or label. Optimistic concurrency is
 * enforced via the body `concurrencyStamp` (a stale stamp yields `409`).
 * Requires `IoT.Devices.Manage`.
 *
 * `PUT {basePath}/devices/{id}`
 */
export async function updateDevice(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: DeviceUpdateRequest
): Promise<DeviceResponse> {
  const response = await client.put<DeviceResponse>(
    `${basePath}/devices/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Decommission (retire) a device: credentials are revoked and the record is
 * retained for audit. Idempotent. Requires `IoT.Devices.Manage`.
 *
 * `DELETE {basePath}/devices/{id}`
 */
export async function decommissionDevice(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/devices/${encodeURIComponent(id)}`);
}

// ---------------------------------------------------------------------------
// Device QueryEngine grid (GET {basePath}/devices + /meta)
// ---------------------------------------------------------------------------

/**
 * List devices via the QueryEngine admin grid (paginated, filterable). Requires
 * `IoT.Devices.Read`.
 *
 * `GET {basePath}/devices`
 */
export async function listDevices(
  client: AxiosInstance,
  basePath: string,
  params?: DeviceListParams
): Promise<DevicePage> {
  return getPage<Device>(client, `${basePath}/devices`, params ?? {});
}

/**
 * Get the QueryEngine metadata (columns, filterable fields, presets) for the
 * device grid.
 *
 * `GET {basePath}/devices/meta`
 */
export async function getDevicesQueryMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/devices`);
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

/**
 * List telemetry points via the QueryEngine grid (paginated, filterable).
 * Requires `IoT.Telemetry.Read`.
 *
 * `GET {basePath}/telemetry`
 */
export async function listTelemetry(
  client: AxiosInstance,
  basePath: string,
  params?: TelemetryListParams
): Promise<TelemetryPage> {
  return getPage<TelemetryPoint>(client, `${basePath}/telemetry`, params ?? {});
}

/**
 * Get the QueryEngine metadata for the telemetry grid.
 *
 * `GET {basePath}/telemetry/meta`
 */
export async function getTelemetryQueryMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/telemetry`);
}

/**
 * Get the most recent telemetry point for a device. Requires
 * `IoT.Telemetry.Read`.
 *
 * `GET {basePath}/telemetry/{deviceId}/latest`
 */
export async function getLatestTelemetry(
  client: AxiosInstance,
  basePath: string,
  deviceId: string
): Promise<TelemetryPointResponse> {
  const response = await client.get<TelemetryPointResponse>(
    `${basePath}/telemetry/${encodeURIComponent(deviceId)}/latest`
  );
  return response.data;
}

/**
 * Aggregate a single device metric over a time range (avg/min/max/count).
 * Requires `IoT.Telemetry.Read`.
 *
 * `GET {basePath}/telemetry/{deviceId}/aggregate`
 */
export async function getTelemetryAggregate(
  client: AxiosInstance,
  basePath: string,
  deviceId: string,
  params: TelemetryAggregateParams
): Promise<TelemetryAggregateResponse> {
  const response = await client.get<TelemetryAggregateResponse>(
    `${basePath}/telemetry/${encodeURIComponent(deviceId)}/aggregate`,
    { params }
  );
  return response.data;
}
