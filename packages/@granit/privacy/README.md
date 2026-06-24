# @granit/privacy

GDPR/CCPA **privacy** SDK — the framework-level TypeScript counterpart of the .NET
`Granit.Privacy` module (mirrored from `contracts/openapi/privacy.json`). It covers
data-subject requests (export, erasure), legal-agreement consent, the applicable
regulation profile, processing purposes, and the CCPA opt-out flow.

This is the framework-agnostic **core** layer: it exposes the DTO types, the Axios HTTP
client, the permission constants, and the static regulation catalogue needed to drive a
privacy flow from any client — React, React Native, a CLI, tests. It holds **no** React,
DOM or Node-only dependency. The React Query hooks and the `PrivacyProvider` live in
[`@granit/react-privacy`](../react-privacy); the admin self-service + DSR pages live in
[`@granit/react-ui-privacy`](../react-ui-privacy).

Every call takes the shared `AxiosInstance` plus a `basePath` (the privacy collection
root, e.g. `/api/v1/privacy`); routes hang off it (`/exports`, `/deletions`,
`/agreements`, `/legal-documents`, `/regulation`, `/purposes`, `/opt-out`). Backend
authorization re-checks every endpoint — the exported `PrivacyPermissions` only gate the
UI (see [Caveats](#caveats)).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published to a
public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  passed into every call.
- `@granit/types` — supplies the branded `ISODateString` used on every timestamp field.

## Quick start

```ts
import {
  requestExport,
  getExportStatus,
  downloadExport,
  requestDeletion,
  cancelDeletion,
  getAgreementStatuses,
  acceptAgreement,
  getApplicableRegulation,
  PrivacyPermissions,
} from '@granit/privacy';

const basePath = '/api/v1/privacy';

// 1. Data export (GDPR Art. 15/20) — async; poll the status, then stream the archive.
const { requestId } = await requestExport(client, basePath, { scopes: ['profile'] });
const status = await getExportStatus(client, basePath, requestId);
if (status.state === 'Completed') {
  const archive = await downloadExport(client, basePath, requestId); // ReadableStream
}

// 2. Data erasure (GDPR Art. 17) — `defer: true` schedules after a cooling-off window.
const deletion = await requestDeletion(client, basePath, {
  reason: 'Account closure',
  defer: true,
});
await cancelDeletion(client, basePath, deletion.requestId); // only while Deferred

// 3. Legal agreements (GDPR Art. 7) — surface un-accepted documents, then accept.
const statuses = await getAgreementStatuses(client, basePath);
const pending = statuses.filter((s) => !s.hasAcceptedLatest);
if (pending[0]) {
  await acceptAgreement(client, basePath, {
    documentId: pending[0].documentId,
    version: pending[0].currentVersion,
  });
}

// 4. The regulation profile drives jurisdiction-aware UI (SAR deadlines, opt-out, GPC).
const profile = await getApplicableRegulation(client, basePath);
const requireExport = PrivacyPermissions.Export.Execute; // 'Privacy.Export.Execute'
```

## Public API

| Symbol                             | Kind  | Purpose                                                        |
| ---------------------------------- | ----- | -------------------------------------------------------------- |
| `requestExport`                    | fn    | `POST {basePath}/exports` → 202 with request id                |
| `getExportStatus`                  | fn    | `GET {basePath}/exports/{requestId}`                           |
| `listExports`                      | fn    | `GET {basePath}/exports` (current user's requests)             |
| `listExportScopes`                 | fn    | `GET {basePath}/exports/scopes` (selectable export scopes)     |
| `requestExportOnBehalfOf`          | fn    | `POST {basePath}/exports/on-behalf-of` (admin DSR)             |
| `downloadExport`                   | fn    | `GET {basePath}/exports/{id}/download` → `ReadableStream`      |
| `downloadExportManifest`           | fn    | `GET .../download/manifest` (shard sidecar)                    |
| `downloadExportShard`              | fn    | `GET .../download/{shardIndex}` (one shard)                    |
| `requestDeletion`                  | fn    | `POST {basePath}/deletions` (erasure; `defer` for cooling-off) |
| `getDeletionStatus`                | fn    | `GET {basePath}/deletions/{requestId}`                         |
| `listDeletions`                    | fn    | `GET {basePath}/deletions`                                     |
| `cancelDeletion`                   | fn    | `POST {basePath}/deletions/{id}/cancel` (409 if executed)      |
| `listAgreementDocuments`           | fn    | `GET {basePath}/agreements/documents`                          |
| `getAgreementStatuses`             | fn    | `GET {basePath}/agreements/status` (per-document acceptance)   |
| `listAgreementHistory`             | fn    | `GET {basePath}/agreements/history`                            |
| `acceptAgreement`                  | fn    | `POST {basePath}/agreements/accept` (422 on version mismatch)  |
| `createLegalDocument`              | fn    | `POST {basePath}/legal-documents` (draft; admin)               |
| `getLegalDocument`                 | fn    | `GET {basePath}/legal-documents/{id}`                          |
| `listLegalDocuments`               | fn    | `GET {basePath}/legal-documents` (optional `documentId`)       |
| `updateLegalDocument`              | fn    | `PUT {basePath}/legal-documents/{id}` (concurrency-stamped)    |
| `publishLegalDocument`             | fn    | `POST .../publish` (auto-archives prior, triggers re-consent)  |
| `getApplicableRegulation`          | fn    | `GET {basePath}/regulation` (tenant regulation profile)        |
| `listProcessingPurposes`           | fn    | `GET {basePath}/purposes`                                      |
| `requestOptOut`                    | fn    | `POST {basePath}/opt-out` (CCPA Do Not Sell/Share)             |
| `getOptOutStatus`                  | fn    | `GET {basePath}/opt-out/status` (auth user or visitor)         |
| `PrivacyPermissions`               | const | Permission-string tree (`Privacy.Export.Execute`, …)           |
| `PRIVACY_REGULATIONS`              | const | Static catalogue of supported regulations (code, tier)         |
| `PrivacyRegulationCode`            | type  | Union of `PRIVACY_REGULATIONS` codes (`'EU_GDPR' \| …`)        |
| `PrivacyExportStatus`              | type  | `Pending \| Completed \| PartiallyCompleted \| TimedOut`       |
| `PrivacyExportRequest`             | type  | Export body (optional `scopes`)                                |
| `PrivacyExportOnBehalfOfRequest`   | type  | Admin DSR body (`subjectUserId` + `scopes`)                    |
| `PrivacyExportRequestResponse`     | type  | 202 ack (`requestId`, `requestedAt`)                           |
| `PrivacyExportStatusResponse`      | type  | Export job state (`subjectUserId` vs `callerUserId`, shards)   |
| `PrivacyExportScopeResponse`       | type  | One selectable export scope (provider, size estimate)          |
| `DeletionState`                    | type  | `Deferred \| Executed \| Cancelled`                            |
| `PrivacyDeletionRequest`           | type  | Erasure body (`reason`, optional `defer`)                      |
| `PrivacyDeletionRequestResponse`   | type  | 202 ack (`requestId`, `scheduledDeletionAt`)                   |
| `PrivacyDeletionStatusResponse`    | type  | Erasure state (cancelled/executed timestamps)                  |
| `PrivacyLegalDocumentResponse`     | type  | Published legal document (id, current version, name)           |
| `PrivacyConsentStatusResponse`     | type  | Per-document acceptance status                                 |
| `PrivacyUserAgreementResponse`     | type  | One acceptance-history entry                                   |
| `PrivacyAcceptAgreementRequest`    | type  | Accept body (`documentId` + `version`)                         |
| `LegalDocumentLifecycleStatus`     | type  | `Draft \| Published \| Archived`                               |
| `LegalDocumentDetailResponse`      | type  | Admin document version (concurrency-stamped)                   |
| `LegalDocumentListParams`          | type  | Admin list filter (optional `documentId`)                      |
| `LegalDocumentCreateRequest`       | type  | Draft create body                                              |
| `LegalDocumentUpdateRequest`       | type  | Draft update body (carries `concurrencyStamp`)                 |
| `PrivacyRegulationProfileResponse` | type  | Tenant regulation profile (SAR deadlines, GPC, transfers)      |
| `PrivacyProcessingPurposeResponse` | type  | One registered processing purpose (legal basis)                |
| `PrivacyOptOutStatusResponse`      | type  | CCPA opt-out status (auth user or visitor)                     |

## Caveats

- **Permissions gate UI, not data.** `PrivacyPermissions` mirrors the .NET
  `PrivacyPermissions` strings so apps can hide controls; the backend re-checks every
  endpoint. `requestExportOnBehalfOf` needs `Privacy.Exports.ExecuteOnBehalfOf`
  server-side — a missing client check is a UX nicety, never a security boundary.
- **Streaming downloads.** `downloadExport*` resolve a `ReadableStream` and are wired with
  `adapter: 'fetch'` + `responseType: 'stream'` per the framework HTTP rule — do not buffer
  the archive into memory. A completed export may be sharded; prefer the manifest +
  per-shard calls over the compat single-shard `downloadExport` for large subjects.
- **Deferred erasure is the cancellable window.** `cancelDeletion` only succeeds while the
  request is `Deferred`; an `Executed` or `Cancelled` request returns 409. Surface the
  `scheduledDeletionAt` cooling-off deadline to the user.
- **`subjectUserId` ≠ `callerUserId`.** In the on-behalf-of (admin DSR) flow these diverge
  on `PrivacyExportStatusResponse`; do not assume an export belongs to the caller.
- **Concurrency stamps, not `If-Match`.** Legal-document admin updates carry
  `concurrencyStamp` in the body (read-modify-write); echo the value from the latest
  `LegalDocumentDetailResponse`, never a stale one.
- **`PRIVACY_REGULATIONS` is a static catalogue, not the active profile.** It lists every
  regulation the framework recognises (with `tier`); the regulation actually in force for
  the current tenant comes from `getApplicableRegulation`.

## Out of scope

- **React Query hooks / `PrivacyProvider`** — [`@granit/react-privacy`](../react-privacy).
- **Self-service + DSR admin pages, legal-document admin UI** —
  [`@granit/react-ui-privacy`](../react-ui-privacy).
- **i18n message mapping** — the React/UI layer owns localized copy; this package returns
  raw DTOs and stable enum/permission strings only.

## License

Apache-2.0
