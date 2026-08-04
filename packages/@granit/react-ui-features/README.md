# @granit/react-ui-features

Admin UI kit for the Granit **Features** module — the feature-flag listing
(definitions grouped into collapsible cards), value badges, a per-feature detail
page and the set / remove-override dialog. This is the **react-ui admin feature
kit** layer: the visual top of the stack. It composes the headless
[`@granit/react-features`](../react-features) (data hooks + `FeaturesProvider`)
with the foundation UI package [`@granit/react-ui`](../react-ui) and ships
ready-to-route pages. It owns no HTTP transport and no DTOs.

The split is three packages over the same .NET `Granit.Features` backend
(contract: `contracts/openapi/features.json`):

- [`@granit/features`](../features) — framework-agnostic core: DTOs
  (`FeatureGroupResponse`, `FeatureDefinitionResponse`, …) + Axios functions
  (`getFeatureDefinitions`, `setFeatureOverride`, …) + `FeaturesPermissions`.
- [`@granit/react-features`](../react-features) — React Query hooks + the
  `FeaturesProvider` (client / base-path / query-key config). Headless.
- `@granit/react-ui-features` (this package) — admin UI: list/detail pages,
  group cards, value badges, the override dialog, and the i18n bundles.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-features` — headless data hooks + `FeaturesProvider` these
  components mount and call.
- `@granit/features` — core DTO types (`FeatureDefinitionResponse`,
  `FeatureGroupResponse`, `FeatureValueResponse`) the components are typed
  against.
- `@granit/react-api-client` — `useGranitClient`, which resolves the Axios
  client (CSRF, auth, tenant interceptors) from a `GranitClientProvider` in the
  host tree. No client is baked in.
- `@granit/react-ui` — the shadcn-based foundation (`Card`, `Dialog`, `Badge`,
  `Spinner`, `Switch`, `Select`, `Input`, `toast`, …).
- `@granit/react-localization` — `useTranslation`; the host registers the
  bundles this package ships.
- `lucide-react` (`^1.21`) — `ArrowLeft`, `ChevronDown`, `ChevronRight` icons.
- `react` / `react-dom` (`^19`).
- `react-router` (`^7.18`) — the pages use `useNavigate`, `useParams`, and
  `<Link>`; they expect a router in the host.

## Quick start

The pages are self-wiring: each mounts its own `FeaturesProvider` from the Axios
client resolved via `useGranitClient`, so a host only needs a
`GranitClientProvider` above, a router, the i18n bundle registered, and a
`<Toaster />` for the override toasts.

```tsx
import { FeatureDetailPage, FeatureListPage } from '@granit/react-ui-features';
import { featuresTranslationsEn } from '@granit/react-ui-features';
import { Route, Routes } from 'react-router';
import i18n from './i18n';

// Register the shipped Features.* strings once, at app boot.
i18n.addResourceBundle('en', 'translation', featuresTranslationsEn, true, true);

function FeaturesRoutes() {
  // A <GranitClientProvider> and a <Toaster /> are mounted higher in the tree.
  return (
    <Routes>
      <Route path="/features" element={<FeatureListPage />} />
      <Route path="/features/:name" element={<FeatureDetailPage />} />
    </Routes>
  );
}
```

`FeatureListPage` renders one `FeatureGroupCard` per `FeatureGroupResponse`, each
collapsible and linking to `/features/:name`. `FeatureDetailPage` reads the
`:name` param, shows the definition + current state, and embeds
`SetOverrideDialog`. The dialog drives `useSetFeatureOverride` /
`useDeleteFeatureOverride` from `@granit/react-features` and reports via
`toast`, branching its control (switch / number input / select) on the
definition's `valueType` (`Toggle` / `Numeric` / `Selection`).

The standalone components can also be composed directly — for example a value
badge inside a custom table:

```tsx
import { FeatureValueBadge } from '@granit/react-ui-features';
import type { FeatureDefinitionResponse } from '@granit/features';

function Cell({ definition, value }: { definition: FeatureDefinitionResponse; value: string }) {
  // Toggle → enabled/disabled, Selection → secondary, Numeric → outline.
  return <FeatureValueBadge definition={definition} value={value} />;
}
```

## Public API

| Symbol                   | Kind      | Purpose                                                            |
| ------------------------ | --------- | ------------------------------------------------------------------ |
| `FeatureListPage`        | component | Route page: grouped, collapsible feature-flag listing              |
| `FeatureDetailPage`      | component | Route page (`:name`): definition + current state + override dialog |
| `FeatureGroupCard`       | component | Collapsible card for one `FeatureGroupResponse`, links per feature |
| `FeatureValueBadge`      | component | Value badge, styled per `valueType` (toggle / selection / numeric) |
| `SetOverrideDialog`      | component | Set / remove a feature override; control varies by `valueType`     |
| `featuresTranslationsEn` | const     | English i18next bundle (flat `Features.*` keys, `translation` ns)  |
| `featuresTranslationsFr` | const     | French i18next bundle                                              |
| `FeaturesTranslations`   | type      | `typeof featuresTranslationsEn` — the bundle's key shape           |

## Out of scope / caveats

- **Self-mounted provider, no prop config.** Both pages mount their own
  `FeaturesProvider` from `useGranitClient()`; they take no client / base-path
  props. To customize the base path or query-key prefix, compose the smaller
  components under your own `FeaturesProvider` instead of the page wrappers.
  This implies a `GranitClientProvider` (and thus a `QueryClientProvider`) must
  be present above these routes.
- **Host-owned i18n.** The package ships the `Features.*` strings
  (`featuresTranslationsEn` / `featuresTranslationsFr`) but does not register
  them — the host calls `addResourceBundle`. `Common.*` keys (e.g.
  `Common.Cancel`, used by the override dialog) are expected to be app-global,
  not provided here.
- **Host-owned toasts.** Override mutations report success via `toast` from
  `@granit/react-ui` (`sonner`); mount a `<Toaster />` in the host or the
  feedback is silently dropped.
- **Permission gating is the caller's job.** This kit renders the override
  controls unconditionally; it does not check `FeaturesPermissions`. Gate the
  routes / the dialog with `@granit/react-authorization` upstream. As always,
  client-side gating is a UX hint — the `Granit.Features` backend is the
  authoritative enforcer of every override write.
- **Transport and DTOs are elsewhere.** All HTTP and the wire types live in
  [`@granit/features`](../features) (mirror of `Granit.Features`); the data
  hooks live in [`@granit/react-features`](../react-features). This package is
  rendering only.

## License

Apache-2.0
