# @granit/react-ui-cms-releases

Admin UI for the **CMS Releases** module — the releases list (status badges,
schedule column, publish action), the release detail page (schedule / reschedule /
cancel, per-action status table) and the create-release dialog. A release bundles a
set of publish/unpublish actions against site content and runs them at a scheduled
time; this package renders the admin surface for managing that lifecycle.

This is the **`react-ui` admin feature kit** — the visual layer. It is headless-free:
it composes the headless [`@granit/react-cms`](../react-cms) (provider + release
hooks) with the foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)). The split is three packages
over the same .NET `Granit.Cms` backend (contract: `contracts/openapi/cms.json`):

- [`@granit/cms`](../cms) — framework-agnostic core: release DTOs (`ReleaseResponse`,
  `ReleaseStatus`, …), spec-driven `cmsConstraints`, and Axios calls.
- [`@granit/react-cms`](../react-cms) — TanStack Query hooks + `CmsProvider`
  (`useReleases`, `useRelease`, `useCreateRelease`, `useScheduleRelease`,
  `useCancelRelease`, `usePublishRelease`, …).
- `@granit/react-ui-cms-releases` (this package) — the pages and dialog. Siblings
  cover the other CMS surfaces ([`@granit/react-ui-cms-pages`](../react-ui-cms-pages),
  [`@granit/react-ui-cms-sites`](../react-ui-cms-sites),
  [`@granit/react-ui-cms-menus`](../react-ui-cms-menus), …).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. A consumer must declare these peers:

- `@granit/cms` — release DTOs and the `cmsConstraints` the forms validate against.
- `@granit/react-cms` — release hooks; the `CmsProvider` that resolves the Axios
  client must already be mounted higher in the host tree.
- `@granit/react-ui` — foundation components (`Table`, `Dialog`, `Form`, `Badge`,
  `Button`, `Input`, `toast`, …).
- `@granit/react-ui-admin-kit` — supplies `TimezonePicker` for the schedule fields.
- `@granit/react-validation` — `createConstraintsResolver`, the spec-driven
  react-hook-form resolver.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `react` (`^19`), `react-dom` (`^19`), `react-hook-form` (`^7.80`),
  `react-router` (`^7.18`), and `lucide-react` (`^1.21`) for the icons.

## Quick start

The pages do **not** wrap a provider — the host owns the `CmsProvider` (and through
it the Axios client). Mount the routes under it and register the i18n bundle once.

```tsx
import {
  ReleasesListPage,
  ReleaseDetailPage,
  cmsReleasesTranslationsEn,
  cmsReleasesTranslationsFr,
} from '@granit/react-ui-cms-releases';
import { CmsProvider } from '@granit/react-cms';
import { useGranitClient } from '@granit/react-api-client';
import { Route, Routes } from 'react-router';

// Flat keys keep the literal `cms:` prefix; the host i18n runs with
// nsSeparator/keySeparator = false, so register under the `translation` namespace.
i18n.addResourceBundle('en', 'translation', cmsReleasesTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', cmsReleasesTranslationsFr, true, true);

function CmsAdminRoutes() {
  return (
    <CmsProvider config={{ client: useGranitClient() }}>
      <Routes>
        {/* `:id` is the site id, read from the route by both pages. */}
        <Route path="/cms/sites/:id/releases" element={<ReleasesListPage />} />
        <Route path="/cms/sites/:id/releases/:releaseId" element={<ReleaseDetailPage />} />
      </Routes>
    </CmsProvider>
  );
}
```

`ReleasesListPage` exposes the **New release** button, which opens the
`ReleaseFormDialog` inline; you only need to mount it standalone to drive the create
flow from somewhere else:

```tsx
import { ReleaseFormDialog } from '@granit/react-ui-cms-releases';
import { useState } from 'react';

function CreateReleaseButton({ siteId }: { siteId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        New release
      </button>
      {/* Scheduling is optional: a date/time triggers create-then-schedule. */}
      <ReleaseFormDialog open={open} onOpenChange={setOpen} siteId={siteId} />
    </>
  );
}
```

## Public API

| Symbol                      | Kind      | Purpose                                                             |
| --------------------------- | --------- | ------------------------------------------------------------------- |
| `ReleasesListPage`          | component | Paginated releases table with status badges + publish/view actions  |
| `ReleaseDetailPage`         | component | Release header, schedule card, and the per-action status table      |
| `ReleaseFormDialog`         | component | Create dialog (`{ open, onOpenChange, siteId }`); optional schedule |
| `cmsReleasesTranslationsEn` | const     | English `cms:Releases.*` i18next resource bundle (flat keys)        |
| `cmsReleasesTranslationsFr` | const     | French `cms:Releases.*` i18next resource bundle (flat keys)         |
| `CmsReleasesTranslations`   | type      | Shape of the resource bundle (key to string map)                    |

## Behaviour notes

- **Release list is not site-scoped on the wire.** `useReleases()` returns the
  query-engine paginated surface (`PaginationParams`); it is not filterable by
  `siteId`. The `:id` route param scopes navigation, not the fetch.
- **No delete.** Releases are _cancelled_ from the detail page, never deleted — the
  backend exposes no DELETE endpoint. Cancel is only offered while a release is
  schedulable.
- **Schedulable states.** Only `Draft` / `Ready` releases can be (re)scheduled or
  cancelled. `Running`, `Done`, and `Failed` are terminal/in-flight, so the detail
  page hides the schedule form and cancel button for them.
- **Publish gate.** The list's publish (`Send`) action is shown only for `Ready`
  releases.
- **Create-then-schedule.** A release with a date/time is created and _then_
  scheduled — two API calls, matching the backend's create-then-schedule model. The
  second call carries the new release's `concurrencyStamp`.
- **Optimistic concurrency.** `ScheduleReleaseRequest` carries the loaded release's
  `concurrencyStamp` (a body field, not `If-Match`); the form only validates the
  user-entered `localDateTime` / `timeZoneId`.
- **Errors via global toast.** Mutations use `mutate` (not `mutateAsync`), so
  failures route to the global mutation-cache error toast — no local `catch`.

## Out of scope

- **Data fetching, transport, and DTOs** — owned by [`@granit/react-cms`](../react-cms)
  (hooks) over [`@granit/cms`](../cms) (Axios calls + types, mirror of `Granit.Cms`).
  This package only renders them.
- **Provider wiring / Axios client** — the host mounts `CmsProvider`; these pages
  resolve the client through the react-cms hooks and bake in nothing.
- **Validation rules** — the `name`, `localDateTime`, and `timeZoneId` constraints
  come from `cmsConstraints` in [`@granit/cms`](../cms) (derived from the OpenAPI
  spec), not hand-written here.
- **i18n strings** — this package _ships_ its `cms:Releases.*` bundles; the host app
  is responsible for registering them with i18next.
- **Other CMS surfaces** — pages, sites, menus, SEO, redirects, and hostnames each
  have their own `react-ui-cms-*` sibling.

## License

Apache-2.0
