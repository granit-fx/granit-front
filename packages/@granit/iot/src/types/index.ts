import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type { ISODateString, TenantId } from '@granit/types';

/**
 * Lifecycle status of a device. Mirrors `Granit.IoT.Domain.DeviceStatus`
 * (serialized to its string name).
 *
 * `Provisioning` is the initial state (credentials issued, not yet trusted);
 * `Active` accepts telemetry; `Suspended` is a reversible administrative hold;
 * `Decommissioned` is terminal (device retired, credentials revoked).
 */
export type DeviceStatus = 'Provisioning' | 'Active' | 'Suspended' | 'Decommissioned';

/** Aggregation function applied over a device's telemetry metric window. */
export type TelemetryAggregation = 'Avg' | 'Min' | 'Max' | 'Count';

/**
 * Provisions a new device into the fleet. The backend issues the device
 * credential (never supplied by the caller) and starts the device in
 * `Provisioning`. Requires `IoT.Devices.Manage`.
 */
export interface DeviceProvisionRequest {
  /** Manufacturer serial number, unique within the tenant (max 128 chars). */
  readonly serialNumber: string;
  /** Hardware model identifier (max 256 chars). */
  readonly hardwareModel: string;
  /** Firmware version string, e.g. `1.4.2` (max 64 chars). */
  readonly firmwareVersion: string;
  /** Optional human-friendly label (max 256 chars). */
  readonly label?: string | null;
}

/**
 * Updates a device's mutable fields. Optimistic concurrency is enforced via the
 * body-carried {@link DeviceUpdateRequest.concurrencyStamp}; a stale stamp yields
 * `409 Conflict`. Requires `IoT.Devices.Manage`.
 */
export interface DeviceUpdateRequest {
  /** Concurrency token from the last read of the device. */
  readonly concurrencyStamp: string;
  /** New firmware version (max 64 chars). Omit to leave unchanged. */
  readonly firmwareVersion?: string | null;
  /** New label (max 256 chars). Omit to leave unchanged. */
  readonly label?: string | null;
}

/**
 * A device as returned by the CRUD endpoints (provision, get, update). The
 * hardware model and firmware version are projected as plain strings.
 */
export interface DeviceResponse {
  readonly id: string;
  readonly serialNumber: string;
  readonly hardwareModel: string;
  readonly firmwareVersion: string;
  readonly status: DeviceStatus;
  readonly label: string | null;
  readonly lastHeartbeatAt: ISODateString | null;
  readonly createdAt: ISODateString;
  readonly modifiedAt: ISODateString | null;
  /** Concurrency token to echo back on the next {@link DeviceUpdateRequest}. */
  readonly concurrencyStamp: string;
}

/**
 * Protected credential material attached to a device. The secret is stored
 * encrypted at rest and never returned in clear through the admin surface.
 */
export interface DeviceCredential {
  readonly credentialType?: string;
  readonly protectedSecret?: string;
}

/**
 * Device entity as returned by the QueryEngine admin grid (`GET {basePath}/devices`).
 *
 * Distinct from {@link DeviceResponse}: the query endpoint returns the raw
 * audited entity, exposing the serial-number/model/firmware value objects, the
 * credential envelope, the suspension reason, free-form `tags`, `tenantId` and
 * the audit columns.
 */
export interface Device {
  readonly concurrencyStamp: string;
  readonly serialNumber: string;
  readonly model: string;
  readonly firmware: string;
  readonly status: DeviceStatus;
  readonly label: string | null;
  readonly credential: DeviceCredential | null;
  readonly lastHeartbeatAt: ISODateString | null;
  readonly suspensionReason: string | null;
  readonly tags: Readonly<Record<string, string>> | null;
  readonly tenantId: TenantId | null;
  readonly modifiedAt: ISODateString | null;
  readonly modifiedBy: string | null;
  readonly createdAt: ISODateString;
  readonly createdBy: string;
  readonly id: string;
}

/**
 * A single telemetry point as returned by the latest-reading endpoint
 * (`GET {basePath}/telemetry/{deviceId}/latest`). Metric values are decoded to
 * numbers (the wire allows a numeric string for lossless large-double transport).
 */
export interface TelemetryPointResponse {
  readonly id: string;
  readonly deviceId: string;
  readonly recordedAt: ISODateString;
  readonly metrics: Readonly<Record<string, number>>;
  readonly source: string | null;
  readonly createdAt: ISODateString;
}

/**
 * Telemetry point entity as returned by the QueryEngine telemetry grid
 * (`GET {basePath}/telemetry`). Distinct from {@link TelemetryPointResponse}: the
 * query endpoint exposes the ingestion `messageId`, `tenantId` and audit columns.
 */
export interface TelemetryPoint {
  readonly deviceId: string;
  readonly recordedAt: ISODateString;
  readonly metrics: Readonly<Record<string, number>>;
  readonly messageId: string | null;
  readonly source: string | null;
  readonly tenantId: TenantId | null;
  readonly createdAt: ISODateString;
  readonly createdBy: string;
  readonly id: string;
}

/**
 * Result of aggregating a single device metric over a time range
 * (`GET {basePath}/telemetry/{deviceId}/aggregate`).
 */
export interface TelemetryAggregateResponse {
  /** Aggregated value; a numeric string is possible for lossless large doubles. */
  readonly value: number;
  /** Number of telemetry points that contributed to the aggregate. */
  readonly count: number;
  readonly metricName: string;
  readonly aggregation: TelemetryAggregation;
  readonly rangeStart: ISODateString;
  readonly rangeEnd: ISODateString;
}

/** Query parameters for the telemetry aggregate endpoint. */
export interface TelemetryAggregateParams {
  /** Metric key to aggregate (must exist in the device's telemetry). */
  readonly metric: string;
  readonly aggregation: TelemetryAggregation;
  /** Inclusive lower bound (UTC). Defaults server-side when omitted. */
  readonly rangeStart?: ISODateString;
  /** Exclusive upper bound (UTC). Defaults server-side when omitted. */
  readonly rangeEnd?: ISODateString;
}

/** Paginated page of {@link Device} entities (QueryEngine admin grid). */
export type DevicePage = PagedResult<Device>;

/** Query parameters accepted by the device QueryEngine grid (`GET {basePath}/devices`). */
export type DeviceListParams = QueryRequest;

/** Paginated page of {@link TelemetryPoint} entities (QueryEngine telemetry grid). */
export type TelemetryPage = PagedResult<TelemetryPoint>;

/** Query parameters accepted by the telemetry QueryEngine grid (`GET {basePath}/telemetry`). */
export type TelemetryListParams = QueryRequest;
