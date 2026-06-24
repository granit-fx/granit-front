# @granit/react-ui-cms-pages

Admin UI for the **CMS Pages** module — the page-structure tree (slug + parent +
depth, with delete confirmation) and the create/rename page form. The form is
**spec-driven**: its validation rules are derived from the OpenAPI contract
(`cmsConstraints.CreatePageRequest`) via `createConstraintsResolver`, and an
"Edit content" link-out delegates block authoring to the granit-cms-renderer Puck
editor.

This is the **react-ui admin feature kit** layer over the .NET `Granit.Cms`
backend (contract: `contracts/openapi/cms.json`). It composes the headless
[`@granit/react-cms`](../react-cms) (admin hooks + `CmsProvider`) — which itself
wraps the framework-agnostic DTOs and Axios calls in [`@granit/cms`](../cms) — with
the foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-validation`](../react-validation),
[`@granit/react-localization`](../react-localization)). It is the **visual** layer
only: page hooks, query keys, and HTTP transport live one layer down. Sibling
admin kits cover the rest of the module — [`@granit/react-ui-cms-sites`](../react-ui-cms-sites),
[`@granit/react-ui-cms-menus`](../react-ui-cms-menus),
[`@granit/react-ui-cms-hostnames`](../react-ui-cms-hostnames),
[`@granit/react-ui-cms-redirects`](../react-ui-cms-redirects),
[`@granit/react-ui-cms-releases`](../react-ui-cms-releases), and
[`@granit/react-ui-cms-seo`](../react-ui-cms-seo).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-cms` — headless `CmsProvider` + admin page hooks
  (`usePageTree`, `useCreatePage`, `useUpdatePage`, `useDeletePage`, `usePage`,
  `useSite`) that these pages drive.
- `@granit/cms` — `cmsConstraints.CreatePageRequest`, the spec-derived constraint
  set the create form's resolver is built from.
- `@granit/react-validation` — `createConstraintsResolver`, the react-hook-form
  resolver factory.
- `@granit/react-ui` — shadcn/ui foundation components (`Table`, `Select`,
  `AlertDialog`, `Button`, `toast`, …).
- `@granit/react-localization` — `useTranslation` for the `cms:*` flat keys.
- `@granit/utils` — shared helpers.
- `react` / `react-dom` (`^19`), `react-hook-form` (`^7.80`), and
  `react-router-dom` (`^7.18`) — the pages read route params and render `<Link>`.
- `lucide-react` (`^1.21`) — the action icons.

## Quick start

These are route-level page components, not headless hooks. Mount them under a
`CmsProvider` (from `@granit/react-cms`) — they do **not** provide one; they read
the headless config + Axios client from the host tree (which falls back to a
`GranitClientProvider`). Register the i18n bundles once at startup.

```tsx
import {
  PageTreePage,
  PageFormPage,
  cmsPagesTranslationsEn,
} from '@granit/react-ui-cms-pages';
import { CmsProvider } from '@granit/react-cms';
import { Route, Routes } from 'react-router-dom';

i18n.addResourceBundle('en', 'translation', cmsPagesTranslationsEn, true, true);

function CmsPagesRoutes() {
  return (
    <CmsProvider config={{ basePath: '/api/cms' }}>
      <Routes>
        {/* siteId comes from the `:id` route param (or a `?siteId=` query). */}
        <Route path="/cms/sites/:id/pages" element={<PageTreePage />} />
        <Route path="/cms/sites/:id/pages/new" element={<PageFormPage />} />
        <Route path="/cms/sites/:id/pages/:pageId/edit" element={<PageFormPage />} />
      </Routes>
    </CmsProvider>
  );
}
```

`PageFormPage` derives its validation from the OpenAPI contract, so a malformed
slug is rejected client-side before submit (the backend re-validates regardless):

```tsx
// PageFormPage internals (illustrative): the resolver is spec-driven.
const resolver = createConstraintsResolver(cmsConstraints.CreatePageRequest, t, {
  labelResolver: (field) => t(`cms:Pages.Fields.${capitalize(field)}`, field),
});
// `layoutKey` is a required-key / nullable-value field: an empty value is a
// legitimate "no layout", so its `required` error is dropped post-resolution.
```

In edit mode the form surfaces an "Edit content" button built with
`buildPageEditorUrl(pageId, locale)`; it is disabled until the host sets
`VITE_CMS_RENDERER_URL`.

## Public API

| Symbol                    | Kind      | Purpose                                                                  |
| ------------------------- | --------- | ------------------------------------------------------------------------ |
| `PageTreePage`            | component | Route page: page-structure tree (path + depth) with edit/delete actions  |
| `PageFormPage`            | component | Route page: create/rename a page node; spec-driven validation + link-out |
| `buildPageEditorUrl`      | fn        | `${CMS_RENDERER_URL}/admin/{pageId}/{locale}/edit`, or `null` if unset   |
| `isCmsRendererConfigured` | const     | Whether `VITE_CMS_RENDERER_URL` is set (gates the link-out)              |
| `CMS_RENDERER_URL`        | const     | Renderer base URL, trailing slash stripped; `''` when unconfigured       |
| `cmsPagesTranslationsEn`  | const     | English i18next bundle - flat `cms:Pages.*` keys, `translation` ns       |
| `cmsPagesTranslationsFr`  | const     | French i18next bundle - same key set                                     |
| `CmsPagesTranslations`    | type      | Shape of the bundle (keyof the `en` resource), for typed augmentation    |

## Injection

- **API client** — resolved by the host-provided `CmsProvider`
  (`@granit/react-cms`), which itself falls back to a `GranitClientProvider`. No
  client is baked into these pages.
- **Validation** — `createConstraintsResolver(cmsConstraints.CreatePageRequest)`
  (`@granit/react-validation` + `@granit/cms`). `Validation:Builtin:*` messages
  are owned by the host's `@granit/Validation` i18n bundle, not this package.
- **i18n** — ships its `cms:Pages.*` strings (`cmsPagesTranslationsEn` /
  `cmsPagesTranslationsFr`); the host registers them. The `cms:` prefix is a
  **literal** flat-key part, not an i18next namespace (the host runs i18next with
  `nsSeparator` / `keySeparator` disabled). `cms:Common.*` keys are app-global and
  owned by the host shell.
- **Content editor** — `buildPageEditorUrl` builds a link-out to the
  granit-cms-renderer Puck editor, gated by `VITE_CMS_RENDERER_URL` (read from the
  host's Vite environment via `import.meta.env`; the link-out is disabled when
  unset). `import.meta.env` is cast rather than typed against `vite/client`, so the
  library carries no ambient Vite dependency.

## Out of scope / caveats

- **Page content (blocks)** — authored in the granit-cms-renderer Puck editor, not
  here. This admin manages page *structure* only (tree, slug, parent, layout key);
  `PageFormPage` only links out to the renderer for content.
- **HTTP transport & DTOs** — owned by [`@granit/cms`](../cms) (mirror of
  `Granit.Cms`); React Query hooks and query keys by [`@granit/react-cms`](../react-cms).
  These pages render, they do not fetch directly.
- **Validation is a UX hint, not enforcement.** The spec-driven resolver mirrors
  the backend constraints to fail fast in the form; the .NET `Granit.Cms`
  validator re-checks every field on submit. Never treat client-side validation
  as a security boundary.
- **Site root is protected.** The site-root page cannot be renamed or deleted —
  its slug field is locked to `/` and its delete action is disabled (the backend
  enforces this too).
- **Concurrency** — `PageFormPage` rename sends the page's `concurrencyStamp` in
  the update body (optimistic concurrency, body-field not `If-Match`); a stale
  stamp yields a `409` resolved by the host's error handling.

## License

Apache-2.0
