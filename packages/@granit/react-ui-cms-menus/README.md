# @granit/react-ui-cms-menus

Admin **UI feature kit** for CMS site menus — a site-scoped menu list (key, title,
item count, delete confirmation) and a create / edit form (key, title, plus a raw
JSON editor for menu items). These are the two route-level pages an admin shell
mounts under a site; they hold the rendering only.

This is the **react-ui admin** layer of the CMS menus split. It composes the
headless [`@granit/react-cms`](../react-cms) (provider + TanStack Query hooks) with
the foundation UI primitives from [`@granit/react-ui`](../react-ui), and derives the
form's validation from the OpenAPI contract via
[`@granit/react-validation`](../react-validation) `createConstraintsResolver` over
[`@granit/cms`](../cms) `cmsConstraints`. The backend counterpart is the
`Granit.Cms` menus surface (contract: `contracts/openapi/cms.json`,
routes `/api/cms/menus[...]`). Menus are one slice of a wider CMS family that ships
parallel admin kits — [`@granit/react-ui-cms-sites`](../react-ui-cms-sites),
[`@granit/react-ui-cms-pages`](../react-ui-cms-pages),
[`@granit/react-ui-cms-seo`](../react-ui-cms-seo),
[`@granit/react-ui-cms-redirects`](../react-ui-cms-redirects),
[`@granit/react-ui-cms-hostnames`](../react-ui-cms-hostnames), and
[`@granit/react-ui-cms-releases`](../react-ui-cms-releases) — over the same core
([`@granit/cms`](../cms)) and hooks ([`@granit/react-cms`](../react-cms)) layers.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. A consumer must declare these peers:

- `@granit/react-cms` — the headless provider + menu hooks (`useMenus`, `useMenu`,
  `useCreateMenu`, `useUpdateMenu`, `useDeleteMenu`) these pages call.
- `@granit/cms` — core DTOs + `cmsConstraints` (the OpenAPI-extracted form
  constraints) and the `MenuItemRequest` shape.
- `@granit/react-ui` — foundation primitives (`Table`, `AlertDialog`, `Button`,
  `Input`, `Textarea`, `toast`, …).
- `@granit/react-validation` — `createConstraintsResolver` (spec-driven RHF resolver).
- `@granit/react-localization` — `useTranslation` for the `cms:*` strings.
- `@granit/utils` — shared helpers.
- `react` (`^19`), `react-dom` (`^19`).
- `react-hook-form` (`^7.80`) — the create / edit form.
- `react-router` (`^7.18`) — `useParams` / `useNavigate` / `Link` route wiring.
- `lucide-react` (`^1.21`) — page icons.

The Axios client is not a direct peer here: it is resolved by `@granit/react-cms`
from a `CmsProvider` / `GranitClientProvider` in the host tree.

## Quick start

Mount the two pages under a `CmsProvider` (from `@granit/react-cms`) and register
the i18n bundles. The list expects an `:id` route param (the site id); the form also
reads an `:menuId` param to switch between create and edit.

```tsx
import { MenusListPage, MenuFormPage, cmsMenusTranslationsEn } from '@granit/react-ui-cms-menus';
import { Route, Routes } from 'react-router';

// Flat keys keep the literal `cms:` prefix; register into the "translation" ns.
i18n.addResourceBundle('en', 'translation', cmsMenusTranslationsEn, true, true);

function CmsMenusRoutes() {
  return (
    <Routes>
      {/* below a <CmsProvider> that supplies the Axios client + base path */}
      <Route path="/cms/sites/:id/menus" element={<MenusListPage />} />
      <Route path="/cms/sites/:id/menus/new" element={<MenuFormPage />} />
      <Route path="/cms/sites/:id/menus/:menuId/edit" element={<MenuFormPage />} />
    </Routes>
  );
}
```

`MenuFormPage` builds its resolver from `cmsConstraints.MenuCreateRequest` /
`MenuUpdateRequest` so the `key` and `title` fields validate against the same rules
the backend enforces; the items editor is a free `Textarea` parsed as JSON on submit
into `MenuItemRequest[]`. On success both mutations `toast` and navigate back to the
list. `key` is immutable in edit mode (disabled input — the update request carries
only `title` + `items`).

## Public API

| Symbol                   | Kind      | Purpose                                                      |
| ------------------------ | --------- | ------------------------------------------------------------ |
| `MenusListPage`          | component | Site-scoped menu table + per-row edit link and delete dialog |
| `MenuFormPage`           | component | Create / edit form (key, title, items-as-JSON); spec-driven  |
| `cmsMenusTranslationsEn` | const     | English i18next bundle of `cms:Menus.*` flat keys            |
| `cmsMenusTranslationsFr` | const     | French i18next bundle of `cms:Menus.*` flat keys             |
| `CmsMenusTranslations`   | type      | Shape of the bundle (`typeof cmsMenusTranslationsEn`)        |

## Out of scope / caveats

- **API client** — resolved from a `GranitClientProvider` / `CmsProvider` higher in
  the tree via the `@granit/react-cms` hooks. No client is baked in; mount the pages
  below that provider or the hooks throw.
- **Validation ownership** — the `key` / `title` constraints come from
  `cmsConstraints.Menu{Create,Update}Request` (OpenAPI-extracted, never hand-rolled
  Zod). The `items` JSON textarea has no wire constraint and is validated only by the
  inline `JSON.parse`; malformed JSON surfaces as a `toast`, not a field error. The
  `Validation:Builtin:*` resolver messages are owned by the backend
  `Granit.Validation` package and must be loaded by the host app.
- **i18n split** — this package ships only its own `cms:Menus.*` strings
  (`cmsMenusTranslationsEn` / `cmsMenusTranslationsFr`); the host registers them. The
  shared `cms:Common.*` and `cms:Sites.Title` strings the pages reference are owned by
  the host bundle and are **not** shipped here.
- **Pagination, not site filtering** — `useMenus()` reads the paginated query-engine
  surface and is **not** filterable by `siteId` on the wire; the `:id` route param
  scopes navigation and the create/delete mutations, not the list query itself.
- **No data / transport layer** — DTOs, Axios calls, and query keys live in
  [`@granit/cms`](../cms) and [`@granit/react-cms`](../react-cms); this package is
  rendering only and re-exports none of them.
- **No `resolve` surface** — the public `/api/cms/menus/resolve` renderer contract
  (Page targets resolved to live paths, hidden items pruned) is consumed by the CMS
  renderer, not by this admin kit.

## License

Apache-2.0
