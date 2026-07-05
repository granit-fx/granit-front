# @granit/react-iot

React bindings for [`@granit/iot`](../iot) — the `IotProvider` plus the device
and telemetry hooks. This is the **headless** tier: it owns data fetching,
caching and the QueryEngine grid state, but ships no shadcn/DOM components. The
admin UI lives in [`@granit/react-ui-iot`](../react-ui-iot).

## Install

```bash
pnpm add @granit/react-iot
```

## Usage

```tsx
import { IotProvider, useDevicesQuery, useProvisionDevice } from '@granit/react-iot';

function DeviceFleet() {
  const { query, params, setPage } = useDevicesQuery();
  const provision = useProvisionDevice();
  // …
}

<IotProvider config={{ client, basePath: '/api/v1/iot' }}>
  <DeviceFleet />
</IotProvider>;
```

`IotProvider` wires the QueryEngine `QueryProvider` scoped to
`{basePath}/devices`, so `useDevicesQuery` (a `useQueryEndpoint`) works
out of the box. The telemetry grid (`useTelemetryQuery`) is a sibling surface
scoped by the consuming page.

## Exports

- **Provider** — `IotProvider`, `useIotConfig`, `buildIotQueryKey`.
- **Grid hooks** — `useDevicesQuery`, `useTelemetryQuery`.
- **Device hooks** — `useDevice`, `useProvisionDevice`, `useUpdateDevice`,
  `useDecommissionDevice`.
- **Telemetry hooks** — `useLatestTelemetry`, `useTelemetryAggregate`.
- **Testing** (`@granit/react-iot/testing`) — `createIotHandlers` (MSW),
  sample fixtures and the QueryEngine `/meta` payloads.
