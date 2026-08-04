# @granit/react-ui-documents

Admin **UI feature kit** for the Granit Documents module — the documents explorer
(folder tree, list / grid views, upload, inspector, quota badge), the per-document
detail view (versions, shares, tags / categories) and the supporting pages:
metadata (properties), public links, renditions, asset resolution, trash bin and
storage quota. Each export is a route-ready page component; you mount them in your
router and register their i18n bundle.

This is the **visual** (`react-ui`) layer, top of a three-package split over the
.NET `Granit.Documents` backend (contracts under `contracts/openapi/documents*.json`):

- [`@granit/documents`](../documents) — framework-agnostic core: DTOs + Axios calls.
- [`@granit/react-documents`](../react-documents) — React Query hooks, the
  `DocumentsProvider`, and the headless, label-driven components (`DocumentsExplorer`,
  `DocumentDetail`, `VersionsTimeline`, `ShareDialog`, `QuotaPanel`, `TrashBin`, …).
- `@granit/react-ui-documents` (this package) — composes those headless pieces with
  the foundation UI ([`@granit/react-ui`](../react-ui)), the taxonomy widgets
  ([`@granit/react-taxonomy`](../react-taxonomy) +
  [`@granit/react-ui-taxonomy`](../react-ui-taxonomy)) and gates management actions
  with [`@granit/react-authorization`](../react-authorization) `usePermissions`.

The pages own no data fetching of their own: they read the permission set, resolve
i18n labels, and pass both into the headless components — which in turn resolve the
Axios client and base path from the provider tree.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. A consumer must mount these providers
higher in the tree and declare these peers:

- `@granit/documents` — core permission catalog (re-exported here as
  `DOCUMENTS_PERMISSIONS`) and shared DTOs (`PublicLinkScope`, `RenditionType`, …).
- `@granit/react-documents` — headless components + hooks these pages compose;
  needs a `DocumentsProvider` (or an ambient `GranitClientProvider`) in the tree.
- `@granit/react-authorization` — `usePermissions` gating; needs an
  `AuthorizationProvider` in the tree.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-taxonomy` + `@granit/react-ui-taxonomy` — the tag-chip strip and
  category selector on the detail page.
- `@granit/react-ui` — the foundation `Button` and design tokens.
- `react` / `react-dom` (`^19`) and `react-router` (`^7.18`) — the pages use
  `Link` / `useParams` / `useNavigate` for explorer-to-detail navigation.

## Quick start

Register the admin i18n bundle once, then mount the pages under a router that already
sits inside the documents, authorization, and Granit-client providers.

```tsx
import {
  DocumentsExplorerPage,
  DocumentDetailPage,
  DocumentPropertiesPage,
  DocumentPublicLinksPage,
  DocumentRenditionsPage,
  DocumentResolutionPage,
  TrashBinPage,
  StorageQuotaPage,
  DOCUMENTS_PERMISSIONS,
  documentsAdminTranslationsEn,
} from '@granit/react-ui-documents';
import { Route, Routes } from 'react-router';

// Flat `documents:*` admin strings — host owns registration (merge, deep-merge).
i18n.addResourceBundle('en', 'translation', documentsAdminTranslationsEn, true, true);

// The pages read the Axios client + DocumentsProvider config from the tree; no
// client is baked in. `:id` is read via react-router `useParams`.
function DocumentsRoutes() {
  return (
    <Routes>
      <Route path="/documents" element={<DocumentsExplorerPage />} />
      <Route path="/documents/:id" element={<DocumentDetailPage />} />
      <Route path="/documents/:id/metadata" element={<DocumentPropertiesPage />} />
      <Route path="/documents/:id/public-links" element={<DocumentPublicLinksPage />} />
      <Route path="/documents/:id/renditions" element={<DocumentRenditionsPage />} />
      <Route path="/documents/resolution" element={<DocumentResolutionPage />} />
      <Route path="/documents/trash" element={<TrashBinPage />} />
      <Route path="/documents/quota" element={<StorageQuotaPage />} />
    </Routes>
  );
}

// Gate the nav entry with the same permission the explorer checks internally.
// hasPermission(DOCUMENTS_PERMISSIONS.Documents.Read) → show the menu item.
```

The explorer navigates to `/documents/:id` on open; the detail page links onward to
its `metadata`, `public-links` and `renditions` sub-pages and toggles the share
dialog inline. Keep those route paths aligned with the `Link` targets baked into
`DocumentDetailPage`.

## Public API

| Symbol                         | Kind      | Purpose                                                             |
| ------------------------------ | --------- | ------------------------------------------------------------------- |
| `DocumentsExplorerPage`        | component | Explorer shell: folder tree, list/grid, upload, inspector, quota    |
| `DocumentDetailPage`           | component | One document: detail, versions, shares dialog, tags/category        |
| `DocumentPropertiesPage`       | component | Extracted metadata (general / image / document / media sections)    |
| `DocumentPublicLinksPage`      | component | Create / list / revoke scoped, time-limited unauthenticated links   |
| `DocumentRenditionsPage`       | component | Generated format variants table with on-demand download URLs        |
| `DocumentResolutionPage`       | component | Batch-resolve document IDs to presigned CDN URLs (CMS-renderer aid) |
| `TrashBinPage`                 | component | Restore or permanently delete trashed documents before auto-purge   |
| `StorageQuotaPage`             | component | Tenant-wide storage usage against the configured quota              |
| `DOCUMENTS_PERMISSIONS`        | const     | Re-export of `@granit/documents` `DocumentsPermissions` under alias |
| `documentsAdminTranslationsEn` | const     | Flat `documents:*` English admin string bundle                      |
| `documentsAdminTranslationsFr` | const     | Flat `documents:*` French admin string bundle                       |

`DOCUMENTS_PERMISSIONS` is the stable admin-UI alias of
[`@granit/documents`](../documents) `DocumentsPermissions` (`Documents`, `Folders`,
`Shares`, `Tags`, `Quotas` groups) so routing and nav code need not import the
headless package directly. The detail page additionally reads `TAXONOMY_PERMISSIONS`
from [`@granit/react-ui-taxonomy`](../react-ui-taxonomy) for its tag and category
controls.

## Injection

- **API client** — the headless components resolve the Axios client from a
  `DocumentsProvider` / `GranitClientProvider` higher in the tree (via
  `useDocumentsConfig`). No client is baked into any page.
- **Permissions** — `usePermissions` from
  [`@granit/react-authorization`](../react-authorization) gates the manage,
  transfer-ownership and share actions (`DOCUMENTS_PERMISSIONS.*`,
  `TAXONOMY_PERMISSIONS.*`). The explorer requires **both** the document- and
  folder-level `TransferOwnership` grants before it shows that action, since one
  control targets both kinds.
- **Routing** — `react-router` (`Link` / `useParams` / `useNavigate`) drives the
  explorer-to-detail navigation and the document sub-pages.
- **i18n** — ships its flat `documents:*` admin strings
  (`documentsAdminTranslationsEn` / `Fr`); the host registers them. These are
  distinct from the headless `documentsTranslations*` nested label bundle exported by
  [`@granit/react-documents`](../react-documents) — register both.

## Out of scope / caveats

- **Client-side permission checks are a UX hint, not a security boundary.** The
  page-level `hasPermission` gates only hide controls; the `Granit.Documents` backend
  re-checks authorization on every endpoint. Hiding a button never replaces server
  enforcement. See [`@granit/react-authorization`](../react-authorization) for the
  full client-side security posture.
- **Public links are unauthenticated by design.** `DocumentPublicLinksPage` mints
  links that grant scoped, time-limited access _without_ a session. Treat the create
  control as privileged (`Documents.Manage`-gated here) and prefer short TTLs and a
  bounded `maxUses`; a blank `maxUses` means unlimited until expiry.
- **Headless rendering, hooks and DTOs live one layer down.** Components such as
  `DocumentsExplorer`, `DocumentDetail`, `VersionsTimeline`, `ShareDialog`,
  `QuotaPanel` and `TrashBin`, plus all React Query hooks and the `DocumentsProvider`,
  are owned by [`@granit/react-documents`](../react-documents); transport and DTOs by
  [`@granit/documents`](../documents). This package only wires labels, permissions and
  routes around them.
- **Provider tree is a precondition, not an export.** These pages assume an ambient
  `DocumentsProvider` (or `GranitClientProvider`), `AuthorizationProvider` and i18n
  instance. They throw / render their not-found fallback rather than self-bootstrap.

## License

Apache-2.0
