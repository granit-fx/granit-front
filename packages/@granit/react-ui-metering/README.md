# @granit/react-ui-metering

Admin UI for the Granit **Metering** module — the meter catalog list (status
badges, create dialog), the meter detail page (usage summary, quota status,
publish / archive / edit / record-events) and the cross-tenant usage-aggregates
explorer. This is the **react-ui admin feature kit**: the visual layer that
composes the headless [`@granit/react-metering`](../react-metering) (provider +
TanStack Query hooks) with the foundation UI packages and renders ready-to-route
pages.

The split is three packages over the same .NET `Granit.Metering` backend
(contract: `contracts/openapi/metering.json`):

- [`@granit/metering`](../metering) — framework-agnostic core: DTOs, Axios
  functions (`createMeterDefinition`, `recordUsageEvents`, …),
  `MeteringPermissions`, and the generated `meteringConstraints`.
- [`@granit/react-metering`](../react-metering) — React Query hooks + the
  `MeteringProvider` (client / base-path / query-key configuration).
- `@granit/react-ui-metering` (this package) — admin pages, dialogs, cards, the
  table column factory, and the `Metering.*` i18n bundles.

These pages do **not** wrap a provider: the Axios client resolves from a
`MeteringProvider` (and a `QueryClientProvider`) mounted higher in the host tree.
The usage explorer is driven by
[`@granit/react-query-engine`](../react-query-engine) and reuses the querying
building blocks from [`@granit/react-ui-admin-kit`](../react-ui-admin-kit).
Meter-form validation is spec-driven via
[`@granit/react-validation`](../react-validation) against the generated
`@granit/metering` constraints.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/metering` — core DTOs + the generated `meteringConstraints`.
- `@granit/react-metering` — provider + hooks this kit calls.
- `@granit/react-ui` — shadcn/ui foundation (`Button`, `Dialog`, `Table`,
  `Form`, `Card`, `Badge`, `toast`, …).
- `@granit/react-ui-admin-kit` — query-engine UI (`QueryDataTable`,
  `SmartFilterBar`, `SortSelector`, …) for the usage explorer.
- `@granit/react-query-engine` — `QueryProvider` + query hooks for the usage
  explorer.
- `@granit/query-engine` — `QueryConfig` for the usage-aggregates endpoint.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-validation` — `createConstraintsResolver` for the meter and
  record-events forms.
- `@granit/types` — `toEntityId` / `toISODateString` branded helpers.
- `@granit/utils` — `cn` class merge.
- `@tanstack/react-table` (`^9.0`) — the meter list table model.
- `react-hook-form` (`^7.80`) — the meter / record-events forms.
- `react-router` (`^7.18`) — navigation + route params in the pages.
- `lucide-react` (`^1.21`), `react` (`^19`), `react-dom` (`^19`).

## Quick start

Register the i18n bundles, mount the host providers once, then route the pages.
The pages read the meter id from the router (`useParams`), so wire them under a
parameterized route.

```tsx
import { MeteringProvider } from '@granit/react-metering';
import { useGranitClient } from '@granit/react-api-client';
import {
  MeterListPage,
  MeterDetailPage,
  MeteringUsagePage,
  meteringTranslationsEn,
  meteringTranslationsFr,
} from '@granit/react-ui-metering';
import { Route, Routes } from 'react-router';
import i18n from 'i18next';

// Flat keys keep the literal "Metering." prefix; the host i18n is configured
// with nsSeparator/keySeparator = false. The "translation" namespace is implied.
i18n.addResourceBundle('en', 'translation', meteringTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', meteringTranslationsFr, true, true);

function MeteringRoutes() {
  // A <QueryClientProvider> is assumed higher in the tree.
  return (
    <MeteringProvider config={{ client: useGranitClient() }}>
      <Routes>
        <Route path="/metering" element={<MeterListPage />} />
        <Route path="/metering/usage" element={<MeteringUsagePage />} />
        <Route path="/metering/:id" element={<MeterDetailPage />} />
      </Routes>
    </MeteringProvider>
  );
}
```

The list and detail pages are self-contained — they fetch through the
`@granit/react-metering` hooks and render the create / edit / archive /
record-events dialogs internally. To embed a single piece (for example a meter
table inside another screen) reach for the lower-level exports:

```tsx
import { createMeterColumns, QuotaStatusCard } from '@granit/react-ui-metering';
import { useActiveMeters, useMeteringQuota } from '@granit/react-metering';
import { useTranslation } from '@granit/react-localization';
import { toEntityId } from '@granit/types';
import { dataTableFeatures } from '@granit/react-ui-kit';
import { useTable } from '@tanstack/react-table';

function MeterPicker({ onPick }: { onPick: (id: string) => void }) {
  const { t } = useTranslation();
  const { data: meters } = useActiveMeters();
  const columns = createMeterColumns({ t, onViewDetail: onPick });
  const table = useTable({
    features: dataTableFeatures,
    data: [...(meters ?? [])],
    columns,
  });
  // render `table` …
  return null;
}

function QuotaTile({ meterId }: { meterId: string }) {
  const { data: quota } = useMeteringQuota(toEntityId<'MeterDefinition'>(meterId));
  return quota ? <QuotaStatusCard quota={quota} /> : null;
}
```

## Public API

| Symbol                   | Kind      | Purpose                                                                         |
| ------------------------ | --------- | ------------------------------------------------------------------------------- |
| `MeterListPage`          | component | Meter catalog table (status badges) + create dialog; routes to detail           |
| `MeterDetailPage`        | component | One meter: info, usage + quota cards, publish/archive/edit/record               |
| `MeteringUsagePage`      | component | Cross-tenant usage-aggregates explorer (query-engine grid, own provider)        |
| `MeterForm`              | component | Create / edit meter form; spec-driven validation; discriminated `mode`          |
| `createMeterColumns`     | fn        | `DataTableColumnDef[]` factory for the meter table (name/type/unit/status/view) |
| `ArchiveMeterDialog`     | component | Confirm-and-archive a meter via `useArchiveMeterDefinition`                     |
| `RecordEventsDialog`     | component | Batch usage-event entry (field array) via `useRecordUsageEvents`                |
| `QuotaStatusCard`        | component | Quota gauge: percent-used bar, current/limit, exceeded callout                  |
| `UsageSummaryCard`       | component | Aggregated value / period / event-count summary for a period                    |
| `MeterFormValues`        | type      | `{ name, description, aggregationType, unit }` form shape                       |
| `meteringTranslationsEn` | const     | English `Metering.*` i18next resource bundle (flat keys)                        |
| `meteringTranslationsFr` | const     | French `Metering.*` i18next resource bundle (flat keys)                         |
| `MeteringTranslations`   | type      | Type of the bundle, for compile-time key parity between locales                 |

## Out of scope / caveats

- **No provider wrapped here.** The pages assume a `MeteringProvider` (Axios
  client, base path) and a `QueryClientProvider` are mounted by the host. Only
  `MeteringUsagePage` wraps its own `QueryProvider`, pinned to the
  `/api/v1/metering/usage-aggregates` query-engine endpoint.
- **Validation is owned by the spec, not this kit.** `MeterForm` and
  `RecordEventsDialog` build their resolvers from
  `meteringConstraints.{MeterDefinitionCreateRequest,MeterDefinitionUpdateRequest,RecordUsageRequest}`
  via `createConstraintsResolver`; `Validation:Builtin:*` messages are owned by
  the host `Granit.Validation`. The `aggregationType` select offers only
  `Sum / Count / Max / Last` — `CountDistinct` is intentionally omitted because
  the form does not collect a `distinctProperty`; `aggregationType` is also
  immutable on edit (absent from `MeterDefinitionUpdateRequest`).
- **i18n registration is the host's job.** The bundles ship flat keys carrying
  the literal `Metering.` prefix (host i18n uses `nsSeparator`/`keySeparator =
false`); the host must `addResourceBundle` them and also provide the shared
  `Common.*` keys (`Save`, `Cancel`, `NoResults`, …) the pages reference.
- **Detail page period window.** `MeterDetailPage` queries usage for the current
  UTC billing month (`[month-start, next-month-start)`); the usage endpoint
  matches an aggregate on exact period bounds.
- **Mutations route errors globally.** Dialogs and pages call `mutate` (not
  `mutateAsync`), deferring failures to the global `MutationCache.onError`
  toast; only success toasts are raised locally.
- **Permission gating lives elsewhere.** This kit renders controls
  unconditionally — gate routes/buttons with the permission hooks against
  `MeteringPermissions` (from `@granit/metering`) in the host. Client-side
  checks are a UX hint; the .NET backend remains the authoritative enforcer.

## License

Apache-2.0
