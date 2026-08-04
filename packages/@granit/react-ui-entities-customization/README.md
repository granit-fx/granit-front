# @granit/react-ui-entities-customization

Admin **feature kit** for entity & workspace layout customization — the styled
form-layout editor (reorder, regroup, hide fields as **Layer 1 admin
overrides**) with a field-resolution inspector, plus the saved-views manager
(create / edit / pin / set tenant & personal defaults / delete). This is the
**react-ui admin layer**: it has no transport or query logic of its own.

It composes the headless hooks layers
[`@granit/react-entities-customization`](../react-entities-customization)
(provider + layout/inspector editors + customization hooks),
[`@granit/react-entities`](../react-entities) (entity discovery + metadata),
[`@granit/react-entities-views`](../react-entities-views) (saved-view CRUD +
flag mutations) and [`@granit/react-workspaces`](../react-workspaces) (workspace
tree) with the foundation design system [`@granit/react-ui`](../react-ui), and
gates each tab with [`@granit/react-authorization`](../react-authorization)
`usePermissions`. It spans three .NET backends —
`Granit.EntitiesCustomization`, `Granit.Entities.Views` and
`Granit.Workspaces` (contracts: `contracts/openapi/entities-customization.json`,
`contracts/openapi/entities-views.json`, `contracts/openapi/workspaces.json`).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers (all `workspace:*`):

- `@granit/react-entities-customization` — provider, customization hooks
  (`useEntityCustomization`, `usePutEntityCustomization`,
  `useWorkspaceCustomization`, …), `FormLayoutEditor`, `WorkspaceLayoutEditor`,
  `FieldInspectorOverlay`, `RESOLUTION_LAYERS`.
- `@granit/react-entities-views` — saved-view CRUD + pin/default mutations.
- `@granit/react-entities` — `useEntityDiscovery` / `useEntityMetadata`.
- `@granit/react-workspaces` — `useWorkspaces` (workspace tree).
- `@granit/react-authorization` — `usePermissions` for tab gating.
- `@granit/react-ui` — the shadcn/ui foundation (tabs, cards, dialogs, sheet,
  selects, toast).
- `@granit/react-localization` — `useTranslation`.
- `@granit/entities-customization` and `@granit/entities-views` — the core DTO
  packages (`LayoutDelta`, `LayoutKind`, `EntityViewResponse`, …) the typed
  props flow through.
- `lucide-react` (`^1.21`), `react` (`^19`), `react-dom` (`^19`).

## Quick start

Mount `CustomizationPage` under a `GranitClientProvider` plus the
`EntitiesCustomizationProvider` from `@granit/react-entities-customization` (which
resolves the Axios client, base path and query-key prefix that all the wrapped
hooks read). Register the bundled strings, then route to the page:

```tsx
import { EntitiesCustomizationProvider } from '@granit/react-entities-customization';
import {
  CustomizationPage,
  entitiesCustomizationAdminTranslationsEn,
} from '@granit/react-ui-entities-customization';
import { Route } from 'react-router';

// Flat `customization:*` / `views:*` keys live in the `translation` namespace —
// register with key/namespace separators disabled so the dotted keys resolve
// verbatim (the prefix is part of the key, not an i18next namespace).
i18n.addResourceBundle('en', 'translation', entitiesCustomizationAdminTranslationsEn, true, true);

function CustomizationRoute() {
  return (
    <EntitiesCustomizationProvider config={{ client: useGranitClient() }}>
      <Route path="/settings/customization" element={<CustomizationPage />} />
    </EntitiesCustomizationProvider>
  );
}
```

`CustomizationPage` renders a top-level **Layouts** / **Views** tab strip,
showing only the tabs the user is permitted to manage
(`EntitiesCustomization.Forms.Manage` for Layouts,
`Entities.Views.Manage` for Views); if neither permission is held it renders an
access-denied panel. The Layouts tab nests **Forms** (per-entity
`FormLayoutEditor` with a field-resolution inspector sheet) and **Workspaces**
(`WorkspaceCustomizationTab`); the Views tab is the saved-views manager.

The three nested tab bodies are also exported individually for hosts that build
their own page shell:

```tsx
import {
  EntityCustomizationSection,
  EntityViewsTab,
  WorkspaceCustomizationTab,
} from '@granit/react-ui-entities-customization';
```

`WorkspaceCustomizationTab` and `EntityViewsTab` are self-contained (they own
their entity/workspace picker and draft state); `EntityCustomizationSection` is
controlled — the parent owns the selected entity, the draft `LayoutDelta[]`,
save/reset handlers and the inspect callback (see `CustomizationPage` for the
canonical wiring).

## Public API

| Symbol                                     | Kind      | Purpose                                                                |
| ------------------------------------------ | --------- | ---------------------------------------------------------------------- |
| `CustomizationPage`                        | component | Full admin page: Layouts/Views tab strip, permission-gated per tab     |
| `EntityCustomizationSection`               | component | Controlled Forms/Workspaces editor for one entity (parent-owned state) |
| `EntityViewsTab`                           | component | Saved-views manager: create / edit / pin / defaults / delete           |
| `WorkspaceCustomizationTab`                | component | Self-contained workspace-layout editor with workspace picker           |
| `entitiesCustomizationAdminTranslationsEn` | const     | English flat `customization:*` / `views:*` strings bundle              |
| `entitiesCustomizationAdminTranslationsFr` | const     | French flat `customization:*` / `views:*` strings bundle               |

## Injection

- **API client** — nothing is baked in. The host wraps `EntitiesCustomizationProvider`
  (from `@granit/react-entities-customization`), which resolves the Axios client
  from a `GranitClientProvider` higher in the tree (via
  `@granit/react-api-client`); the views and workspace hooks resolve the same
  client.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates
  the page: `EntitiesCustomization.Forms.Manage` for the Layouts tab,
  `Entities.Views.Manage` for the Views tab. Both checks are **UX gating only** —
  the .NET backends remain the authoritative authorization boundary (see
  [`@granit/react-authorization`](../react-authorization) for the full security
  model).
- **i18n** — ships its `customization:*` and `views:*` strings
  (`entitiesCustomizationAdminTranslationsEn` / `…Fr`); the host registers them.
  The `customization:` / `views:` prefix is a literal part of each flat key, not
  an i18next namespace — register with key/namespace separators disabled.

## Out of scope / caveats

- **Headless layer only mocked beyond Layer 1.** The field-resolution inspector
  wires live data for **Layer 1 (admin)** only; the remaining resolution layers
  from `RESOLUTION_LAYERS` render with `value: null` so the canonical 5-layer
  table and Layer 1's `winning` badge surface. Tenant/user override layers are
  not yet fed real data here.
- **No transport or DTOs.** All HTTP and React Query logic lives in the headless
  hooks layers; this kit only renders them. Wire DTOs (`LayoutDelta`,
  `LayoutKind`, `EntityViewResponse`, …) are owned by the core packages
  [`@granit/entities-customization`](../entities-customization) and
  [`@granit/entities-views`](../entities-views).
- **Permission checks are UX hints, not enforcement.** Hiding a tab does not
  stop the underlying API call; every mutation is re-authorized server-side.

## License

Apache-2.0
