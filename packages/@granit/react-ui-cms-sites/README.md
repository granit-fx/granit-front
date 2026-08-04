# @granit/react-ui-cms-sites

Admin **UI feature kit** for the CMS **Sites** module — the sites list (with
per-site navigation actions and a delete confirmation) and the spec-validated
site create/edit form. This is the **react-ui** layer: it ships rendered pages
only and holds no data layer of its own. It composes the headless
[`@granit/react-cms`](../react-cms) hooks (`CmsProvider`, `useSites` / `useSite`
/ `useCreateSite` / `useUpdateSite` / `useDeleteSite`) with the foundation UI
([`@granit/react-ui`](../react-ui)), localization
([`@granit/react-localization`](../react-localization)) and spec-driven
validation ([`@granit/react-validation`](../react-validation)) packages.

The CMS stack splits over the .NET `Granit.Cms` backend
(contract: `contracts/openapi/cms.json`):

- [`@granit/cms`](../cms) — framework-agnostic core: DTOs, Axios calls, and the
  OpenAPI-derived `cmsConstraints` consumed for form validation.
- [`@granit/react-cms`](../react-cms) — headless React Query hooks + the
  `CmsProvider` that resolves the Axios client and base path.
- `@granit/react-ui-cms-sites` (this package) — the Sites admin pages.

Sibling feature kits cover the rest of a site's surfaces and are reached from
this list's row actions:
[`@granit/react-ui-cms-pages`](../react-ui-cms-pages),
[`@granit/react-ui-cms-menus`](../react-ui-cms-menus),
[`@granit/react-ui-cms-releases`](../react-ui-cms-releases),
[`@granit/react-ui-cms-seo`](../react-ui-cms-seo),
[`@granit/react-ui-cms-redirects`](../react-ui-cms-redirects),
[`@granit/react-ui-cms-hostnames`](../react-ui-cms-hostnames).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/cms` — `cmsConstraints` (OpenAPI-derived create/update constraints).
- `@granit/react-cms` — the `CmsProvider` and the sites hooks these pages call.
- `@granit/react-ui` — foundation shadcn-based components (`Table`,
  `AlertDialog`, `Input`, `Switch`, `toast`, …).
- `@granit/react-localization` — `useTranslation` for the `cms:*` keys.
- `@granit/react-validation` — `createConstraintsResolver` for the form.
- `react` (`^19`), `react-dom` (`^19`).
- `react-hook-form` (`^7.80`) — the site form is built on it.
- `react-router` (`^7.18`) — row actions navigate via `Link` / `useNavigate`.
- `lucide-react` (`^1.21`) — row-action icons.

## Quick start

The host app mounts `CmsProvider` once (it resolves the Axios client — typically
from a `GranitClientProvider` — and the CMS base path); these pages only consume
the hooks. Register the i18n bundles, then route the two pages.

```tsx
import { CmsProvider } from '@granit/react-cms';
import { SitesListPage, SiteFormPage } from '@granit/react-ui-cms-sites';
import { useGranitClient } from '@granit/react-api-client';
import { Route, Routes } from 'react-router';

function CmsAdmin() {
  return (
    <CmsProvider config={{ client: useGranitClient(), basePath: '' }}>
      <Routes>
        <Route path="/cms/sites" element={<SitesListPage />} />
        <Route path="/cms/sites/new" element={<SiteFormPage />} />
        <Route path="/cms/sites/:id/edit" element={<SiteFormPage />} />
        {/* /cms/sites/:id/{pages,menus,releases,seo,redirects,hostnames}
            are the sibling feature kits the list's row actions link to. */}
      </Routes>
    </CmsProvider>
  );
}
```

`SitesListPage` renders the table (slug, name, cultures, status), a delete
confirmation dialog, and one ghost-button per sub-feature that `navigate()`s to
the matching route — wire those routes from the sibling kits. `SiteFormPage`
serves both create (`/new`) and edit (`/:id/edit`); it reads the `:id` route
param to pick its mode and its constraint set:

```tsx
// Inside SiteFormPage — validation is derived from the OpenAPI contract, not
// hand-written: the resolver checks only the registered form fields, so the
// request-only `domains` constraint is never evaluated client-side.
const formResolver = createConstraintsResolver(
  isEdit ? cmsConstraints.UpdateSiteRequest : cmsConstraints.CreateSiteRequest,
  t,
  { labelResolver: (field) => t(`cms:Sites.Fields.${capitalize(field)}`, field) }
);
```

Register the translation bundles in the host i18n instance:

```ts
import { cmsSitesTranslationsEn, cmsSitesTranslationsFr } from '@granit/react-ui-cms-sites';

i18n.addResourceBundle('en', 'translation', cmsSitesTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', cmsSitesTranslationsFr, true, true);
```

## Public API

| Symbol                   | Kind      | Purpose                                                  |
| ------------------------ | --------- | -------------------------------------------------------- |
| `SitesListPage`          | component | Sites table, row actions, and a delete-confirm dialog    |
| `SiteFormPage`           | component | Create/edit site form; mode from the `:id` route param   |
| `cmsSitesTranslationsEn` | const     | English i18next bundle (`cms:Sites.*` + `cms:Common.*`)  |
| `cmsSitesTranslationsFr` | const     | French i18next bundle (same flat keys)                   |
| `CmsSitesTranslations`   | type      | `typeof cmsSitesTranslationsEn` — the bundle's key shape |

Both pages are headless of provider concerns: they call the
[`@granit/react-cms`](../react-cms) sites hooks and therefore must render inside
a `CmsProvider` (and a `react-router` router).

## i18n

The bundles use **flat string keys** carrying the literal `cms:` prefix — the
lookup runs with `keySeparator` / `nsSeparator` disabled, so `cms:Sites.Title`
is one key, not a namespace traversal. Register them in the `translation`
namespace with `addResourceBundle(lng, 'translation', bundle, true, true)`. This
package **owns the `cms:Common.*` keys as the CMS module root** (Cancel, Delete,
Save, Saving…, Loading…, …), shared by the sibling CMS feature kits, alongside
its own `cms:Sites.*` keys.

## Validation

The site form's validation is **derived from the OpenAPI contract**, not a
hand-written Zod schema: `createConstraintsResolver`
([`@granit/react-validation`](../react-validation)) consumes
`cmsConstraints.CreateSiteRequest` / `cmsConstraints.UpdateSiteRequest`
([`@granit/cms`](../cms)). Error-message and label resolution go through the
`cms:Sites.Fields.*` keys via field-name capitalisation. The resolver only
validates the fields registered on the form
(`slug`, `defaultCulture`, `allowedCultures`, `defaultTheme`, `activated`); the
request-only `domains` constraint is intentionally not exercised here.

## Out of scope / caveats

- **Server is authoritative.** These pages are an admin convenience surface;
  the `Granit.Cms` backend re-validates and authorizes every site mutation. The
  client-side spec resolver is a UX aid, not an enforcement boundary.
- **Data layer lives one layer down.** DTOs, Axios transport, and React Query
  hooks belong to [`@granit/cms`](../cms) / [`@granit/react-cms`](../react-cms);
  this package never issues HTTP itself.
- **Routing is the host's job.** The row actions `navigate()` to
  `/cms/sites/:id/{pages,menus,releases,seo,redirects,hostnames}`; this package
  does not register those routes — wire them from the sibling feature kits.
- **Sub-features are separate kits.** Pages, menus, releases, SEO, redirects,
  and hostnames each ship their own `@granit/react-ui-cms-*` package; only the
  sites list and form live here.
- **`slug` is immutable on edit.** The form disables the slug input in edit mode
  to match the backend (slug is the site identity).

## License

Apache-2.0
