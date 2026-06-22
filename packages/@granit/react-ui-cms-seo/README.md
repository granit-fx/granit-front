# @granit/react-ui-cms-seo

Admin UI for the **CMS SEO** module — a per-site SEO dashboard with three tabs:

- **Defaults** — the site SEO defaults form (title template, site name, canonical
  host, robots.txt rules), validated against the spec-derived
  `SiteSeoDefaultsRequest` contract.
- **Audit** — a metadata audit table flagging missing title / description /
  canonical URL per content item.
- **AI Inbox** — pending AI suggestions with apply / reject actions.

The **visual** layer for SEO: it composes the headless
[`@granit/react-cms-seo`](../react-cms-seo) (provider + hooks) with the foundation
UI packages ([`@granit/react-ui`](../react-ui)) and spec-driven validation
([`@granit/react-validation`](../react-validation) +
[`@granit/cms-seo`](../cms-seo) constraints).

## Usage

```tsx
import { SeoDashboardPage, cmsSeoTranslationsEn } from '@granit/react-ui-cms-seo';

i18n.addResourceBundle('en', 'translation', cmsSeoTranslationsEn, true, true);

// Mount under a CmsSeoProvider (from @granit/react-cms-seo):
<Route path="/cms/sites/:id/seo" element={<SeoDashboardPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` / `CmsSeoProvider`
  higher in the tree (via the `@granit/react-cms-seo` hooks). No client baked in;
  this package does **not** wrap a provider.
- **Validation** — the defaults form uses `createConstraintsResolver` over
  `cmsSeoConstraints.SiteSeoDefaultsRequest`; messages come from the backend
  `Granit.Validation` package (loaded by the host app). Field labels resolve to
  `cms:Seo.Fields.*`.
- **i18n** — ships its `cms:Seo.*` strings (`cmsSeoTranslationsEn/Fr`, flat keys
  with the literal `cms:` prefix); the host registers them. The handful of
  `cms:Common.*` keys it references are owned by the host's CMS bundle.
