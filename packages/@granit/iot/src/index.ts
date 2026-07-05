// Types
export type {
  Device,
  DeviceCredential,
  DeviceListParams,
  DevicePage,
  DeviceProvisionRequest,
  DeviceResponse,
  DeviceStatus,
  DeviceUpdateRequest,
  TelemetryAggregateParams,
  TelemetryAggregateResponse,
  TelemetryAggregation,
  TelemetryListParams,
  TelemetryPage,
  TelemetryPoint,
  TelemetryPointResponse,
} from './types/index';

// Permissions
export { IotPermissions } from './permissions';

// API
export {
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
} from './api/iot-api';

// Validation constraints (generated from contracts/openapi/iot.json)
export { iotConstraints } from './constraints';
