# @granit/react-ui-cms-sites

Admin UI for the **CMS Sites** module — the site list and the create/edit site
form. Pairs with the headless `@granit/react-cms` data layer (`CmsProvider`,
`useSites` / `useSite` / `useCreateSite` / `useUpdateSite` / `useDeleteSite`).

## Usage

The host app supplies the `CmsProvider` (with its API client and base path); the
pages here only consume the hooks.

```tsx
import { CmsProvider } from '@granit/react-cms';
import { SitesListPage, SiteFormPage } from '@granit/react-ui-cms-sites';

<CmsProvider config={{ client, basePath: '' }}>
  <SitesListPage />
</CmsProvider>;
```

## i18n

Ships flat `cms:Sites.*` and `cms:Common.*` keys (the CMS root owns the shared
`cms:Common.*` set) in the `translation` namespace via
`cmsSitesTranslationsEn` / `cmsSitesTranslationsFr`. Register them in the host
i18n instance with `addResourceBundle(lng, 'translation', bundle, true, true)`.

## Validation

The site form derives its validation from the OpenAPI contract via
`createConstraintsResolver(cmsConstraints.CreateSiteRequest | UpdateSiteRequest, …)`
(`@granit/react-validation` + `@granit/cms`) — no hand-written schema.
