# @granit/react-ui-cms-hostnames

Admin UI for the **CMS site-scoped Hostnames** module — the per-site hostname
list (host, status, primary, last-verified), an add-hostname form with
spec-driven validation, a status badge, and verify / remove actions.

This is the **CMS site-hostnames** variant — distinct from the top-level
[`@granit/react-ui-hostnames`](../react-ui-hostnames) (owner-scoped managed
hostnames). It composes the headless
[`@granit/react-cms-hostnames`](../react-cms-hostnames) (data hooks + provider)
with the foundation UI packages ([`@granit/react-ui`](../react-ui)).

## Usage

```tsx
import { HostnamesPage, cmsHostnamesTranslationsEn } from '@granit/react-ui-cms-hostnames';
import { CmsHostnamesProvider } from '@granit/react-cms-hostnames';

i18n.addResourceBundle('en', 'translation', cmsHostnamesTranslationsEn, true, true);

// The host supplies the provider; the page does NOT wrap one.
<CmsHostnamesProvider config={{ basePath: '/api/cms' }}>
  <Route path="/cms/sites/:id/hostnames" element={<HostnamesPage />} />
</CmsHostnamesProvider>;
```

## Injection

- **API client** — resolved from a `GranitClientProvider`
  (`@granit/react-api-client`) higher in the tree, then handed to the headless
  `CmsHostnamesProvider`. No client is baked in.
- **Routing** — `HostnamesPage` reads the site id from the route via `useParams`
  (`/cms/sites/:id/hostnames`) and renders a back-link to `/cms/sites`.
- **i18n** — ships its `cms:Hostnames.*` strings (plus `cms:Sites.Title`) as
  `cmsHostnamesTranslationsEn/Fr`; the host registers them. The `cms:` prefix is
  a **literal flat-key prefix** (host runs `nsSeparator=false`), not an i18next
  namespace. `cms:Common.*` keys are app-global.
- **Validation** — the add-hostname form validates against the spec-derived
  `cmsHostnamesConstraints.SiteHostnameCreateRequest` (`@granit/cms-hostnames`)
  via `createConstraintsResolver` (`@granit/react-validation`), with a
  client-only FQDN guard layered on top.
