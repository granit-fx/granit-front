# @granit/diagnostics

Monitoring health types and API. Mirrors `Granit.Diagnostics` .NET contract.

## Installation

```bash
pnpm add @granit/diagnostics
```

## API

### Types

- `MonitoringHealthResponse` -- aggregated health check response
- `ServiceHealthResponse` -- individual service health status
- `ServiceStatus` -- status enum values

### Functions

- `fetchMonitoringHealth(...)` -- fetch health status of all monitored services

### Constants

- `DEFAULT_DIAGNOSTICS_BASE_PATH` -- default API base path

## Usage

```ts
import { fetchMonitoringHealth } from '@granit/diagnostics';
import type { MonitoringHealthResponse } from '@granit/diagnostics';

const health: MonitoringHealthResponse = await fetchMonitoringHealth(client, basePath);

for (const service of health.services) {
  console.log(`${service.name}: ${service.status}`);
}
```

## License

Apache-2.0
