# @granit/react-ui-taxonomy

Admin **UI feature kit** for the Granit **Taxonomy** module — the per-scope
**tag manager** and **category tree** admin pages plus a header-mounted
**cross-entity search bar** that navigates to the matching entity-detail route on
selection. This is the **react-ui** layer: it renders nothing of its own logic,
it composes the headless [`@granit/react-taxonomy`](../react-taxonomy) components
(`CategoryTree` / `TagManager` / `TaxonomySearchBar`) with localised `labels`
props and gates management actions with
[`@granit/react-authorization`](../react-authorization) `usePermissions`.

The split is three packages over the same .NET `Granit.Taxonomy` backend
(contract: `contracts/openapi/taxonomy.json`):

- [`@granit/taxonomy`](../taxonomy) — framework-agnostic core: DTOs, Axios calls
  and the `TaxonomyPermissions` literal table.
- [`@granit/react-taxonomy`](../react-taxonomy) — React Query hooks, the
  `TaxonomyProvider`, and the headless components this kit wraps.
- `@granit/react-ui-taxonomy` (this package) — opinionated admin pages,
  permission gating, routing wiring, and the localized `taxonomy:*` string
  bundles.

The Taxonomy module is **per-scope** (one set of tags + one category tree per
module). These pages surface a single illustrative scope
(`TAXONOMY_DEFAULT_SCOPE = 'documents'`); real tenants wire one page per module
they own.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/taxonomy` — core DTOs, search types, and the `TaxonomyPermissions`
  table aliased by `TAXONOMY_PERMISSIONS`.
- `@granit/react-taxonomy` — the headless components and `TaxonomyProvider` this
  kit composes; must be mounted higher in the tree.
- `@granit/react-authorization` — `usePermissions`, which gates the tag /
  category management actions.
- `@granit/react-localization` — `useTranslation` for the `taxonomy:*` labels.
- `react` / `react-dom` (`^19`).
- `react-router` (`^7.18`) — `useNavigate` drives the header search bar's
  navigation to entity-detail routes.

## Quick start

Mount the headless `TaxonomyProvider` (which itself resolves a
`GranitClientProvider`) above these pages, register the flat string bundle, then
route to the pages. Management actions are gated client-side by the current
user's permissions — server enforcement is authoritative (see Caveats).

```tsx
import {
  CategoryTreePage,
  TagManagerPage,
  TaxonomyHeaderSearch,
  taxonomyAdminTranslationsEn,
} from '@granit/react-ui-taxonomy';
import { TaxonomyProvider } from '@granit/react-taxonomy';
import { Route, Routes } from 'react-router';

// Flat `taxonomy:*` keys — registered in the `translation` namespace with key
// separators disabled (named `*Admin*` to avoid colliding with the headless
// package's nested `taxonomyTranslationsEn`).
i18n.addResourceBundle('en', 'translation', taxonomyAdminTranslationsEn, true, true);

function AdminShell() {
  return (
    <TaxonomyProvider>
      <header>
        {/* hidden below lg; navigates to /documents/:id or /parties/:id */}
        <TaxonomyHeaderSearch />
      </header>
      <Routes>
        <Route path="/taxonomy/tags" element={<TagManagerPage />} />
        <Route path="/taxonomy/categories" element={<CategoryTreePage />} />
      </Routes>
    </TaxonomyProvider>
  );
}
```

`TagManagerPage` and `CategoryTreePage` are zero-prop: they read the scope from
`TAXONOMY_DEFAULT_SCOPE`, derive `canManage` from `usePermissions`, and pass the
fully localized `labels` down to the headless `TagManager` / `CategoryTree`. To
host a different scope, compose the headless components directly rather than
re-using these illustrative pages.

## Public API

| Symbol                        | Kind      | Purpose                                                                 |
| ----------------------------- | --------- | ----------------------------------------------------------------------- |
| `TagManagerPage`              | component | Zero-prop tag-manager page (default scope, perm-gated, localized)       |
| `CategoryTreePage`            | component | Zero-prop category-tree page (default scope, perm-gated, localized)     |
| `TaxonomyHeaderSearch`        | component | Header-mounted `TaxonomySearchBar`; routes to the entity detail on pick |
| `TAXONOMY_DEFAULT_SCOPE`      | const     | `'documents'` — the single illustrative scope the pages wire            |
| `TAXONOMY_PERMISSIONS`        | const     | Flat alias over `@granit/taxonomy`'s `TaxonomyPermissions` literals     |
| `TAXONOMY_TARGET_TYPES`       | const     | Assembly-qualified `Document` / `Party` target-type identifiers         |
| `taxonomyAdminTranslationsEn` | const     | Flat `taxonomy:*` English string bundle for the host to register        |
| `taxonomyAdminTranslationsFr` | const     | Flat `taxonomy:*` French string bundle for the host to register         |

`TAXONOMY_PERMISSIONS` exposes `TAGS_READ` / `TAGS_MANAGE` / `CATEGORIES_READ` /
`CATEGORIES_MANAGE` / `SEARCH_READ`, single-sourced from `TaxonomyPermissions` so
the literal strings stay owned by the core package.

## Injection points

- **API client** — the headless `@granit/react-taxonomy` components resolve the
  Axios client from a `TaxonomyProvider` higher in the tree (which itself reads a
  `GranitClientProvider`). No client is baked into this kit.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  tag / category management actions (`TAXONOMY_PERMISSIONS.TAGS_MANAGE` /
  `TAXONOMY_PERMISSIONS.CATEGORIES_MANAGE`).
- **Routing** — `react-router` (`useNavigate`) drives the header search bar's
  navigation; `TaxonomyHeaderSearch` falls back silently when no route is
  registered for a result's target type (only `Document` and `Party` are wired).
- **i18n** — ships its `taxonomy:*` strings as flat bundles
  (`taxonomyAdminTranslationsEn` / `Fr`), named to avoid colliding with the
  headless package's nested `taxonomyTranslationsEn` / `Fr`. The host registers
  them; values mirror the inline `defaultValue` each page renders.

## Caveats

- **`canManage` is a UX hint, not a security boundary.** Pages hide / disable
  management controls when the user lacks `Tags.Manage` / `Categories.Manage`,
  but the `Granit.Taxonomy` backend re-checks authorization on every mutation.
  Never treat the gated UI as enforcement — see
  [`@granit/react-authorization`](../react-authorization) for the full posture.
- **Single illustrative scope.** The exported pages hard-wire
  `TAXONOMY_DEFAULT_SCOPE`. Multi-scope admin surfaces compose the headless
  `TagManager` / `CategoryTree` directly with a per-module `scope` prop.
- **Header search target types are fixed.** Only `Document` and `Party` routes
  are registered; results for any other target type are not navigable.

## Out of scope

- **Data fetching and mutations** — owned by
  [`@granit/react-taxonomy`](../react-taxonomy) (React Query hooks +
  `TaxonomyProvider`); this kit only renders and localizes.
- **DTOs, Axios transport, and permission literals** — owned by
  [`@granit/taxonomy`](../taxonomy) (mirror of `Granit.Taxonomy`).
- **Entity-side tag chips and pickers** (`TagChip`, `TagAutocomplete`,
  `DocumentTagChipStrip`, …) — these live in
  [`@granit/react-taxonomy`](../react-taxonomy) for embedding into entity detail
  pages, not in this admin kit.

## License

Apache-2.0
