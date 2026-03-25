# @granit/react-diagnostics

React hooks for `@granit/diagnostics` -- monitoring health status.

## Installation

```bash
pnpm add @granit/react-diagnostics
```

## API

### Hooks

- `useMonitoringHealth(options?)` -- fetch health status of all monitored services

### Types

- `MonitoringHealthOptions` -- hook configuration options

## Usage

```tsx
import { useMonitoringHealth } from '@granit/react-diagnostics';

function HealthDashboard() {
  const { data: health, isLoading } = useMonitoringHealth();

  if (isLoading) return <span>Loading...</span>;

  return (
    <ul>
      {health?.services.map((s) => (
        <li key={s.name}>
          {s.name}: {s.status}
        </li>
      ))}
    </ul>
  );
}
```

## License

Apache-2.0
