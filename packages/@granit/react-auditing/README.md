# @granit/react-auditing

React bindings for `@granit/auditing` — `AuditLogProvider`, hooks.

## Installation

```bash
pnpm add @granit/react-auditing
```

## API

### Provider

- `AuditLogProvider` — provides audit log configuration to hooks
- `useAuditLogConfig()` — access config from nearest provider

### Hooks

- `useAuditLogEntries(params?)` — paginated list with filters
- `useAuditLogEntry(id)` — single entry with entity change details
- `useEntityAuditTrail(entityType, entityId, params?)` — entity-specific audit trail

## Usage

```tsx
import { AuditLogProvider, useAuditLogEntries } from '@granit/react-auditing';
import { AuditLogCategory } from '@granit/auditing';

function App() {
  return (
    <AuditLogProvider config={{ client: apiClient, basePath: '/audit-log' }}>
      <AuditLog />
    </AuditLogProvider>
  );
}

function AuditLog() {
  const { data } = useAuditLogEntries({
    category: AuditLogCategory.DataMutation,
  });
  return (
    <ul>
      {data?.items.map((e) => (
        <li key={e.id}>{e.category}</li>
      ))}
    </ul>
  );
}
```

## License

Apache-2.0
