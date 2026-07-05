// Provider
export {
  buildIotQueryKey,
  IotProvider,
  IotTelemetryProvider,
  useIotConfig,
} from './providers/iot-provider';
export type { IotConfig, IotProviderProps, ResolvedIotConfig } from './providers/iot-provider';

// Hooks
export {
  useDecommissionDevice,
  useDevice,
  useDevicesQuery,
  useLatestTelemetry,
  useProvisionDevice,
  useTelemetryAggregate,
  useTelemetryQuery,
  useUpdateDevice,
} from './hooks/use-iot';
export type { TelemetryAggregateArgs, UpdateDeviceVariables } from './hooks/use-iot';
