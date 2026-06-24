# @granit/react-ui-cms-redirects

Admin **UI feature kit** for the CMS Redirects module — the per-site redirect
list page (source / target, match type, redirect type, culture, status code, hit
count, active toggle, edit and delete actions) and the create/edit redirect
dialog with spec-driven validation. This is the top **react-ui** layer: it ships
rendered shadcn/ui screens and an i18next resource bundle, composing the headless
data layer with the foundation UI packages. It owns **no** Axios calls, DTOs, or
React Query hooks — those live one layer down.

The split is three packages over the same .NET `Granit.CmsRedirects` backend
(contract: `contracts/openapi/cms-redirects.json`):

- [`@granit/cms-redirects`](../cms-redirects) — framework-agnostic core: DTOs,
  Axios functions (`listRedirects`, `createRedirect`, `resolveRedirect`, …) and
  the generated `cmsRedirectsConstraints` validation metadata.
- [`@granit/react-cms-redirects`](../react-cms-redirects) — React Query hooks +
  `CmsRedirectsProvider` (`useRedirects`, `useCreateRedirect`, …).
- `@granit/react-ui-cms-redirects` (this package) — admin UI: list page + form
  dialog + locales.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/cms-redirects` — core DTOs + the generated `cmsRedirectsConstraints`
  the form dialog feeds into the validation resolver.
- `@granit/react-cms-redirects` — provider + query/mutation hooks the screens
  call (`useRedirects`, `useCreateRedirect`, `useUpdateRedirect`,
  `useDeleteRedirect`).
- `@granit/react-ui` — shadcn/ui primitives (`Dialog`, `Table`, `AlertDialog`,
  `Select`, `toast`, …).
- `@granit/react-localization` — `useTranslation` for the i18next bundles.
- `@granit/react-validation` — `createConstraintsResolver`, the spec-driven
  react-hook-form resolver.
- `lucide-react` (`^1.21`) — row/action icons.
- `react` / `react-dom` (`^19`).
- `react-hook-form` (`^7.80`) — drives the form dialog.
- `react-router-dom` (`^7.18`) — `RedirectsListPage` reads the site id from the
  route and links back to the sites list.

## Quick start

The host app owns the data layer and the Axios client. Mount a
`CmsRedirectsProvider` (which resolves the client from a `GranitClientProvider`)
above the route, register the i18n bundles, then render the page on a route that
carries the site id as `:id`.

```tsx
import { CmsRedirectsProvider } from '@granit/react-cms-redirects';
import {
  RedirectsListPage,
  cmsRedirectsTranslationsEn,
  cmsRedirectsTranslationsFr,
} from '@granit/react-ui-cms-redirects';

i18n.addResourceBundle('en', 'translation', cmsRedirectsTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', cmsRedirectsTranslationsFr, true, true);

// route: /cms/sites/:id/redirects
function RedirectsRoute() {
  return (
    <CmsRedirectsProvider config={{ basePath: '/api/cms/redirects' }}>
      <RedirectsListPage />
    </CmsRedirectsProvider>
  );
}
```

`RedirectsListPage` reads the site id from `useParams().id`, fetches the per-site
list via `useRedirects`, and drives the inline toggle/delete actions and the
create/edit dialog. It does **not** wrap a provider — the host owns the
`CmsRedirectsProvider`. `RedirectFormDialog` can also be embedded standalone when
you need the create/edit form without the list page:

```tsx
import { RedirectFormDialog } from '@granit/react-ui-cms-redirects';
import type { RedirectResponse } from '@granit/react-cms-redirects';

function EditRedirect({
  open,
  onOpenChange,
  siteId,
  redirect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  redirect: RedirectResponse | null; // null = create mode
}) {
  return (
    <RedirectFormDialog
      open={open}
      onOpenChange={onOpenChange}
      siteId={siteId}
      redirect={redirect}
    />
  );
}
```

On create the dialog validates against `RedirectCreateRequest`; on edit it
switches to `RedirectUpdateRequest` and locks the immutable `source` / `culture`
fields. Mutation failures route to the global `MutationCache.onError` toast (the
dialog uses `mutate`, not `mutateAsync`), and a non-empty `conflictWarning` on the
result surfaces as a warning toast.

## Public API

| Symbol                       | Kind      | Purpose                                                             |
| ---------------------------- | --------- | ------------------------------------------------------------------- |
| `RedirectsListPage`          | component | Per-site redirect list with toggle/delete actions + embedded dialog |
| `RedirectFormDialog`         | component | Create/edit redirect dialog with spec-driven validation             |
| `cmsRedirectsTranslationsEn` | const     | English i18next resource bundle (flat `cms:Redirects.*` keys)       |
| `cmsRedirectsTranslationsFr` | const     | French i18next resource bundle (same key set)                       |
| `CmsRedirectsTranslations`   | type      | Shape of the English bundle (`typeof cmsRedirectsTranslationsEn`)   |

## Validation

`RedirectFormDialog` validates via `createConstraintsResolver` from
`@granit/react-validation`, fed by the generated `cmsRedirectsConstraints` from
`@granit/cms-redirects` (`RedirectCreateRequest` on create,
`RedirectUpdateRequest` on edit). Both are derived from
`contracts/openapi/cms-redirects.json` — `source` / `target` carry required +
pattern + maxLength, `culture` a maxLength. The resolver only validates
registered fields, so the unconstrained `type` / `matchType` selects pass through.
`Validation:Builtin:*` error-code messages are owned by the host
`Granit.Validation` bundle, not this package.

## i18n

Flat-key bundles (`cms:Redirects.*`, plus `cms:Sites.Title` for the back link) in
the `translation` namespace. The host runs i18next with `nsSeparator: false`, so
the `cms:` prefix is a literal part of each key, **not** a namespace. The
`cms:Common.*` keys and the `cms:Redirects.MatchType/Type.*` enum labels are owned
by the host CMS bundle; the components carry inline `t(key, default)` fallbacks so
they still render when only this bundle is registered.

## Out of scope

- **DTOs, HTTP transport, and validation metadata** — owned by
  [`@granit/cms-redirects`](../cms-redirects) (mirror of `Granit.CmsRedirects`).
- **React Query hooks and the `CmsRedirectsProvider`** — owned by
  [`@granit/react-cms-redirects`](../react-cms-redirects); this package consumes
  them and never wraps a provider of its own.
- **Public redirect resolution** — the runtime `resolveRedirect` /
  `useRedirectPreview` surface (resolving an inbound path to its target) is a
  data-layer concern; this kit only renders the admin management screens.

## License

Apache-2.0
