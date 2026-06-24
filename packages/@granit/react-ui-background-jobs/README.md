# @granit/react-ui-background-jobs

Admin **UI feature kit** for the Granit **Background Jobs** module — the
recurring-jobs monitoring page (a sortable, paginated list plus a kanban view of
job cards), a status badge, per-job actions (pause / resume / trigger now) and
human-readable cron-expression rendering.

This is the **react-ui** (visual) layer. It holds the rendering only; it composes
the headless [`@granit/react-background-jobs`](../react-background-jobs) (TanStack
Query data hooks + `BackgroundJobsProvider`) with the foundation UI packages
([`@granit/react-ui`](../react-ui), [`@granit/react-ui-kit`](../react-ui-admin-kit)).
The DTOs, Axios calls and permission constants come from the framework-agnostic
core, [`@granit/background-jobs`](../background-jobs).

The split is three packages over the same .NET `Granit.BackgroundJobs` backend
(contract: `contracts/openapi/background-jobs.json`):

- [`@granit/background-jobs`](../background-jobs) — framework-agnostic core: the
  `BackgroundJobStatus` DTO, Axios functions (`listBackgroundJobs`, `pauseJob`,
  `resumeJob`, `triggerJob`, …) and `BackgroundJobsPermissions`.
- [`@granit/react-background-jobs`](../react-background-jobs) — React Query hooks
  (`useBackgroundJobs`, `usePauseJob`, …) + `BackgroundJobsProvider`.
- `@granit/react-ui-background-jobs` (this package) — admin page, cards, badge,
  column factory and cron-locale wiring.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-background-jobs` — headless data hooks + `BackgroundJobsProvider`
  this kit renders against.
- `@granit/background-jobs` — core `BackgroundJobStatus` DTO consumed by the cards,
  columns and badge.
- `@granit/react-api-client` — `useGranitClient`, the Axios client the page hands
  to the headless provider.
- `@granit/react-ui` and `@granit/react-ui-kit` — shadcn primitives plus
  `ManualDataTable` / `ViewSwitcher`.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/utils` — `cn` class-name helper.
- `@tanstack/react-table` (`^8.21`) — `ColumnDef` for the column factory.
- `cronstrue` (`^3.20`) — humanizes cron expressions; this module owns its locale
  mapping (see below).
- `lucide-react` (`^1.21`) — action / status icons.
- `react` and `react-dom` (`^19`).

## Quick start

`BackgroundJobListPage` is self-mounting: it resolves the Axios client from a
`GranitClientProvider` in the host tree and wraps its content in the headless
`BackgroundJobsProvider` itself — drop it on a route, register the strings, and
wire the cron locale to your language switch.

```tsx
import {
  BackgroundJobListPage,
  backgroundJobsTranslationsEn,
  backgroundJobsTranslationsFr,
  loadCronstrueLocale,
} from '@granit/react-ui-background-jobs';

// 1. Register the BackgroundJobs.* strings (flat keys, "translation" ns).
i18n.addResourceBundle('en', 'translation', backgroundJobsTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', backgroundJobsTranslationsFr, true, true);

// 2. Lazy-load the matching cronstrue locale on every language change (this
//    module is the only cronstrue consumer, so it owns the locale mapping).
void loadCronstrueLocale(i18n.language);
i18n.on('languageChanged', (lng) => void loadCronstrueLocale(lng));

// 3. Mount the page. A <GranitClientProvider> must be higher in the tree.
<Route path="/background-jobs" element={<BackgroundJobListPage />} />;
```

The lower-level pieces are exported for custom layouts. The list view uses
`ManualDataTable` fed by `createBackgroundJobColumns`; the kanban view renders one
`JobCard` per job. Both render `JobStatusBadge` (paused / active / failing) and
`JobActions` (pause ↔ resume, trigger now), each driven by the headless mutation
hooks:

```tsx
import { createBackgroundJobColumns, JobCard } from '@granit/react-ui-background-jobs';
import { useBackgroundJobs, usePauseJob } from '@granit/react-background-jobs';
import { useDateFormatter, useTranslation } from '@granit/react-localization';

function JobKanban() {
  const { data } = useBackgroundJobs({ page: 1, pageSize: 20 });
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {(data?.items ?? []).map((job) => <JobCard key={job.jobName} job={job} />)}
    </div>
  );
}

// Column factory — pass the resolved t / formatters / mutation callbacks in.
const columns = createBackgroundJobColumns({
  t,
  locale: i18n.language,
  formatDateTime,
  formatTimeAgo,
  onPause: (job) => pause.mutate(job.jobName),
  onResume: (job) => resume.mutate(job.jobName),
  onTrigger: (job) => trigger.mutate(job.jobName),
  isMutating: pause.isPending || resume.isPending || trigger.isPending,
});
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `BackgroundJobListPage` | component | Self-wiring monitoring page: list + kanban, view switch, refresh |
| `JobCard` | component | Kanban card for one `BackgroundJobStatus` (schedule, runs, actions) |
| `JobActions` | component | Pause / resume + trigger-now buttons, driven by the headless hooks |
| `JobStatusBadge` | component | Status pill: paused / active / failing from job state |
| `createBackgroundJobColumns` | fn | `ColumnDef[]` factory for the `ManualDataTable` list view |
| `getCronstrueLocale` | fn | BCP 47 tag to cronstrue locale name (with base-language fallback) |
| `loadCronstrueLocale` | fn | Lazily `import()`s a cronstrue locale file; no-ops once loaded |
| `backgroundJobsTranslationsEn` | const | English `BackgroundJobs.*` i18next bundle (flat keys) |
| `backgroundJobsTranslationsFr` | const | French `BackgroundJobs.*` i18next bundle (flat keys) |
| `BackgroundJobsTranslations` | type | Shape of the translation bundle (keys = the `BackgroundJobs.*` ids) |

`createBackgroundJobColumns` is a pure factory, not a hook — call it inside a
`useMemo` with the resolved `t`, `locale`, date formatters and mutation callbacks
(see `BackgroundJobListPage` for the canonical wiring).

## Injection

- **API client** — `BackgroundJobListPage` reads it from the host
  `GranitClientProvider` (`@granit/react-api-client`) via `useGranitClient`, then
  hands it to the headless `BackgroundJobsProvider`. No client is baked in. When
  composing the lower-level pieces yourself, mount `BackgroundJobsProvider`.
- **i18n** — ships its `BackgroundJobs.*` strings (`backgroundJobsTranslationsEn` /
  `…Fr`); the host registers them. `Common.*` keys (e.g. `Common.Refresh`) are
  app-global and must already be present.
- **Cron rendering** — `getCronstrueLocale` / `loadCronstrueLocale` map BCP 47 tags
  to cronstrue locale files; the host wires `loadCronstrueLocale` to its
  `languageChanged` event. Tags without a dedicated cronstrue file fall back to
  their base language (`es-MX` → `es`); `hi` has no cronstrue locale and falls
  back to `en`.

## Out of scope

- **DTOs, HTTP transport and permissions** — owned by
  [`@granit/background-jobs`](../background-jobs) (mirror of `Granit.BackgroundJobs`);
  `BackgroundJobsPermissions` (`BackgroundJobs.Jobs.Read` / `.Manage`) lives there.
- **Data fetching, mutations and provider** — owned by
  [`@granit/react-background-jobs`](../react-background-jobs); this kit only renders
  against those hooks. Pause / resume / trigger are fire-and-forget mutations keyed
  by `jobName`.
- **Authorization enforcement** — gating the page or the action buttons is the
  host's job (e.g. `usePermissions` from `@granit/react-authorization`); the .NET
  backend remains the authoritative check on every endpoint.

## License

Apache-2.0
</content>
</invoke>
