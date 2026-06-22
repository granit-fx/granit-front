# @granit/react-ui-metering

Admin UI for the **Metering** module — the meter catalog list (status badges,
create dialog), the meter detail page (usage summary, quota status, publish /
archive / edit / record-events) and the cross-tenant usage-aggregates explorer.

The **visual** layer for metering: it composes the headless
[`@granit/react-metering`](../react-metering) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui)). The usage explorer is
driven by [`@granit/react-query-engine`](../react-query-engine) and reuses the
querying building blocks from
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit). Meter-form validation is
spec-driven via [`@granit/react-validation`](../react-validation) against the
generated [`@granit/metering`](../metering) constraints.

## Usage

```tsx
import {
  MeterListPage,
  MeterDetailPage,
  MeteringUsagePage,
  meteringTranslationsEn,
} from '@granit/react-ui-metering';

i18n.addResourceBundle('en', 'translation', meteringTranslationsEn, true, true);

// Mount under a MeteringProvider (from @granit/react-metering):
<Route path="/metering" element={<MeterListPage />} />
<Route path="/metering/:id" element={<MeterDetailPage />} />
<Route path="/metering/usage" element={<MeteringUsagePage />} />;
```

## Injection

- **API client** — resolved from a `MeteringProvider` (`config.client` or the
  nearest `GranitClientProvider`) higher in the tree, via the
  `@granit/react-metering` hooks. No client baked in; the pages do NOT wrap a
  provider.
- **Validation** — `createConstraintsResolver` from `@granit/react-validation`
  drives the meter form from the `@granit/metering`
  `MeterDefinitionCreateRequest` / `MeterDefinitionUpdateRequest` constraints and
  the record-events form from `RecordUsageRequest`.
- **i18n** — ships its `Metering.*` strings (`meteringTranslationsEn/Fr`); the
  host registers them. Keys are flat (`translation` namespace).
