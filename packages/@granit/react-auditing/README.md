# @granit/react-auditing

React hooks and providers for the **Granit.Auditing** audit trail — the React
binding layer over the framework-agnostic
[`@granit/auditing`](../auditing) core SDK (TypeScript counterpart of the .NET
`Granit.Auditing` module, contract `contracts/openapi/auditing.json`).

This is the **headless** React layer: it wires the audit base path and Axios
client through context, exposes the two QueryEngine list grids (audit-entries
and audit-entity-changes) plus the point-lookup / GDPR hooks, and holds no
presentation. The framework-agnostic types, HTTP client and permission catalog
live in [`@granit/auditing`](../auditing); the admin list/detail pages,
columns and badges live in [`@granit/react-ui-auditing`](../react-ui-auditing).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for direct app consumption. Declare these peers:

- `@granit/auditing` — the core SDK (wire types, point-lookup HTTP client).
- `@granit/api-client` — the centralized Axios instance (CSRF, auth, tenant).
- `@granit/react-api-client` — supplies `GranitClientProvider` /
  `useOptionalGranitClient` so the provider can resolve the client from context.
- `@granit/query-engine` + `@granit/react-query-engine` — the filter / sort /
  pagination grid surfaces (`QueryProvider`, `useQueryEndpoint`, `useQueryMeta`).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).

`msw` (`^2`) is an optional peer, only needed by the `@granit/react-auditing/testing`
subpath (MSW handlers + fixtures).

## Quick start

```tsx
import {
  AuditLogProvider,
  useAuditEntries,
  useAuditLogEntry,
  usePseudonymizeUserAuditLogs,
} from '@granit/react-auditing';

// `client` is resolved from config.client or a parent <GranitClientProvider>;
// basePath defaults to `/api/v1/auditing`.
function AuditScreen() {
  return (
    <AuditLogProvider config={{ basePath: '/api/v1/auditing' }}>
      <AuditTable />
    </AuditLogProvider>
  );
}

function AuditTable() {
  // QueryEngine grid: filters are serialized as `filter[field.op]=value`.
  const audit = useAuditEntries();
  audit.addFilter({ field: 'category', operator: 'Eq', value: 'DataMutation' });

  return (
    <ul>
      {audit.query.data?.items.map((e) => (
        <li key={e.id}>{e.userName}</li>
      ))}
    </ul>
  );
}

function EntryDetail({ id, userId }: { id: string; userId: string }) {
  const { data: entry } = useAuditLogEntry(id); // AuditEntryDetailResponse + diffs
  const pseudonymize = usePseudonymizeUserAuditLogs(); // GDPR Art. 17
  return (
    <section>
      <code>{entry?.correlationId}</code>
      <button onClick={() => pseudonymize.mutate(userId)}>Pseudonymize user</button>
    </section>
  );
}
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `AuditLogProvider` | provider | Resolves client + `basePath`, wires `{basePath}/audit-entries` QueryEngine grid |
| `AuditLogConfig` | type | Provider config: `client?`, `basePath`, `queryKeyPrefix?` |
| `AuditLogProviderProps` | type | Props for `AuditLogProvider` (`basePath` optional, defaults applied) |
| `useAuditLogConfig` | hook | Resolved config (`client`, `basePath`) from the nearest provider |
| `AuditEntityChangesProvider` | provider | Wires the `{basePath}/audit-entity-changes` QueryEngine grid |
| `AuditEntityChangesProviderProps` | type | Props for `AuditEntityChangesProvider` (`client?`, `basePath?`) |
| `useAuditEntries` | hook | QueryEngine endpoint over `AuditEntryResponse` (filter/sort/page/group-by) |
| `useAuditEntriesMeta` | hook | Query metadata (columns, filterable/sortable fields) for audit-entries |
| `useAuditEntityChanges` | hook | QueryEngine endpoint over `AuditEntityChangeSummaryResponse` |
| `useAuditEntityChangesMeta` | hook | Query metadata for the audit entity-changes surface |
| `useAuditLogEntry` | hook | Single entry by id (`AuditEntryDetailResponse`, includes per-property diffs) |
| `useEntityAuditTrail` | hook | Paginated audit trail for one `(entityType, entityId)` pair (`AuditPage`) |
| `useAuditEntriesByCorrelation` | hook | All detail entries sharing a tracing correlation id, newest-first |
| `usePseudonymizeUserAuditLogs` | hook | GDPR Art. 17 mutation: SHA-256-pseudonymize one user's entries, then invalidate |

### `@granit/react-auditing/testing`

MSW handlers and fixtures for consumers that test against the audit surfaces
(import these — never hand-roll DTOs inline):

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `mockAuditEntries` | const | Fixture array of `AuditEntryResponse` |
| `mockAuditEntityChanges` | const | Fixture array of audit entity-change rows |
| `auditEntryQueryMetadata` | const | `QueryMetadata` for the audit-entries grid |
| `auditEntityChangeQueryMetadata` | const | `QueryMetadata` for the audit entity-changes grid |
| `createAuditHandlers` | fn | MSW handlers for `{baseUrl}/audit-entries` (list/meta + lookups) |
| `createAuditEntityChangesHandlers` | fn | MSW handlers for `{baseUrl}/audit-entity-changes` |

## Out of scope / caveats

- **Provider is mandatory.** Every hook here reads context. `useAuditEntries` /
  `useAuditLogEntry` / `useEntityAuditTrail` / `useAuditEntriesByCorrelation` /
  `usePseudonymizeUserAuditLogs` require an `AuditLogProvider`;
  `useAuditEntityChanges` requires an `AuditEntityChangesProvider`. The provider
  throws if no Axios client can be resolved from `config.client` or a parent
  `<GranitClientProvider>`.

- **QueryEngine filters vs. legacy params.** `useAuditEntries` /
  `useAuditEntityChanges` drive real backend filtering via the QueryEngine
  (`filter[field.op]=value`). Use the dispatchers (`addFilter`, sort, page,
  group-by) on the returned object — there is no flat `params` list hook in the
  barrel.

- **Pseudonymization is irreversible (GDPR Art. 17).**
  `usePseudonymizeUserAuditLogs` replaces a user's personal data with a SHA-256
  hash to preserve audit-trail correlation without re-identification. It cannot
  be undone; the underlying entries stay append-only. On success it invalidates
  both the custom-lookup cache and the QueryEngine list/meta cache.

- **Audit entries are append-only.** This package only reads the trail and runs
  the pseudonymization command. There is no create/update/delete surface —
  entries are written server-side by `Granit.Auditing`.

- **No presentation.** Columns, category / change-type badges and the
  list/detail pages live in [`@granit/react-ui-auditing`](../react-ui-auditing);
  this package stays free of UI.

- **Permission checks are a UX hint, not enforcement.** The audit read /
  pseudonymize permissions (`AuditingPermissions` in [`@granit/auditing`](../auditing))
  gate controls client-side; the .NET backend re-checks every request.

## License

Apache-2.0
