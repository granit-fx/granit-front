<img src="https://granit-fx.dev/images/granit-icon.svg" alt="" height="32" align="left" style="margin-right:10px" />

# @granit/hostnames

Owner-scoped **managed hostname** SDK — the framework-level TypeScript counterpart
of the .NET `Granit.Hostnames` module
(`contracts/openapi/hostnames.json` is the authoritative wire contract).

This is the framework-agnostic **core** layer: it exposes the DTOs, the Axios API
calls, the OpenAPI-derived validation constraints, and the permission constants
needed to drive custom-domain lifecycle from any client — React, React Native, a
CLI, tests. It holds **no** React, DOM or Node-only dependency. The React
hooks/providers layer lives in [`@granit/react-hostnames`](../react-hostnames),
and the admin feature kit (owner-scoped list, DNS details, status/certificate
badges, add-hostname dialog) in [`@granit/react-ui-hostnames`](../react-ui-hostnames).

A managed hostname binds an arbitrary owner (`ownerType` + `ownerId`) to a custom
domain and tracks its DNS verification and TLS provisioning lifecycle: created
`Pending` → DNS records published → `Verifying` → `Active`, with `expectedDnsRecords`
to publish and `conflicts` explaining why verification is stuck. The
CMS-site-scoped variant — [`@granit/cms-hostnames`](../cms-hostnames) +
[`@granit/react-cms-hostnames`](../react-cms-hostnames) — is a **separate** module
keyed on `/api/cms/sites/{siteId}/hostnames`, not a layer of this package.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/types` — the branded `ISODateString` used by the timestamp fields.
- `@granit/validation` — the `SchemaConstraints` shape backing
  `hostnamesConstraints` (resolved into a form validator via
  `@granit/react-validation`).

## Quick start

```ts
import {
  listHostnames,
  createHostname,
  verifyNow,
  HostnameStatus,
  CertificateStatus,
} from '@granit/hostnames';
import type { ListHostnamesParams } from '@granit/hostnames';

// `basePath` is the module's collection root; the calls are owner-scoped via params.
const basePath = '/api/hostnames';

const params: ListHostnamesParams = { ownerType: 'cms.site', ownerId: ownerUuid };
const hostnames = await listHostnames(client, basePath, params);
const active = hostnames.filter((h) => h.status === HostnameStatus.Active);

// Register a new custom domain, then surface the DNS records the user must publish.
const created = await createHostname(client, basePath, {
  host: 'app.example.com',
  ownerType: 'cms.site',
  ownerId: ownerUuid,
});
const records = created.expectedDnsRecords; // ExpectedDnsRecord[] to add at the registrar

// Once the records are live, trigger an immediate re-check (202 with the updated row).
const checked = await verifyNow(client, basePath, created.id);
if (checked.status === HostnameStatus.Error) {
  // checked.conflicts explains why (MissingTxt, DivergentCname, …)
}
const secured = checked.certificateStatus === CertificateStatus.Secured;
```

## Public API

All API functions take an `AxiosInstance` (from `@granit/api-client`) and a
`basePath` string (the default deployment is `/api/hostnames`).

| Symbol                           | Kind  | Purpose                                                         |
| -------------------------------- | ----- | -------------------------------------------------------------- |
| `ManagedHostnameResponse`        | type  | Full hostname descriptor (status, DNS records, TLS, conflicts) |
| `HostnameStatus`                 | const | `Pending` / `Verifying` / `Active` / `Error` (value + type)    |
| `CertificateStatus`              | const | `Unprovisioned` / `Provisioning` / `Secured` / `Error`         |
| `DnsConflictType`                | const | DNS conflict category (`MissingTxt`, `DivergentCname`, …)      |
| `DnsRecordType`                  | type  | One of `A`, `Aaaa`, `Cname`, `Txt`                             |
| `ExpectedDnsRecord`              | type  | A DNS record to publish for ownership verification             |
| `DnsConflict`                    | type  | A conflict blocking activation (`conflictType` + `details`)    |
| `CreateManagedHostnameRequest`   | type  | `POST {basePath}` body (host, owner, optional primary)         |
| `ListHostnamesParams`            | type  | `GET {basePath}` query (`ownerType`, `ownerId`, `maxResults`)  |
| `HostnameAvailabilityResponse`   | type  | `{ host, isAvailable }`                                         |
| `ReportCertificateStatusRequest` | type  | `POST .../certificate-status` body (provider webhook)          |
| `listHostnames`                  | fn    | `GET {basePath}` — owner-scoped, capped at `maxResults`        |
| `getHostname`                    | fn    | `GET {basePath}/{id}`                                           |
| `createHostname`                 | fn    | `POST {basePath}`                                               |
| `setPrimary`                     | fn    | `POST {basePath}/{id}/primary` (204)                           |
| `clearPrimary`                   | fn    | `DELETE {basePath}/{id}/primary` (204)                         |
| `deleteHostname`                 | fn    | `DELETE {basePath}/{id}`                                        |
| `checkAvailability`              | fn    | `GET {basePath}/availability?host=`                            |
| `verifyNow`                      | fn    | `POST {basePath}/{id}/verify-now` (202, updated row)           |
| `reportCertificateStatus`        | fn    | `POST {basePath}/{id}/certificate-status` — host-level webhook |
| `hostnamesConstraints`           | const | OpenAPI-derived `SchemaConstraints` for request validation     |
| `HostnamesPermissions`           | const | Permission string constants (`Hostnames.Hostnames.Read`, …)    |

`HostnamesPermissions` carries three strings: `Hostnames.Hostnames.Read`
(list/detail/availability), `Hostnames.Hostnames.Manage` (create/delete/verify),
and `Hostnames.Certificates.Report` (the certificate-status webhook).

## Caveats

- **`hostnamesConstraints` is generated — never hand-edit.** It is produced by
  `scripts/generate-front-constraints.mjs` from `contracts/openapi/hostnames.json`
  and regenerated on pre-commit. Feed it through `createConstraintsResolver`
  (`@granit/react-validation`) rather than re-deriving Zod by hand; the OpenAPI
  spec is the single source of truth.
- **Optionality follows the contract, not nullability.** Per the framework
  mirroring rule, `?` on request fields comes from the OpenAPI `required` array.
  Nullable response fields (`tenantId`, `verificationToken`, `lastCheckedAt`,
  `nextCheckAt`, `certExpiresAt`, `modifiedAt`, `modifiedBy`) are `T | null`
  required keys — present but possibly `null`.
- **Optimistic concurrency.** `ManagedHostnameResponse.concurrencyStamp` follows
  the framework convention (body-field stamp + `409` on mismatch, never
  `If-Match`); echo it back on mutating requests where the backend expects it.
- **`reportCertificateStatus` is a provider-facing webhook.** It is gated by the
  distinct `Hostnames.Certificates.Report` permission and is normally called by
  the certificate-provisioning service, not interactive admin UIs.
- **i18n is the caller's job.** This core layer ships no locales; the React/UI
  packages own status labels and conflict-message mapping.

## License

Apache-2.0
