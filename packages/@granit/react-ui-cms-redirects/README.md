# @granit/react-ui-cms-redirects

Admin UI for the **CMS Redirects** module — the per-site redirect list page
(source / target, match type, redirect type, culture, status code, hit count,
active toggle, edit and delete actions) and the create/edit redirect dialog with
spec-driven validation.

Composes the headless [`@granit/react-cms-redirects`](../react-cms-redirects)
(provider + query/mutation hooks) with the foundation UI packages
(`@granit/react-ui`, `@granit/react-localization`, `@granit/react-validation`).

## Usage

The host app supplies the data layer and the Axios client. Wrap the routes in a
`CmsRedirectsProvider` (which resolves the client from a `GranitClientProvider`)
and register the i18n bundles:

```tsx
import { CmsRedirectsProvider } from '@granit/react-cms-redirects';
import {
  RedirectsListPage,
  cmsRedirectsTranslationsEn,
  cmsRedirectsTranslationsFr,
} from '@granit/react-ui-cms-redirects';

i18n.addResourceBundle('en', 'translation', cmsRedirectsTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', cmsRedirectsTranslationsFr, true, true);

<CmsRedirectsProvider config={{ basePath: '/api/cms/redirects' }}>
  {/* route: /cms/sites/:id/redirects */}
  <RedirectsListPage />
</CmsRedirectsProvider>;
```

`RedirectsListPage` reads the site id from the route (`useParams().id`) and does
**not** wrap a provider — the host owns the `CmsRedirectsProvider`.

## Validation

`RedirectFormDialog` validates via `createConstraintsResolver` from
`@granit/react-validation`, fed by the generated `cmsRedirectsConstraints` from
`@granit/cms-redirects` (`RedirectCreateRequest` on create, `RedirectUpdateRequest`
on edit). The resolver only validates registered fields; the `type` / `matchType`
selects are unconstrained and pass through.

## i18n

Flat-key bundles (`cms:Redirects.*`, plus `cms:Sites.Title` for the back link) in
the `translation` namespace. The host runs i18next with `nsSeparator: false`, so
the `cms:` prefix is a literal part of each key, not a namespace. The
`cms:Common.*` keys and the `cms:Redirects.MatchType/Type.*` enum labels are owned
by the host CMS bundle; the components carry inline defaults as a fallback.
