# @granit/auditing

Audit log types and API functions — mirrors `Granit.Auditing` .NET.

## Installation

```bash
pnpm add @granit/auditing
```

## API

- `listAuditLogEntries(client, basePath, params?)` — list entries with filters
- `getAuditLogEntry(client, basePath, id)` — get entry with entity change details
- `listEntityAuditTrail(client, basePath, entityType, entityId, params?)` — entity audit trail

## Types

- `AuditLogEntry` — summary (list view)
- `AuditLogEntryDetail` — full details with entity changes
- `AuditEntityChange` — entity-level change
- `AuditPropertyChange` — property-level change
- `AuditLogCategory` — category constants (`DataMutation`, `ConfigurationChange`, `DataAccess`, `AccessDenied`)
- `AuditChangeType` — change type constants (`Created`, `Modified`, `Deleted`, `SoftDeleted`)
- `AuditLogListParams` — query parameters
- `AuditLogPage` — paginated response

## Usage

```typescript
import { listAuditLogEntries, AuditLogCategory } from '@granit/auditing';

const page = await listAuditLogEntries(client, '/audit-log', {
  category: AuditLogCategory.DataMutation,
  from: '2026-01-01T00:00:00Z',
  pageSize: 50,
});
```

## License

Apache-2.0
