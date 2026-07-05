# @granit/react-ui-iot

Granit admin UI for the **IoT** module — the device fleet grid, device detail
(provision / update / decommission / latest telemetry / metric aggregate) and
the telemetry explorer. It composes [`@granit/react-iot`](../react-iot)
(headless) with the foundation UI packages (`@granit/react-ui`,
`@granit/react-ui-kit`).

## Install

```bash
pnpm add @granit/react-ui-iot
```

## Usage

```tsx
import { IotProvider } from '@granit/react-iot';
import { DeviceListPage, DeviceDetailPage, TelemetryPage } from '@granit/react-ui-iot';
import { Route, Routes } from 'react-router-dom';

<IotProvider config={{ client, basePath: '/api/v1/iot' }}>
  <Routes>
    <Route path="/iot/devices" element={<DeviceListPage />} />
    <Route path="/iot/devices/:id" element={<DeviceDetailPage />} />
    <Route path="/iot/telemetry" element={<TelemetryPage />} />
  </Routes>
</IotProvider>;
```

The pages assume an enclosing `IotProvider`. Register the i18n bundles in the
host app:

```ts
import { iotTranslationsEn, iotTranslationsFr } from '@granit/react-ui-iot';

i18n.addResourceBundle('en', 'translation', iotTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', iotTranslationsFr, true, true);
```

## Exports

- **Pages** — `DeviceListPage`, `DeviceDetailPage`, `TelemetryPage`.
- **Components** — `DeviceForm`, `createDeviceColumns`,
  `DecommissionDeviceDialog`, `DeviceTelemetryCard`.
- **i18n** — `iotTranslationsEn`, `iotTranslationsFr`, `IotTranslations`.
