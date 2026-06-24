# @granit/react-entities-customization

React hooks, provider and **headless layout editors** for the Granit **Layer 1
customization** module — read and replace the **layout deltas** that reorder,
regroup or hide fields on an entity form/view or a workspace. This is the
**React hooks layer**: it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/entities-customization`](../entities-customization) in TanStack Query
hooks behind a shared `CustomizationProvider`, and adds pure delta helpers plus
unstyled (`data-*`-marked) editor and inspector components.

The split is three packages over the same .NET `Granit.EntitiesCustomization`
backend (ADR-053; contract: `contracts/openapi/entities-customization.json`):

- [`@granit/entities-customization`](../entities-customization) —
  framework-agnostic core: wire DTOs, Axios functions
  (`getEntityCustomization`, `putWorkspaceCustomization`, …) and permission keys.
- `@granit/react-entities-customization` (this package) — React Query hooks +
  provider + pure delta helpers + headless editors.
- [`@granit/react-ui-entities-customization`](../react-ui-entities-customization) —
  admin feature kit: the styled layout-editor page and field-resolution
  inspector, gated by `@granit/react-authorization`.

A customization is a small ordered list of deltas layered on top of a base
entity/workspace layout; the base is never mutated, so deleting the record
restores it. The editors here are fully controlled (the parent owns the `deltas`
array) and ship **no** design-system chrome — apps style them via the
`data-granit-*` markers and feed labels from their own i18n. Sibling domains:
[`@granit/entities`](../entities) (entity schemas) and
[`@granit/entities-views`](../entities-views) (saved views).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/entities-customization` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types (`ISODateString` on workspace audit fields).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the
  `@granit/react-entities-customization/testing` subpath.

## Quick start

Wire the provider once (it resolves the Axios client, API base and an optional
query-key prefix), then call the hooks anywhere below it. The provider composes
both the `/entities/...` and `/workspaces/...` surfaces from `apiBase`, since
Layer 1 customization spans both.

```tsx
import {
  CustomizationProvider,
  useEntityCustomization,
  usePutEntityCustomization,
  FormLayoutEditor,
} from '@granit/react-entities-customization';
import { useGranitClient } from '@granit/react-api-client';
import type { SchemaField } from '@granit/react-entities-customization';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <CustomizationProvider config={{ client: useGranitClient() }}>
      {children}
    </CustomizationProvider>
  );
}

function QuoteFormLayout({ fields }: { fields: readonly SchemaField[] }) {
  const { data } = useEntityCustomization({ entityName: 'Quote', layoutKind: 'FormDefault' });
  const put = usePutEntityCustomization();

  // The editor is controlled: hold the delta list, PUT it on save.
  const deltas = data?.deltas ?? [];
  return (
    <FormLayoutEditor
      fields={fields}
      deltas={deltas}
      onChange={(next) =>
        put.mutate({ entityName: 'Quote', layoutKind: 'FormDefault', request: { deltas: next } })
      }
    />
  );
}
```

The delta helpers are pure and React-free, so an app can compute the next
`deltas` list (with its own undo/redo) before persisting:

```ts
import {
  applyDeltas,
  moveFieldUp,
  toggleFieldHidden,
} from '@granit/react-entities-customization';

const effective = applyDeltas(fields, deltas); // ordered, with hidden/group resolved
const reordered = moveFieldUp(fields, deltas, 'amount'); // appends a `reorder` delta
const next = toggleFieldHidden(fields, reordered, 'internalNotes'); // append/strip `hide`
```

On a successful PUT the matching read query is invalidated and the optional
`onFormCustomizationChanged` / `onWorkspaceCustomizationChanged` provider hooks
fire — apps wire those to invalidate the entity/workspace **manifest** cache
(`@granit/react-entities` / `@granit/react-workspaces`), which the provider does
not depend on directly.

## Public API

| Symbol                                                         | Kind      | Purpose                                                               |
| -------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| `CustomizationProvider`                                        | provider  | Supplies client, `apiBase`, query-key prefix + change-invalidators    |
| `useCustomizationConfig`                                       | hook      | Read the resolved config; throws outside a provider                   |
| `buildCustomizationQueryKey`                                   | fn        | Query-key factory honoring the configured `queryKeyPrefix`            |
| `useEntityCustomization`                                       | hook      | `GET .../entities/{name}/customization/{layoutKind}` — read deltas    |
| `usePutEntityCustomization`                                    | hook      | `PUT` entity deltas; invalidates + fires `onFormCustomizationChanged` |
| `useWorkspaceCustomization`                                    | hook      | `GET .../workspaces/{name}/customization` — read deltas               |
| `usePutWorkspaceCustomization`                                 | hook      | `PUT` workspace deltas; invalidates + fires the workspace hook        |
| `applyDeltas`                                                  | fn        | Pure: fold deltas over schema fields → ordered `EffectiveField[]`     |
| `moveFieldUp` / `moveFieldDown`                                | fn        | Pure: append a `reorder` delta (or return input if at an edge)        |
| `toggleFieldHidden`                                            | fn        | Pure: append a `hide` delta, or strip it when un-hiding               |
| `setFieldGroup`                                                | fn        | Pure: set/clear a field's `regroup` delta                             |
| `FormLayoutEditor`                                             | component | Headless per-field rows: move up/down, hide/show, group `<select>`    |
| `WorkspaceLayoutEditor`                                        | component | Same editor, named for workspace tiles (delegates to the form one)    |
| `FieldInspectorOverlay`                                        | component | Headless `<dialog>` showing the 5-layer resolution chain              |
| `RESOLUTION_LAYERS`                                            | const     | Frozen ordered list of the 5 `ResolutionLayer` keys                   |
| `DEFAULT_API_BASE` / `API_VERSION`                             | const     | Provider API-base default (`/api/v1`) and its version segment `v1`    |
| `DEFAULT_QUERY_KEY_PREFIX`                                     | const     | Default query-key prefix (`['entities-customization']`)               |
| `customizationTranslationsEn` / `customizationTranslationsFr`  | const     | i18next resource bundles (namespace `customization`)                  |
| `SchemaField` / `EffectiveField`                               | type      | Field before / after deltas apply                                     |
| `ResolutionLayer` / `FieldResolutionEntry`                     | type      | One layer key / one contributing source for the inspector             |
| `CustomizationConfig` / `ResolvedCustomizationConfig`          | type      | Provider input / resolved output                                      |
| `CustomizationProviderProps`                                   | type      | `{ config, children }`                                                |
| `*EditorProps` / `*Labels`                                     | type      | Per-component props and label overrides                               |
| `CustomizationTranslations`                                    | type      | Shape of the i18n resource bundles                                    |

`./testing` subpath (requires the optional `msw` peer):
`createEntityCustomizationHandlers` and `createWorkspaceCustomizationHandlers`
(stateful MSW handlers, default base `/api/v1`; PUT echoes the submitted deltas,
DELETE resets the entity layout) plus the `mockSchemaFields`, `mockLayoutDeltas`,
`mockEntityCustomization` and `mockWorkspaceCustomization` fixtures.

## Out of scope / caveats

- **Client-side gating is a UX hint, not a security boundary.** The editors take
  a `readOnly` flag that apps drive from the
  `EntitiesCustomization.Forms.Manage` permission
  (`@granit/react-authorization` `usePermissions`). The backend re-checks
  authorization on every read and PUT; never rely on `readOnly` for enforcement.
- **Headless, no chrome.** `FormLayoutEditor`, `WorkspaceLayoutEditor` and
  `FieldInspectorOverlay` render semantic markup with `data-granit-*` markers and
  no design-system styling. The styled admin page and inspector live in
  [`@granit/react-ui-entities-customization`](../react-ui-entities-customization).
- **Editors don't call `useTranslation`.** They expose `labels` props; apps pass
  `t()` results from the exported `customization` i18n bundles. This keeps the
  package testable without an i18next bootstrap.
- **Delta resolution mirrors the backend** (ADR-053 §4): deltas apply in order,
  unknown `reorder` anchors are silently ignored (the backend rejects them on
  PUT, so the editor never persists an invalid delta), and there is no `show`
  delta — un-hiding strips the `hide` entry. The inspector renders the full
  5-row chain even for layers with no data (the anti-Frappe guarantee).
- **DTOs and HTTP transport** are owned by
  [`@granit/entities-customization`](../entities-customization) (mirror of
  `Granit.EntitiesCustomization`); hooks here only adapt them to React Query.
- **Manifest invalidation is the caller's job** — the provider exposes
  `onFormCustomizationChanged` / `onWorkspaceCustomizationChanged` callbacks
  instead of taking a hard dependency on `@granit/react-entities` /
  `@granit/react-workspaces`.

## License

Apache-2.0
