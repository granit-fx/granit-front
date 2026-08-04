# @granit/react-ui-cms-hostnames

Admin UI for the **CMS site-scoped Hostnames** module — the per-site hostname
list (host, status, primary flag, last-verified), an add-hostname form with
spec-driven validation, a status badge, and inline verify / remove actions.

This is the **`react-ui` admin feature kit**: rendered shadcn-based components,
no data fetching of its own. It composes the headless data hooks from
[`@granit/react-cms-hostnames`](../react-cms-hostnames) with the foundation UI
primitives in [`@granit/react-ui`](../react-ui). The backend counterpart is the
CMS Site-Hostnames module (contract: `contracts/openapi/cms-hostnames.json`,
routes under `/api/cms/sites/{siteId}/hostnames`).

The stack is three packages over the same backend, plus a distinct top-level
sibling:

- [`@granit/cms-hostnames`](../cms-hostnames) — framework-agnostic core: DTOs +
  Axios functions (`listSiteHostnames`, `addSiteHostname`, …) and the
  spec-derived `cmsHostnamesConstraints`.
- [`@granit/react-cms-hostnames`](../react-cms-hostnames) — React Query hooks +
  the `CmsHostnamesProvider`.
- `@granit/react-ui-cms-hostnames` (this package) — admin UI feature kit.
- [`@granit/react-ui-hostnames`](../react-ui-hostnames) — the **owner-scoped**
  managed-hostnames UI; do not confuse it with this CMS site-scoped variant.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-cms-hostnames` — headless provider + data hooks this kit
  renders.
- `@granit/cms-hostnames` — core DTOs + `cmsHostnamesConstraints` the add-form
  validates against.
- `@granit/react-ui` — shadcn-based UI primitives (Table, Button, AlertDialog,
  Badge, Input, Checkbox, `toast`, …).
- `@granit/react-validation` — `createConstraintsResolver` for the add-form.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/utils` — shared helpers.
- `react-hook-form` (`^7.80`) — the add-form's form state.
- `react-router` (`^7.18`) — `HostnamesPage` reads `:id` via `useParams` and
  renders a back-link to `/cms/sites`.
- `lucide-react` (`^1.21`), `react` (`^19`), and `react-dom` (`^19`).

## Quick start

`HostnamesPage` is a full route view: it reads the site id from the URL, lists
the hostnames, and embeds the add-form plus verify / remove actions. The **host**
mounts the `CmsHostnamesProvider` (resolving the Axios client from a
`GranitClientProvider` higher in the tree) — this package does **not** wrap a
provider.

```tsx
import { CmsHostnamesProvider } from '@granit/react-cms-hostnames';
import { HostnamesPage, cmsHostnamesTranslationsEn } from '@granit/react-ui-cms-hostnames';
import { Route, Routes } from 'react-router';

// Register the bundle once at startup. `cms:` is a LITERAL flat-key prefix
// (the host runs i18next with nsSeparator=false), not an i18next namespace.
i18n.addResourceBundle('en', 'translation', cmsHostnamesTranslationsEn, true, true);

function CmsAdminRoutes() {
  return (
    <CmsHostnamesProvider config={{ basePath: '/api/cms' }}>
      <Routes>
        <Route path="/cms/sites/:id/hostnames" element={<HostnamesPage />} />
      </Routes>
    </CmsHostnamesProvider>
  );
}
```

The individual components can also be used standalone — e.g. the status badge in
a custom table:

```tsx
import { CmsHostnameAddForm, CmsHostnameStatusBadge } from '@granit/react-ui-cms-hostnames';

// Spec-driven add-form scoped to one site (validates host + isPrimary).
<CmsHostnameAddForm siteId={siteId} />;

// Maps the free-form backend status string to a Badge variant
// (Active/Pending/Verifying/Error → default/secondary/outline/destructive).
<CmsHostnameStatusBadge status={hostname.status} />;
```

## Public API

| Symbol                        | Kind      | Purpose                                                                  |
| ----------------------------- | --------- | ------------------------------------------------------------------------ |
| `HostnamesPage`               | component | Route view: site-id from `useParams`, table + verify/remove + add-form   |
| `CmsHostnameAddForm`          | component | Add-hostname form (`host` + `isPrimary`), spec-driven validation         |
| `CmsHostnameAddFormProps`     | type      | `{ siteId: string }`                                                     |
| `CmsHostnameStatusBadge`      | component | Maps a free-form status string to a `Badge` variant                      |
| `CmsHostnameStatusBadgeProps` | type      | `{ status: string }`                                                     |
| `cmsHostnamesTranslationsEn`  | const     | English i18next bundle (`cms:Hostnames.*`, `cms:Sites.Title`, flat keys) |
| `cmsHostnamesTranslationsFr`  | const     | French i18next bundle (same flat keys)                                   |
| `CmsHostnamesTranslations`    | type      | Shape of a translation bundle (`typeof cmsHostnamesTranslationsEn`)      |

Data hooks (`useSiteHostnames`, `useAddSiteHostname`, …), the
`CmsHostnamesProvider`, and the DTOs (`SiteHostnameResponse`, …) are **not**
re-exported here — import them from
[`@granit/react-cms-hostnames`](../react-cms-hostnames).

## Validation

The add-form's `host` field validates against the spec-derived
`cmsHostnamesConstraints.SiteHostnameCreateRequest` (`required` + `maxLength`)
via `createConstraintsResolver` (`@granit/react-validation`), with a
**client-only FQDN regex** layered on top as a UX guard. The CMS contract carries
no `pattern` on `host` — the .NET endpoint runs the authoritative hostname check —
so that regex is a front augmentation; drop it once the backend exposes the
pattern in `contracts/openapi/cms-hostnames.json`. `Validation:Builtin:*` error
messages are owned by the backend `Granit.Validation` package (loaded by the host
app); the form field name `host` matches the `SiteHostnameCreateRequest` property,
so no remapping is needed.

## Out of scope / caveats

- **No provider, no client.** The kit renders only. The host mounts
  `CmsHostnamesProvider` (which resolves the Axios client from a
  `GranitClientProvider`); nothing is baked in.
- **i18n is the host's job.** The bundles ship the strings but the host must call
  `addResourceBundle`. Keys keep the literal `cms:` prefix (`nsSeparator=false`);
  `cms:Common.*` keys (Actions, Cancel, Remove, Saving) are app-global and not
  shipped here.
- **No set-primary action.** Primary is chosen at creation
  (`SiteHostnameCreateRequest.isPrimary`); the CMS backend exposes no set-primary
  endpoint, so the page omits that control and disables remove on the primary
  hostname. (The `cms:Hostnames.*Primary*` strings are reserved for a future
  backend capability.)
- **Owner-scoped hostnames are elsewhere.** The top-level
  [`@granit/react-ui-hostnames`](../react-ui-hostnames) covers owner-scoped
  managed hostnames; this package is strictly CMS site-scoped.
- **Mutation errors surface via toasts.** Mutations call `mutate` (not
  `mutateAsync`); failures route to the headless `MutationCache.onError` toast,
  so components carry no local `catch`.

## License

Apache-2.0
