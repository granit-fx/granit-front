# @granit/parties

Parties (Tiers / Business Partners) domain SDK — the framework-level TypeScript
counterpart of the .NET `Granit.Parties` module (contract:
[`contracts/openapi/parties.json`](../../../contracts/openapi/parties.json)).

This is the framework-agnostic **core** layer: it exposes the wire types and the
Axios-bound API functions that drive a party aggregate from any client — React,
React Native, a CLI, tests. It holds **no** React, DOM or Node-only dependency.
The React Query hooks, `PartiesProvider` and merge wizard live in
[`@granit/react-parties`](../react-parties); the admin feature kit (party list,
tabbed detail view, duplicates inbox) lives in
[`@granit/react-ui-parties`](../react-ui-parties). The merge primitives are
re-exported from the aggregate-agnostic [`@granit/entity-merge`](../entity-merge),
specialised here with the branded `PartyId`.

A party is a unified Tier / Business Partner aggregate (individual, company or
department) that simultaneously plays roles (Customer, Supplier, Employee, Lead),
carries typed contact channels (addresses, emails, phones), polyglot external
mappings (Stripe / Mollie / Odoo), a customer-specific tax status, free-form
metadata and a suspend → activate → archive lifecycle. Creation runs a Tier-1
deterministic duplicate check; a separate 3-tier pipeline feeds the duplicates
inbox and the two-aggregate merge flow.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/entity-merge` — the aggregate-agnostic merge client `mergeParty` /
  `previewPartyMerge` delegate to.
- `@granit/types` — branded id and `ISODateString` primitives used by the DTOs.

## Quick start

```ts
import {
  createParty,
  getPartyById,
  listParties,
  previewPartyMerge,
  mergeParty,
  PartiesPermissions,
} from '@granit/parties';
import type { AxiosInstance } from '@granit/api-client';
import type { PartyId, PartyCreateRequest } from '@granit/parties';

// `basePath` is the parties collection root for the active scope.
const basePath = '/api/v1/parties';

declare const client: AxiosInstance;

// List the customers in scope (server returns a MapGranitQuery paged envelope;
// the wrapper unwraps `items`).
const customers = await listParties(client, basePath, { role: 'Customer' });

// Create a party. A Tier-1 deterministic duplicate match throws a 409 whose
// `error.response.data` is a PartyCreateConflictResponse; pass `{ force: true }`
// to retry through it.
const request: PartyCreateRequest = {
  kind: 'Company',
  name: 'Acme Corp',
  defaultCurrency: 'EUR',
  roles: 'Customer',
};
const created = await createParty(client, basePath, request);

// Read it back.
const party = await getPartyById(client, basePath, created.id);

// Deduplicate: dry-run preview, then commit the live merge.
const survivorId = created.id;
const loserId = '…' as PartyId;
const preview = await previewPartyMerge(client, basePath, survivorId, loserId);
const result = await mergeParty(
  client,
  basePath,
  survivorId,
  { loserId, choices: {}, reason: 'Duplicate cleanup' },
  crypto.randomUUID() // optional Idempotency-Key — makes retries safe
);
// result.rewriteCounts: { 'Invoice.PartyId': 12, … } — the merged party itself
// is absent; refetch the survivor via getPartyById.

// Gate admin UI on the right permission constant.
const canMerge = PartiesPermissions.Parties.Merge; // 'Parties.Parties.Merge'
```

## Public API

### Lifecycle, identity & contact channels

| Symbol                       | Kind | Purpose                                                                           |
| ---------------------------- | ---- | --------------------------------------------------------------------------------- |
| `listParties`                | fn   | `GET {basePath}` — paged list, optional `role` filter (unwraps `items`)           |
| `getPartyById`               | fn   | `GET {basePath}/{id}` — full `PartyResponse`                                      |
| `createParty`                | fn   | `POST {basePath}` — 409 on Tier-1 duplicate; `force` / `skipDuplicateCheck` knobs |
| `updateParty`                | fn   | `PATCH {basePath}/{id}` — identity fields                                         |
| `suspendParty`               | fn   | `POST {basePath}/{id}/suspend` (idempotent; 409 on Archived)                      |
| `activateParty`              | fn   | `POST {basePath}/{id}/activate` (idempotent)                                      |
| `archiveParty`               | fn   | `POST {basePath}/{id}/archive` — terminal, idempotent                             |
| `addPartyAddress`            | fn   | `POST {basePath}/{id}/addresses`                                                  |
| `removePartyAddress`         | fn   | `DELETE {basePath}/{id}/addresses/{addressId}` (idempotent)                       |
| `addPartyEmail`              | fn   | `POST {basePath}/{id}/emails`                                                     |
| `removePartyEmail`           | fn   | `DELETE {basePath}/{id}/emails/{emailId}` (idempotent)                            |
| `addPartyPhone`              | fn   | `POST {basePath}/{id}/phones`                                                     |
| `removePartyPhone`           | fn   | `DELETE {basePath}/{id}/phones/{phoneId}` (idempotent)                            |
| `addPartyRole`               | fn   | `POST {basePath}/{id}/roles` (idempotent)                                         |
| `removePartyRole`            | fn   | `DELETE {basePath}/{id}/roles/{role}` (idempotent)                                |
| `addPartyExternalMapping`    | fn   | `POST {basePath}/{id}/external-mappings` (409 on duplicate provider)              |
| `removePartyExternalMapping` | fn   | `DELETE {basePath}/{id}/external-mappings/{providerName}` (idempotent)            |
| `setPartyTaxStatus`          | fn   | `PUT {basePath}/{id}/tax-status`                                                  |
| `clearPartyTaxStatus`        | fn   | `DELETE {basePath}/{id}/tax-status` (idempotent)                                  |
| `replacePartyMetadata`       | fn   | `PUT {basePath}/{id}/metadata` — bulk replace (≤ 50 entries)                      |
| `downloadPartyVCard`         | fn   | `GET {basePath}/{id}/vcard` — `Blob` (vCard 4.0, RFC 6350)                        |

### Merge & duplicate detection

| Symbol                    | Kind | Purpose                                                             |
| ------------------------- | ---- | ------------------------------------------------------------------- |
| `previewPartyMerge`       | fn   | `GET {basePath}/{survivorId}/merge/preview?loserId=` — dry-run      |
| `mergeParty`              | fn   | `POST {basePath}/{survivorId}/merge` (+ optional `Idempotency-Key`) |
| `listDuplicatesForParty`  | fn   | `GET {basePath}/{id}/duplicate-candidates` — flat per-party list    |
| `dismissPartyDuplicate`   | fn   | `POST {basePath}/duplicates/{id}/dismiss` (idempotent)              |
| `mergePartyFromDuplicate` | fn   | `POST {basePath}/duplicates/{id}/merge` — loser inferred from row   |

### Types & constants

| Symbol | Kind | Purpose | | |
| ------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------- | | |
| `PartyResponse` | type | Full party aggregate from the admin API | | |
| `PartyListItemResponse` | type | Lightweight list-row summary | | |
| `PartyCreateRequest` / `PartyUpdateRequest` | type | Create / identity-update payloads | | |
| `CreatePartyOptions` | type | `force` (URL) / `skipDuplicateCheck` (header) knobs | | |
| `PartyCreateConflictResponse` | type | 409 body on a Tier-1 duplicate match | | |
| `PartyCreateDuplicateCandidate` | type | One match summary inside the 409 body | | |
| `PartyAddress* / PartyEmail* / PartyPhone*` | type | Typed contact-channel sub-DTOs + requests | | |
| `PartyExternalMapping*` | type | Polyglot external-provider mapping DTOs | | |
| `PartyTaxStatus* / PartyMetadataRequest / PartySuspendRequest` | type | Tax status, metadata, suspend payloads | | |
| `PartyRoleRequest` | type | Single role-flag add/remove payload | | |
| `PartyKind` / `PartyStatus` / `PartyRole` | type | Aggregate discriminator string-union enums | | |
| `AddressKind` / `PhoneKind` | type | Contact-channel discriminators | | |
| `PartyMergeRequest` / `PartyMergeResponse` | type | `entity-merge` contracts branded with `PartyId` | | |
| `MergeWinner` / `FieldConflictResponse` | type | Aliases of `WinnerSide` / `FieldConflict` | | |
| `DuplicateMatchTier` | type | `Deterministic \                                                                             | Blocking \ | Fuzzy` |
| `DuplicateMatchSignalResponse` | type | One weighted signal under a candidate | | |
| `PartyDuplicateCandidateResponse` | type | Duplicate-inbox review row | | |
| `PartyDuplicateMergeRequest` | type | One-click merge-from-row payload | | |
| `PartyId` / `PartyAddressId` / `PartyEmailId` / `PartyPhoneId` | type | Branded `EntityId<…>` identifiers | | |
| `PartyExternalMappingId` / `PartyDuplicateCandidateId` / `EvidenceBlobId` | type | Branded `EntityId<…>` identifiers | | |
| `PartiesPermissions` | const | Permission keys (`Read`, `Manage`, `Lifecycle`, `SetTaxStatus`, `ExternalMappings`, `Merge`) | | |

## Caveats

- **`roles` is a flags string, not an array.** `PartyResponse.roles` and the
  `role` list filter carry the `System.Text.Json` `[Flags]` serialisation — a
  single value (`"Customer"`) or comma-separated list (`"Customer, Supplier"`).
  `PartyRole` enumerates the individual flags; there is deliberately no
  `PartyRoles = string` alias (Sonar S6564).
- **Optionality follows the OpenAPI `required` array, not nullability.** A
  required-but-nullable field is `foo: T | null` (e.g. `tenantId`, `language`,
  `modifiedAt`); a C#-defaulted field is `foo?: T`. The two axes are independent.
- **`modifiedAt` is `null` until first modification** — coalesce with
  `?? createdAt` when displaying a last-touched timestamp.
- **Never store PII in `metadata` or `internalNotes`.** Both surface in audit
  logs and GDPR exports; `metadata` is capped at 50 entries (key ≤ 40 chars,
  value ≤ 500 chars) and `internalNotes` at 8 000 chars.
- **Merge omits the survivor aggregate.** `PartyMergeResponse` (preview and
  commit) carries only `rewriteCounts` and conflict data — refetch the survivor
  via `getPartyById` after a live merge.
- **Idempotency-key reuse.** Pass a fresh UUID per distinct merge submission;
  reusing a key with a different payload returns 409 server-side.
- **Permissions are a UX hint, not a boundary.** `PartiesPermissions` mirrors the
  backend keys for hiding controls; the .NET `Granit.Parties` endpoints remain the
  sole authority. `Lifecycle`, `SetTaxStatus`, `ExternalMappings` and `Merge` are
  deliberately split from `Manage` for least-privilege (ISO 27001 A.5.15).

## Out of scope

- **React Query hooks, `PartiesProvider`, merge wizard** — see
  [`@granit/react-parties`](../react-parties).
- **Admin UI (list, tabbed detail, duplicates inbox)** — see
  [`@granit/react-ui-parties`](../react-ui-parties).
- **Paginated/filterable duplicates inbox** — backed by the QueryEngine endpoint
  `GET /parties/duplicates`; consume it via `useQueryEndpoint` from
  `@granit/react-query-engine`, not a wrapper here. The flat
  `listDuplicatesForParty` covers only the per-party listing.

## License

Apache-2.0
