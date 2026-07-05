# @granit/iot

Framework-agnostic **IoT device fleet & telemetry** SDK — the TypeScript
counterpart of the .NET `Granit.IoT` module (`granit-iot/src/Granit.IoT`).

It exposes the types, HTTP client functions and permission constants needed to
drive the device fleet and telemetry surface from any client — React, React
Native, a CLI, tests. It holds **no** React, DOM or Node-only dependency. The
React layer (provider, query/mutation hooks) lives in
[`@granit/react-iot`](../react-iot).

A **device** is provisioned against a serial number, carries a lifecycle
(`Provisioning → Active → Suspended → Decommissioned`) and optimistic
concurrency (`concurrencyStamp`). Two read surfaces coexist: the CRUD projection
(`DeviceResponse`) and the QueryEngine admin grid (`Device`, raw audited
entity). **Telemetry** points are exposed through a QueryEngine grid
(`TelemetryPoint`), a per-device latest reading (`TelemetryPointResponse`) and an
on-demand metric aggregate (`TelemetryAggregateResponse`).

## Install

```bash
pnpm add @granit/iot
```

## Usage

```ts
import { provisionDevice, getLatestTelemetry, IotPermissions } from '@granit/iot';

const device = await provisionDevice(client, '/api/v1/iot', {
  serialNumber: 'SN-001',
  hardwareModel: 'Acme-X1',
  firmwareVersion: '1.4.2',
  label: 'Lobby sensor',
});

const latest = await getLatestTelemetry(client, '/api/v1/iot', device.id);
```

## Exports

- **Types** — `Device`, `DeviceResponse`, `DeviceProvisionRequest`,
  `DeviceUpdateRequest`, `DeviceStatus`, `TelemetryPoint`,
  `TelemetryPointResponse`, `TelemetryAggregateResponse`, `TelemetryAggregation`,
  and the QueryEngine aliases (`DevicePage`, `DeviceListParams`, …).
- **API** — `provisionDevice`, `getDevice`, `updateDevice`,
  `decommissionDevice`, `listDevices`, `getDevicesQueryMeta`, `listTelemetry`,
  `getTelemetryQueryMeta`, `getLatestTelemetry`, `getTelemetryAggregate`.
- **Permissions** — `IotPermissions`.
- **Validation** — `iotConstraints` (generated from `contracts/openapi/iot.json`).
