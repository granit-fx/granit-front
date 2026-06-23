# @granit/react-ui-parties

Admin UI for the **Parties** module — manage parties (individuals / companies /
departments), their contact channels and lifecycle:

- **List** (`PartiesListPage`) — searchable party table with role / status
  filters.
- **Create** (`PartyCreatePage`) — zod-validated create form with
  deterministic-duplicate (409) conflict resolution: use existing, create
  anyway, or merge into an existing party.
- **Detail** (`PartyDetailPage`) — tabbed view (identity, addresses, emails,
  phones, external mappings, roles, metadata, tax status), lifecycle actions
  (suspend / activate / archive), vCard download, the duplicate merge wizard and
  taxonomy tags / categories.
- **Duplicates inbox** (`DuplicatesInboxPage`) — review duplicate candidates and
  drive the survivor-picker → merge-wizard flow.

The **visual** layer for parties: it composes the headless
[`@granit/react-parties`](../react-parties) (provider + hooks + `MergeWizard` /
`DuplicatesInbox`) with the foundation UI packages
([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)), the taxonomy UI
([`@granit/react-taxonomy`](../react-taxonomy) /
[`@granit/react-ui-taxonomy`](../react-ui-taxonomy)) and gates management actions
with [`@granit/react-authorization`](../react-authorization) `usePermissions`.

## Usage

```tsx
import { PartiesListPage, partiesAdminTranslationsEn } from '@granit/react-ui-parties';

i18n.addResourceBundle('en', 'translation', partiesAdminTranslationsEn, true, true);

// Mount under a PartiesProvider (from @granit/react-parties) and a router:
<Route path="/parties" element={<PartiesListPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` / `PartiesProvider`
  higher in the tree (via the `@granit/react-parties` hooks and the
  `usePartiesConfig` client for the streamed vCard download). No client baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  taxonomy tag / category management on the detail page
  (`TAXONOMY_PERMISSIONS.TAGS_MANAGE` / `.CATEGORIES_MANAGE`).
- **Routing** — the pages use `react-router-dom`
  (`Link` / `useNavigate` / `useParams`); mount them under a router.
- **i18n** — ships its `Parties.*` strings as `partiesAdminTranslationsEn/Fr`
  (the headless package already exports `partiesTranslationsEn/Fr` for the
  in-package MergeWizard namespace, hence the `Admin` suffix); the host
  registers them in the `translation` namespace.
