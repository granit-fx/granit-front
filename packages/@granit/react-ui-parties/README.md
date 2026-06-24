# @granit/react-ui-parties

Admin **UI feature kit** for the Granit **Parties** module — the visual layer that
renders party management screens: a filterable list, a create flow with
deterministic-duplicate conflict resolution, a tabbed detail view (identity,
addresses, emails, phones, external mappings, roles, metadata, tax status) with
lifecycle actions, vCard download, the duplicate merge wizard, taxonomy tags /
categories, and the duplicates inbox.

This is the top **react-ui** layer of a three-package split over the same .NET
`Granit.Parties` backend (contract: [`contracts/openapi/parties.json`](../../../contracts/openapi/parties.json)):

- [`@granit/parties`](../parties) — framework-agnostic core: DTOs + Axios calls
  (`downloadPartyVCard`, party / address / email / phone / tax DTOs, branded
  `PartyId` family) and the merge contracts re-exported from
  [`@granit/entity-merge`](../entity-merge).
- [`@granit/react-parties`](../react-parties) — React Query hooks + `PartiesProvider`
  plus the headless `MergeWizard` and `DuplicatesInbox`. This kit composes those.
- `@granit/react-ui-parties` (this package) — pages, dialogs, badges, columns and
  zod form schemas. Pure rendering; holds no HTTP or query logic of its own.

It composes the headless [`@granit/react-parties`](../react-parties) with the
foundation UI ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-kit`](../react-ui-admin-kit)), the taxonomy UI
([`@granit/react-taxonomy`](../react-taxonomy) /
[`@granit/react-ui-taxonomy`](../react-ui-taxonomy)) and gates the taxonomy
management actions with [`@granit/react-authorization`](../react-authorization)
`usePermissions`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. The pages assume a `PartiesProvider`
(client + base path), a router, and an i18n instance mounted higher in the tree. A
consumer must declare these peers:

- `@granit/parties` — core DTOs + `downloadPartyVCard` the kit calls directly.
- `@granit/react-parties` — `PartiesProvider`, `usePartiesConfig`, the query/mutation
  hooks, `MergeWizard` and `DuplicatesInbox` the pages wrap.
- `@granit/react-ui` — shadcn-based primitives (`Button`, `Dialog`, `Table`, `Form`,
  `Tabs`, `Badge`, `toast`, …).
- `@granit/react-ui-kit` — `FormDialog`, `TimezonePicker`, `UrlInput`.
- `@granit/react-taxonomy` + `@granit/react-ui-taxonomy` — `TagChipStrip`,
  `CategorySelector`, and `TAXONOMY_PERMISSIONS` / `TAXONOMY_TARGET_TYPES`.
- `@granit/react-authorization` — `usePermissions` for the taxonomy management gate.
- `@granit/react-localization` — `useTranslation` (the `t` function threaded into the
  zod schemas and every label).
- `@granit/api-client` — `isAxiosError` (used to detect the create-conflict 409).
- `@granit/types`, `@granit/utils`, `@granit/logger` — branded ids, `cn`, `createLogger`.
- `react` (`^19`), `react-dom` (`^19`), `react-router-dom` (`^7`) — pages use
  `Link` / `useNavigate` / `useParams`.
- `react-hook-form` (`^7`), `@hookform/resolvers` (`^5`), `zod` (`^4`) — the form layer.
- `@tanstack/react-table` (`^8`) — the list grid.
- `libphonenumber-js` (`^1.13`) — phone-number validation in `partyPhoneSchema`.
- `lucide-react` (`^1.21`) — action icons.

## Quick start

Mount the pages under a `PartiesProvider` and a router, and register the bundled
`Parties.*` strings once. The provider resolves the Axios client and base path; the
pages read everything else from context.

```tsx
import { PartiesProvider } from '@granit/react-parties';
import { useGranitClient } from '@granit/react-api-client';
import {
  PartiesListPage,
  PartyCreatePage,
  PartyDetailPage,
  DuplicatesInboxPage,
  partiesAdminTranslationsEn,
} from '@granit/react-ui-parties';
import { Route, Routes } from 'react-router-dom';

// Register the kit's strings into the default `translation` namespace once.
// The headless package owns `partiesTranslationsEn/Fr` (the in-package
// MergeWizard namespace), hence the `Admin` suffix here.
i18n.addResourceBundle('en', 'translation', partiesAdminTranslationsEn, true, true);

function PartiesRoutes() {
  return (
    <PartiesProvider config={{ client: useGranitClient(), basePath: '/api/v1/parties' }}>
      <Routes>
        <Route path="/parties" element={<PartiesListPage />} />
        <Route path="/parties/new" element={<PartyCreatePage />} />
        <Route path="/parties/:id" element={<PartyDetailPage />} />
        <Route path="/parties/duplicates" element={<DuplicatesInboxPage />} />
      </Routes>
    </PartiesProvider>
  );
}
```

The detail page gates taxonomy tag / category management with `usePermissions`
(`TAXONOMY_PERMISSIONS.TAGS_MANAGE` / `.CATEGORIES_MANAGE`), so the
`AuthorizationProvider` from [`@granit/react-authorization`](../react-authorization)
must also be mounted above these routes. Individual building blocks are exported for
custom screens — e.g. the merge entry point on any party:

```tsx
import { MergeAction } from '@granit/react-ui-parties';

// Opens the party picker, then the headless <MergeWizard> with the chosen
// survivor / loser. `survivorId` is a branded PartyId from @granit/parties.
<MergeAction survivorId={party.id} survivorName={party.name} />;
```

## Public API

The four pages are the primary entry points; the rest are composable pieces of those
pages plus the zod schemas that drive every form.

### Pages

| Symbol                | Kind      | Purpose                                                             |
| --------------------- | --------- | ------------------------------------------------------------------- |
| `PartiesListPage`     | component | Filterable party table (search + role / status filters)            |
| `PartyCreatePage`     | component | Create form + `CreateConflictDialog` for the deterministic-409 flow |
| `PartyDetailPage`     | component | Tabbed detail (8 tabs) + lifecycle, vCard, merge, taxonomy          |
| `DuplicatesInboxPage` | component | Wraps headless `DuplicatesInbox`, drives survivor-pick → merge      |

### List & detail building blocks

| Symbol                 | Kind      | Purpose                                                        |
| ---------------------- | --------- | -------------------------------------------------------------- |
| `createPartyColumns`   | fn        | `ColumnDef<PartyListItemResponse>[]` for the list grid         |
| `PartyStatusBadge`     | component | Colour-coded `Active` / `Suspended` / `Archived` badge         |
| `PartyRolesBadges`     | component | Renders parsed comma-flag roles as badges (`roles` string)     |
| `PartyCreateForm`      | component | Standalone create form (`onSubmit` / `onCancel` / `isPending`) |
| `PartyIdentityForm`    | component | Identity tab edit form bound to a `PartyResponse`              |
| `DownloadVCardButton`  | component | Streams `downloadPartyVCard` and triggers a `.vcf` download    |
| `LifecycleActions`     | component | Suspend / activate / archive (archive behind a confirm dialog) |
| `MergeAction`          | component | Picker → `<MergeWizard>` from a survivor party                 |
| `MergeFromCandidate`   | component | Survivor-pick → `<MergeWizard>` for an inbox candidate pair    |
| `CreateConflictDialog` | component | Use-existing / create-anyway / merge-into on a create 409      |
| `PartyPickerDialog`    | component | Searchable picker that excludes one id and archived parties    |

### Detail tabs

| Symbol                | Kind      | Purpose                                                  |
| --------------------- | --------- | -------------------------------------------------------- |
| `AddressesTab`        | component | List + add / remove party addresses                      |
| `EmailsTab`           | component | List + add / remove party emails                         |
| `PhonesTab`           | component | List + add / remove party phones                         |
| `ExternalMappingsTab` | component | List + add / remove provider mappings                    |
| `RolesTab`            | component | View / assign party roles                                |
| `MetadataTab`         | component | Key/value metadata editor (limits in `metadataLimits`)   |
| `TaxStatusCard`       | component | Tax status summary + edit / clear                        |
| `EditTaxStatusDialog` | component | Edit exempt / reverse-charge / VATIN                     |

### Add-sub-resource dialogs

| Symbol                     | Kind      | Purpose                                                          |
| -------------------------- | --------- | ---------------------------------------------------------------- |
| `PartyAddDialog`           | component | Generic add-dialog shell over `FormDialog` (the others reuse it) |
| `PartyAddDialogProps`      | type      | Props for the generic shell (`form`, `submit`, `successKey`, …)  |
| `AddAddressDialog`         | component | Add an address (`partyId` / `open` / `onOpenChange`)             |
| `AddEmailDialog`           | component | Add an email                                                     |
| `AddPhoneDialog`           | component | Add a phone (libphonenumber validation)                          |
| `AddExternalMappingDialog` | component | Add a provider / external-id mapping                             |
| `AddRoleDialog`            | component | Assign a role to a party                                         |

### Constants

| Symbol                       | Kind  | Purpose                                                  |
| ---------------------------- | ----- | -------------------------------------------------------- |
| `PARTY_KINDS`                | const | `['Individual', 'Company', 'Department']`                |
| `PARTY_STATUSES`             | const | `['Active', 'Suspended', 'Archived']`                    |
| `PARTY_ASSIGNABLE_ROLES`     | const | `['Customer', 'Supplier', 'Employee', 'Lead']`           |
| `ADDRESS_KINDS`              | const | `['Billing', 'Shipping', 'Other']`                       |
| `PHONE_KINDS`                | const | `['Mobile', 'Work', 'Home', 'Other']`                    |
| `PARTY_LIST_ROLE_FILTERS`    | const | `['All', ...PARTY_ASSIGNABLE_ROLES]` for the list filter |
| `PARTY_LIST_STATUS_FILTERS`  | const | `['All', ...PARTY_STATUSES]` for the list filter         |
| `parsePartyRoleFlags`        | fn    | Split a comma-flag role string into known `PartyRole`s   |
| `PartyListRoleFilter`        | type  | `(typeof PARTY_LIST_ROLE_FILTERS)[number]`               |
| `PartyListStatusFilter`      | type  | `(typeof PARTY_LIST_STATUS_FILTERS)[number]`             |

### Validation (zod schema factories + form-value types)

Each schema is a factory taking the `t` function so messages are localized. The
`*FormValues` types are `z.infer` of the matching schema.

| Symbol                         | Kind  | Purpose                                                  |
| ------------------------------ | ----- | -------------------------------------------------------- |
| `partyCreateSchema`            | fn    | Create form (kind, name, currency, role, website, …)     |
| `partyIdentitySchema`          | fn    | Identity edit subset of the create form                  |
| `partyAddressSchema`           | fn    | Address (ISO-3166 country, line / city / postal-code)    |
| `partyEmailSchema`             | fn    | Email (RFC email pipe + optional label / primary)        |
| `partyPhoneSchema`             | fn    | Phone (E.164 via `isValidPhoneNumber`)                   |
| `partyExternalMappingSchema`   | fn    | Provider name + external id                              |
| `partyTaxStatusSchema`         | fn    | Tax status (mutually-exclusive exempt / reverse-charge)  |
| `metadataEntrySchema`          | fn    | Single metadata key/value entry                          |
| `partyLimits`                  | const | `{ nameMax, notesMax }`                                  |
| `metadataLimits`               | const | `{ keyMax, valueMax, entriesMax }`                       |
| `Party*FormValues`             | type  | Inferred values for each schema above                    |

### i18n

| Symbol                       | Kind  | Purpose                                                     |
| ---------------------------- | ----- | ----------------------------------------------------------- |
| `partiesAdminTranslationsEn` | const | English `Parties.*` strings for the `translation` namespace |
| `partiesAdminTranslationsFr` | const | French `Parties.*` strings                                  |

## Caveats

- **Constants mirror the backend enums, by necessity.** `@granit/parties` exports the
  union *types* (`PartyKind`, `PartyStatus`, `PartyRole`, `AddressKind`, `PhoneKind`)
  but not the runtime value arrays, so this package hand-mirrors them one-for-one
  against the .NET source enums (`PartyKind`, `PartyStatus`, `PartyRoles [Flags]`,
  `AddressKind`, `PhoneKind`). Tracked in granit-front issue #393 — once the framework
  publishes the runtime arrays, `constants.ts` becomes a re-export.

- **i18n namespace split is deliberate.** The headless `@granit/react-parties` already
  exports `partiesTranslationsEn/Fr` for its in-package `MergeWizard` namespace; this
  kit exports `partiesAdminTranslationsEn/Fr` (the `Admin` suffix) for the page-level
  `Parties.*` strings. Register both — they are different bundles, not duplicates.

- **Permission checks are a UX hint, not a boundary.** The taxonomy management gate
  uses `usePermissions().hasPermission(...)` purely to hide / disable controls; the
  .NET backend re-checks authorization on every endpoint. Never treat a client-side
  `hasPermission` result as enforcement — see
  [`@granit/react-authorization`](../react-authorization)'s security model.

- **vCard download is a direct Axios call.** `DownloadVCardButton` calls
  `downloadPartyVCard` (not a React Query mutation) and builds an object-URL anchor;
  because the global `MutationCache.onError` toast does not fire for it, the button
  surfaces failures itself. The object-URL is revoked immediately after the click.

- **Create-conflict 409 contract.** The create flow detects a deterministic-duplicate
  match via `isAxiosError(err) && status === 409` with a `candidates` array body
  (`PartyCreateConflictResponse`); any other error defers to the global error toast.

## Out of scope

- **HTTP & query logic** — DTOs, Axios calls and the `PartyId` family live in
  [`@granit/parties`](../parties); React Query hooks, `PartiesProvider`, `MergeWizard`
  and `DuplicatesInbox` live in [`@granit/react-parties`](../react-parties). This kit
  only renders.
- **Merge engine** — the field-conflict resolution, idempotency and preview/commit
  flow are owned by [`@granit/entity-merge`](../entity-merge) and surfaced through the
  headless `MergeWizard`; this package only opens it with a survivor / loser pair.
- **Taxonomy rendering** — tag strips and the category selector come from
  [`@granit/react-ui-taxonomy`](../react-ui-taxonomy); this package only mounts them on
  the detail page behind the permission gate.
- **Provider wiring & routing** — the host app owns `PartiesProvider`,
  `AuthorizationProvider`, the i18n instance and the router; the pages assume all four.

## License

Apache-2.0
