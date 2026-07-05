import {
  decommissionDevice,
  getDevice,
  getLatestTelemetry,
  getTelemetryAggregate,
  provisionDevice,
  updateDevice,
} from '@granit/iot';
import { useQueryEndpoint } from '@granit/react-query-engine';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logger } from '../logger';
import { buildIotQueryKey, useIotConfig } from '../providers/iot-provider';

import type {
  Device,
  DeviceProvisionRequest,
  DeviceResponse,
  DeviceUpdateRequest,
  TelemetryAggregateParams,
  TelemetryAggregateResponse,
  TelemetryPoint,
  TelemetryPointResponse,
} from '@granit/iot';
import type { UseQueryEndpointOptions, UseQueryEndpointReturn } from '@granit/react-query-engine';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// QueryEngine grids
// ---------------------------------------------------------------------------

/**
 * QueryEngine endpoint for the device fleet ({@link Device}), backed by the
 * `MapGranitQuery<Device>()` group under `{basePath}/devices`. Owns the
 * pagination / filter / sort / group-by state and exposes the dispatchers plus
 * the paged result — the standard surface for the interactive device grid.
 *
 * Must be used within an {@link IotProvider}, which wires the inner `QueryProvider`.
 *
 * @example
 * ```tsx
 * const { query, params, setPage, setPageSize } = useDevicesQuery();
 * query.data?.items.map((device) => device.serialNumber);
 * ```
 */
export function useDevicesQuery(options?: UseQueryEndpointOptions): UseQueryEndpointReturn<Device> {
  return useQueryEndpoint<Device>(options);
}

/**
 * QueryEngine endpoint for telemetry points ({@link TelemetryPoint}), backed by
 * the `MapGranitQuery<TelemetryPoint>()` group under `{basePath}/telemetry`.
 *
 * Must be used within the telemetry {@link QueryProvider} scope wired by
 * `IotTelemetryPage` (a sibling grid to the device fleet).
 *
 * @example
 * ```tsx
 * const { query, params, setPage } = useTelemetryQuery();
 * query.data?.items.map((point) => point.metrics);
 * ```
 */
export function useTelemetryQuery(
  options?: UseQueryEndpointOptions
): UseQueryEndpointReturn<TelemetryPoint> {
  return useQueryEndpoint<TelemetryPoint>(options);
}

// ---------------------------------------------------------------------------
// Device queries
// ---------------------------------------------------------------------------

/**
 * Get a single device by ID.
 *
 * The query is automatically disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: device } = useDevice(selectedId);
 * ```
 */
export function useDevice(id: string): UseQueryResult<DeviceResponse> {
  const config = useIotConfig();

  return useQuery({
    queryKey: buildIotQueryKey(config, 'devices', id),
    queryFn: () => getDevice(config.client, config.basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * Get the most recent telemetry point for a device.
 *
 * The query is automatically disabled when `deviceId` is empty.
 *
 * @example
 * ```tsx
 * const { data: latest } = useLatestTelemetry(deviceId);
 * ```
 */
export function useLatestTelemetry(deviceId: string): UseQueryResult<TelemetryPointResponse> {
  const config = useIotConfig();

  return useQuery({
    queryKey: buildIotQueryKey(config, 'telemetry', deviceId, 'latest'),
    queryFn: () => getLatestTelemetry(config.client, config.basePath, deviceId),
    enabled: deviceId.length > 0,
  });
}

/** Identifies the device + metric window for {@link useTelemetryAggregate}. */
export interface TelemetryAggregateArgs extends TelemetryAggregateParams {
  readonly deviceId: string;
}

/**
 * Aggregate a single device metric over a time range (avg/min/max/count).
 *
 * The query is disabled until `args` is provided (non-null).
 *
 * @example
 * ```tsx
 * const { data } = useTelemetryAggregate({ deviceId, metric: 'temperature', aggregation: 'Avg' });
 * ```
 */
export function useTelemetryAggregate(
  args: TelemetryAggregateArgs | null
): UseQueryResult<TelemetryAggregateResponse> {
  const config = useIotConfig();

  return useQuery({
    queryKey: buildIotQueryKey(
      config,
      'telemetry',
      args?.deviceId ?? '',
      'aggregate',
      args?.metric ?? '',
      args?.aggregation ?? '',
      args?.rangeStart ?? '',
      args?.rangeEnd ?? ''
    ),
    queryFn: () => {
      const { deviceId, ...params } = args!;
      return getTelemetryAggregate(config.client, config.basePath, deviceId, params);
    },
    enabled: args !== null,
  });
}

// ---------------------------------------------------------------------------
// Device mutations
// ---------------------------------------------------------------------------

/**
 * Provision a new device (starts in `Provisioning`).
 * Invalidates device queries on success.
 *
 * @example
 * ```tsx
 * const provision = useProvisionDevice();
 * provision.mutate({ serialNumber: 'SN-001', hardwareModel: 'Acme-X1', firmwareVersion: '1.4.2', label: null });
 * ```
 */
export function useProvisionDevice(): UseMutationResult<
  DeviceResponse,
  Error,
  DeviceProvisionRequest
> {
  const config = useIotConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DeviceProvisionRequest) =>
      provisionDevice(config.client, config.basePath, request),
    onSuccess: (device) => {
      logger.info('Device provisioned', { id: device.id, serialNumber: device.serialNumber });
      queryClient.invalidateQueries({ queryKey: buildIotQueryKey(config, 'devices') });
    },
    onError: (error) => logger.error('Failed to provision device', { error }),
  });
}

/** Variables for `useUpdateDevice`. */
export type UpdateDeviceVariables = {
  readonly id: string;
  readonly request: DeviceUpdateRequest;
};

/**
 * Update a device's firmware version and/or label. Optimistic concurrency is
 * enforced via the body `concurrencyStamp`. Invalidates device queries on success.
 *
 * @example
 * ```tsx
 * const update = useUpdateDevice();
 * update.mutate({ id: 'dev-1', request: { concurrencyStamp, firmwareVersion: '1.5.0', label: null } });
 * ```
 */
export function useUpdateDevice(): UseMutationResult<DeviceResponse, Error, UpdateDeviceVariables> {
  const config = useIotConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: UpdateDeviceVariables) =>
      updateDevice(config.client, config.basePath, id, request),
    onSuccess: (device) => {
      logger.info('Device updated', { id: device.id });
      queryClient.invalidateQueries({ queryKey: buildIotQueryKey(config, 'devices') });
    },
    onError: (error, { id }) => logger.error('Failed to update device', { id, error }),
  });
}

/**
 * Decommission (retire) a device. Idempotent.
 * Invalidates device queries on success.
 *
 * @example
 * ```tsx
 * const decommission = useDecommissionDevice();
 * decommission.mutate('dev-1');
 * ```
 */
export function useDecommissionDevice(): UseMutationResult<void, Error, string> {
  const config = useIotConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => decommissionDevice(config.client, config.basePath, id),
    onSuccess: (_result, id) => {
      logger.info('Device decommissioned', { id });
      queryClient.invalidateQueries({ queryKey: buildIotQueryKey(config, 'devices') });
    },
    onError: (error, id) => logger.error('Failed to decommission device', { id, error }),
  });
}
