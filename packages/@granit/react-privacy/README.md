# @granit/react-privacy

React hooks + provider for the Granit **privacy** (GDPR/CCPA) module — data-subject
exports, deletion (right to erasure), legal-agreement acceptance, opt-out, and
legal-document admin. This is the **React hooks layer**: it wraps the
framework-agnostic Axios calls and DTOs from [`@granit/privacy`](../privacy) in
TanStack Query hooks behind a shared `PrivacyProvider` for client/base-path/query-key
configuration. It holds no rendering — panels, tables, and forms live one layer up.

The split is three packages over the same .NET `Granit.Privacy` backend (contract:
`contracts/openapi/privacy.json`):

- [`@granit/privacy`](../privacy) — framework-agnostic core: DTOs + Axios functions
  (`listExports`, `requestDeletion`, `getApplicableRegulation`, …), `PrivacyPermissions`,
  and the `PRIVACY_REGULATIONS` table.
- `@granit/react-privacy` (this package) — React Query hooks + provider.
- [`@granit/react-ui-privacy`](../react-ui-privacy) — admin/self-service UI kit built on
  these hooks.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published for
app consumption through a public registry. A consumer must declare these peers:

- `@granit/privacy` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for the
  Axios client when `config.client` is omitted.
- `@granit/types` — shared base types.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` / `@granit/react-query-engine` (**optional**) — query surfaces
  for the export/deletion/legal-document discovery grids.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-privacy/testing` subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { PrivacyProvider, useAgreementStatuses, useRequestExport } from '@granit/react-privacy';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <PrivacyProvider config={{ client: useGranitClient() }}>
      {children}
    </PrivacyProvider>
  );
}

function PrivacyCenter() {
  const { data: agreements } = useAgreementStatuses();
  const requestExport = useRequestExport();

  return (
    <>
      <button type="button" onClick={() => requestExport.mutate()}>
        Export my data
      </button>
      <ul>
        {agreements?.map((a) => (
          <li key={a.documentId}>{a.accepted ? 'Accepted' : 'Pending'}</li>
        ))}
      </ul>
    </>
  );
}
```

Exports are asynchronous: `useRequestExport()` returns a `{ requestId }`, then
`usePrivacyExportStatus(requestId, { pollingInterval })` polls until the archive is
ready (the actual download/manifest/shard streaming lives in `@granit/privacy`). Deferred
deletions follow the same request → status → optional `useCancelDeletion()` (cooling-off
period) shape. Admin DSR flows use `useRequestExportOnBehalfOf()`; legal-document authoring
uses the `useLegalDocuments` / `useCreateLegalDocument` / `useUpdateLegalDocument` /
`usePublishLegalDocument` set.

## Public API

| Symbol                         | Kind     | Purpose                                                           |
| ------------------------------ | -------- | ----------------------------------------------------------------- |
| `PrivacyProvider`              | provider | Supplies client, base path, query-key prefix to all hooks below   |
| `usePrivacyConfig`             | hook     | Read the resolved config; throws outside a provider               |
| `buildPrivacyQueryKey`         | fn       | Query-key factory honoring the configured `queryKeyPrefix`        |
| `usePrivacyExports`            | hook     | `GET .../exports` — current user's export requests                |
| `usePrivacyExportStatus`       | hook     | Poll one export request (`{ pollingInterval }`)                   |
| `useRequestExport`             | hook     | `POST .../exports` — request a GDPR data export                   |
| `useExportScopes`              | hook     | `GET .../exports/scopes` — available export scopes for the tenant |
| `useRequestExportOnBehalfOf`   | hook     | Admin DSR export for another data subject                         |
| `useDeletionRequests`          | hook     | `GET .../deletion` — current user's deletion requests             |
| `useDeletionStatus`            | hook     | Status of one deletion request                                    |
| `useRequestDeletion`           | hook     | Request erasure of personal data (GDPR Art. 17)                   |
| `useCancelDeletion`            | hook     | Cancel a deferred deletion during the cooling-off period          |
| `useAgreementDocuments`        | hook     | `GET .../agreements/documents` — published legal documents        |
| `useAgreementStatuses`         | hook     | Per-document acceptance status for the current user               |
| `useAgreementHistory`          | hook     | Full acceptance history for the current user                      |
| `useAcceptAgreement`           | hook     | Accept a legal-document version                                   |
| `useApplicableRegulation`      | hook     | Privacy regulation profile applicable to the current tenant       |
| `useProcessingPurposes`        | hook     | `GET .../purposes` — processing purposes for the tenant           |
| `useOptOutStatus`              | hook     | CCPA "Do Not Sell or Share" opt-out status                        |
| `useRequestOptOut`             | hook     | Opt out of data sale/sharing (CCPA)                               |
| `useLegalDocuments`            | hook     | `GET .../legal-documents` (admin) — versions, optional filter     |
| `useLegalDocument`             | hook     | One legal-document version by id (disabled when id empty)         |
| `useCreateLegalDocument`       | hook     | Create a legal-document draft (admin)                             |
| `useUpdateLegalDocument`       | hook     | Update a draft (`{ id, request }` variables)                      |
| `usePublishLegalDocument`      | hook     | Publish a draft version (admin)                                   |
| `PrivacyConfig`                | type     | Provider input (optional client / basePath / queryKeyPrefix)      |
| `PrivacyProviderProps`         | type     | `{ config, children }`                                            |
| `UpdateLegalDocumentVariables` | type     | `{ id, request }` for `useUpdateLegalDocument`                    |

Query hooks return TanStack `UseQueryResult`; mutation hooks return `UseMutationResult`
and invalidate the relevant `buildPrivacyQueryKey` branch (`exports`, `deletion`,
`agreements`, `opt-out`, `legal-documents`) on success.

`./testing` subpath (requires the optional `msw` peer): `createPrivacyHandlers` (stateful
MSW handlers, default base `/api/v1/privacy`), the `privacyExportQueryMetadata` /
`privacyDeletionQueryMetadata` / `legalDocumentQueryMetadata` grid metadata, plus the
`mockExports`, `mockDeletionRequests`, `mockAgreementStatuses`, `mockAgreementHistory`,
`mockLegalDocuments`, and `mockLegalDocumentDetails` fixtures.

## Out of scope / caveats

- **Rendering** — self-service privacy centers and legal-document admin screens live in
  [`@granit/react-ui-privacy`](../react-ui-privacy). This package is headless.
- **DTOs, HTTP transport, and export-archive streaming** — owned by
  [`@granit/privacy`](../privacy) (mirror of `Granit.Privacy`). The export
  download/manifest/shard functions (`downloadExport`, `downloadExportManifest`,
  `downloadExportShard`) are not wrapped as hooks here; call them directly from the core
  package once `usePrivacyExportStatus` reports the archive is ready.
- **Permission gating is a UX hint, not a security boundary.** `PrivacyPermissions`
  (re-exported from `@granit/privacy`) helps hide admin DSR / legal-document controls the
  user cannot use; the .NET backend re-checks authorization on every endpoint. Never fetch
  a data subject's export and hide it client-side — if the caller is not authorized, the
  server must not send it.
- **Erasure is a backend concern.** `useRequestDeletion` only *requests* erasure; the
  cascade, retention exemptions, and cooling-off window are enforced by `Granit.Privacy`.
  Treat a cancelled request as best-effort until the status confirms it.

## License

Apache-2.0
