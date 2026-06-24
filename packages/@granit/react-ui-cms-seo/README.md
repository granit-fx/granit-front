# @granit/react-ui-cms-seo

Admin UI for the Granit **CMS SEO** module — the per-site SEO dashboard. This is
the **react-ui admin feature kit**: the rendered, visual layer that composes the
headless [`@granit/react-cms-seo`](../react-cms-seo) (provider + query/mutation
hooks) with the foundation UI primitives ([`@granit/react-ui`](../react-ui)) and
spec-driven validation ([`@granit/react-validation`](../react-validation) over the
[`@granit/cms-seo`](../cms-seo) constraints). It ships rendering only — no Axios
calls, no DTOs, no React Query wiring of its own.

The split is three packages over the same .NET `Granit.Cms.Seo` backend (contract:
`contracts/openapi/cms-seo.json`):

- [`@granit/cms-seo`](../cms-seo) — framework-agnostic core: DTOs, Axios functions
  and the spec-derived `cmsSeoConstraints` validation table.
- [`@granit/react-cms-seo`](../react-cms-seo) — React Query hooks + `CmsSeoProvider`
  (client / base-path / query-key configuration).
- `@granit/react-ui-cms-seo` (this package) — admin dashboard page + i18n bundles.

The dashboard is a single tabbed page:

- **Defaults** — the site SEO defaults form (title template, site name, canonical
  host, `robots.txt` rules), validated against the spec-derived
  `SiteSeoDefaultsRequest` contract.
- **Audit** — a metadata audit table flagging missing title / description /
  canonical URL per content item.
- **AI Inbox** — pending AI suggestions with apply / reject actions.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. A consumer must declare these peers:

- `@granit/cms-seo` — core DTOs + the `cmsSeoConstraints` validation table.
- `@granit/react-cms-seo` — the headless hooks (`useSeoDefaults`,
  `useSeoMetadataAudit`, `useSeoSuggestions`, …) and `CmsSeoProvider` this UI drives.
- `@granit/react-ui` — foundation primitives (`Tabs`, `Table`, `Input`, `Button`,
  `toast`, …).
- `@granit/react-validation` — `createConstraintsResolver` for the defaults form.
- `@granit/react-localization` — `useTranslation` for the `cms:Seo.*` strings.
- `react-hook-form` (`^7.80`) — the defaults form.
- `react-router-dom` (`^7.18`) — the page reads `:id` (site id) from the route via
  `useParams`.
- `lucide-react` (`^1.21`) — the apply / reject action icons.
- `react` / `react-dom` (`^19`).

## Quick start

The page reads the site id from the route's `:id` param and resolves its Axios
client from a `CmsSeoProvider` mounted higher in the tree — it does **not** wrap a
provider. Register the i18n bundles once, mount the provider, route to the page.

```tsx
import { CmsSeoProvider } from '@granit/react-cms-seo';
import { SeoDashboardPage, cmsSeoTranslationsEn } from '@granit/react-ui-cms-seo';
import { useGranitClient } from '@granit/react-api-client';
import { Route, Routes } from 'react-router-dom';

// Flat keys with the literal `cms:` prefix, registered into the "translation" ns.
i18n.addResourceBundle('en', 'translation', cmsSeoTranslationsEn, true, true);

function CmsAdmin() {
  return (
    <CmsSeoProvider config={{ client: useGranitClient() }}>
      <Routes>
        {/* `:id` is the site id — SeoDashboardPage reads it via useParams. */}
        <Route path="/cms/sites/:id/seo" element={<SeoDashboardPage />} />
      </Routes>
    </CmsSeoProvider>
  );
}
```

The defaults form validates with `createConstraintsResolver` over
`cmsSeoConstraints.SiteSeoDefaultsRequest`: limits and messages derive from the
contract (e.g. `canonicalHost` maxLength + the `^https://` pattern), and field labels
resolve to `cms:Seo.Fields.*`. The `robots.txt` textarea is a UI-only string that the
page (de)serializes to/from the structured `RobotsTxtRule[]` wire shape; it carries no
constraint, so the resolver skips it.

## Public API

| Symbol                 | Kind      | Purpose                                                             |
| ---------------------- | --------- | ------------------------------------------------------------------- |
| `SeoDashboardPage`     | component | Tabbed admin page (Defaults / Audit / AI Inbox); site id from `:id` |
| `cmsSeoTranslationsEn` | const     | English `cms:Seo.*` i18n bundle (flat keys, `cms:` prefix)          |
| `cmsSeoTranslationsFr` | const     | French `cms:Seo.*` i18n bundle (same key set)                       |
| `CmsSeoTranslations`   | type      | `typeof cmsSeoTranslationsEn` (bundle key/value shape)              |

## Out of scope / caveats

- **No provider, no client.** This package renders only. The Axios client, base path
  and query keys come from a `CmsSeoProvider` ([`@granit/react-cms-seo`](../react-cms-seo))
  the host mounts above the route; mounting `SeoDashboardPage` without one throws from
  the underlying hooks.
- **i18n is split-owned.** The package ships its own `cms:Seo.*` strings
  (`cmsSeoTranslationsEn` / `cmsSeoTranslationsFr`) — flat keys carrying the literal
  `cms:` prefix (part of the key, **not** an i18next namespace), registered into the
  `translation` namespace. The handful of `cms:Common.*` keys it references
  (`Save`, `Saving`, `Loading`, `Actions`) are owned by the host's CMS bundle and must
  be registered separately.
- **Validation messages come from the backend.** `createConstraintsResolver` produces
  error keys owned by `Granit.Validation`; the host app loads those message
  translations. This package only wires the resolver and field labels.
- **DTOs, HTTP transport and hooks are not here.** They live in
  [`@granit/cms-seo`](../cms-seo) (mirror of `Granit.Cms.Seo`) and
  [`@granit/react-cms-seo`](../react-cms-seo). To consume the SEO data layer without
  this dashboard, depend on those directly.
- **Robots rules round-trip through text.** The defaults form edits `robots.txt` rules
  as one group per line (`User-agent: …; Allow: …; Disallow: …; Crawl-delay: …`) and
  serializes back to `RobotsTxtRule[]`; malformed lines are parsed leniently
  (unknown segments ignored, `User-agent` defaulting to `*`).

## License

Apache-2.0
