# @granit/auditing

Framework-agnostic **audit-log** SDK — the TypeScript counterpart of the .NET
`Granit.Auditing` module (`granit-dotnet/src/Granit.Auditing`, contract
`contracts/openapi/auditing.json`).

It exposes the wire types, the audit-trail HTTP client and the permission
catalog needed to read an immutable audit trail (who changed what, when, from
where) and to satisfy GDPR Art. 17 pseudonymization requests. It holds **no**
React, DOM or Node-only dependency. The React hooks/provider layer lives in
[`@granit/react-auditing`](../react-auditing); the admin list/detail pages live
in [`@granit/react-ui-auditing`](../react-ui-auditing).

Audit entries are append-only: an entry records a user action under a
[`AuditCategory`](#public-api), and carries the per-entity, per-property diffs
(`originalValue` → `newValue`, with sensitive properties masked server-side).
The paginated **audit-entries** and **audit-entity-changes** list grids are
query-engine surfaces (`GET .../meta` + filtered list), consumed through the
React layer rather than a fixed function here; this core package covers the
point lookups (by id, by correlation id, by entity) and the pseudonymization
command.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios instance (CSRF, auth, tenant).
- `@granit/query-engine` — `PagedResult` / `PaginationParams` for the trail.
- `@granit/types` — branded id types (`EntityId`, `UserId`, `TenantId`, …).

## Quick start

```ts
import {
  getAuditLogEntry,
  getAuditEntriesByCorrelationId,
  listEntityAuditTrail,
  pseudonymizeUserAuditLogs,
  AuditingPermissions,
} from '@granit/auditing';

// `basePath` is the audit-entries collection root from the backend contract.
const basePath = '/api/v1/auditing/audit-entries';

// Single entry, including per-entity / per-property diffs (sensitive values
// are returned masked as '***' by the backend).
const entry = await getAuditLogEntry(client, basePath, entryId);
for (const change of entry.entityChanges) {
  console.log(change.entityType, change.changeType, change.propertyChanges);
}

// Distributed-tracing investigation — every entry sharing a correlation id,
// newest-first, not paginated.
const correlated = await getAuditEntriesByCorrelationId(client, basePath, correlationId);

// Full change history of one record, paginated.
const page = await listEntityAuditTrail(client, basePath, 'Party', partyId, {
  pageNumber: 1,
  pageSize: 50,
});

// GDPR Art. 17 — pseudonymize all entries for a user (requires the
// `AuditingPermissions.AuditEntries.Manage` permission). Returns 204.
await pseudonymizeUserAuditLogs(client, basePath, userId);
```

## Public API

| Symbol                                 | Kind  | Purpose                                                                                                 |
| -------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| `AuditCategory`                        | const | Category enum (`DataMutation`, `ConfigurationChange`, `DataAccess`, `AccessDenied`, `PrivilegedAccess`) |
| `AuditChangeType`                      | const | Entity change enum (`Created`, `Modified`, `Deleted`, `SoftDeleted`)                                    |
| `AuditCategoryValue`                   | type  | Union of `AuditCategory` values                                                                         |
| `AuditChangeTypeValue`                 | type  | Union of `AuditChangeType` values                                                                       |
| `AuditEntryResponse`                   | type  | List-view entry summary (`entityChangeCount`, no diffs)                                                 |
| `AuditEntryDetailResponse`             | type  | Full entry with `entityChanges` + `userAgent`                                                           |
| `AuditEntityChangeResponse`            | type  | Per-entity change with its `propertyChanges`                                                            |
| `AuditPropertyChangeResponse`          | type  | One property diff (`originalValue` → `newValue`)                                                        |
| `AuditEntityChangeSummaryResponse`     | type  | Flat projection for the entity-changes grid                                                             |
| `AuditEntryId` / `AuditEntityChangeId` | type  | Branded `EntityId` identifiers                                                                          |
| `AuditPage`                            | type  | `PagedResult<AuditEntryResponse>`                                                                       |
| `getAuditLogEntry`                     | fn    | `GET {basePath}/{id}` — entry with full diffs                                                           |
| `getAuditEntriesByCorrelationId`       | fn    | `GET {basePath}/correlation/{correlationId}` — full set                                                 |
| `listEntityAuditTrail`                 | fn    | `GET {basePath}/entity/{entityType}/{entityId}` — paginated                                             |
| `pseudonymizeUserAuditLogs`            | fn    | `POST {basePath}/pseudonymize/{userId}` — GDPR Art. 17                                                  |
| `AuditingPermissions`                  | const | Permission keys (`Auditing.AuditEntries.Read` / `.Manage`)                                              |

## Out of scope / caveats

- **Append-only trail, server-authoritative.** This SDK only reads the trail
  and issues the pseudonymization command; entries are written backend-side as
  a side effect of audited operations — there is no create/update/delete here.
- **Sensitive-value masking is a backend concern.** Property diffs arrive with
  sensitive values already masked as `'***'`; the client never sees the raw
  data and must not attempt to unmask.
- **Pseudonymization is irreversible.** `pseudonymizeUserAuditLogs` SHA-256-hashes
  the user's personal data (UserId, UserName, IpAddress, UserAgent) to preserve
  correlation without re-identification (ISO 27001 A.12.4). It is gated by
  `AuditingPermissions.AuditEntries.Manage` and enforced on the backend — the
  permission constant here is a UX hint, not a security boundary.
- **List grids live in the React layer.** The paginated `audit-entries` and
  `audit-entity-changes` collections (with `/meta`) are query-engine surfaces;
  wire them through [`@granit/react-auditing`](../react-auditing) rather than
  re-implementing the filter/sort contract here.
