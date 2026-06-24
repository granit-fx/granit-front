# @granit/entities-customization

Framework-agnostic **Layer 1 customization** SDK — the TypeScript counterpart of
the .NET `Granit.EntitiesCustomization` module (ADR-053). It exposes the wire
types, HTTP client and permission keys needed to read and replace **layout
deltas** for entity forms/views and for workspaces, from any client (React,
React Native, a CLI, tests). It holds **no** React, DOM or Node-only dependency.

A customization is a small ordered list of **deltas** layered on top of a
base-layer entity or workspace layout: reorder a field relative to a sibling,
regroup a field into a (possibly new) group, or hide a field. The base layout is
never mutated — deltas are an override stratum the backend resolves at render
time, and deleting the customization record restores the base layout.

The React hooks + headless editors live in
[`@granit/react-entities-customization`](../react-entities-customization); the
admin feature kit (layout editor page, field-resolution inspector) lives in
[`@granit/react-ui-entities-customization`](../react-ui-entities-customization).
Sibling domains: [`@granit/entities`](../entities) (entity schemas) and
[`@granit/entities-views`](../entities-views) (saved views).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
the peers a consumer must provide:

- `@granit/api-client` — the centralized Axios client (CSRF, auth, tenant
  interceptors); every call here takes an `AxiosInstance`.
- `@granit/types` — branded primitives (`ISODateString` on workspace audit
  fields).

## Quick start

```ts
import {
  getEntityCustomization,
  putEntityCustomization,
  type EntityCustomizationRequest,
  type LayoutDelta,
} from '@granit/entities-customization';

// `apiBase` is the backend module root; `entityName` + `layoutKind` select the
// layout surface being customized.
const apiBase = '/api/v1/entities-customization';

// 1. Read the active deltas for the Party form layout.
const current = await getEntityCustomization(client, apiBase, 'Party', 'FormDefault');

// 2. Replace them. Each delta is a discriminated union on `$type`; the backend
//    rejects unknown kinds and validates shape (e.g. reorder needs exactly one
//    anchor).
const deltas: LayoutDelta[] = [
  { $type: 'hide', fieldName: 'internalNotes' },
  { $type: 'reorder', fieldName: 'email', beforeFieldName: 'phone', afterFieldName: null },
  { $type: 'regroup', fieldName: 'iban', groupKey: 'banking' },
];

const request: EntityCustomizationRequest = { deltas };
const saved = await putEntityCustomization(client, apiBase, 'Party', 'FormDefault', request);
```

## Public API

| Symbol                           | Kind  | Purpose                                                     |
| -------------------------------- | ----- | ----------------------------------------------------------- |
| `LayoutDelta`                    | type  | Discriminated union of the three delta shapes               |
| `LayoutDeltaKind`                | type  | `'reorder' \| 'regroup' \| 'hide'` discriminator catalog    |
| `ReorderDelta`                   | type  | Move a field before/after a sibling (exactly one anchor)    |
| `RegroupDelta`                   | type  | Move a field into a group (created on the fly)              |
| `HideDelta`                      | type  | Hide a field from the layout (kept in the schema)           |
| `LayoutKind`                     | type  | Surface: `FormDefault \| DetailDefault \| List \| …`        |
| `EntityCustomizationRequest`     | type  | `PUT .../entities/{name}/customization/{kind}` body         |
| `EntityCustomizationResponse`    | type  | `GET\|PUT` entity-customization response (`id`, deltas)     |
| `WorkspaceCustomizationRequest`  | type  | `PUT .../workspaces/{name}/customization` body              |
| `WorkspaceCustomizationResponse` | type  | Workspace response (deltas + `updatedAt`/`updatedByUserId`) |
| `getEntityCustomization`         | fn    | `GET {apiBase}/entities/{name}/customization/{layoutKind}`  |
| `putEntityCustomization`         | fn    | `PUT` the same path — replace the delta list                |
| `deleteEntityCustomization`      | fn    | `DELETE` the same path — restore the base layout            |
| `getWorkspaceCustomization`      | fn    | `GET {apiBase}/workspaces/{name}/customization`             |
| `putWorkspaceCustomization`      | fn    | `PUT` the same path — replace the workspace delta list      |
| `CustomizationPermissions`       | const | Permission-key map (`Forms.Read/Manage`, `Workspaces.*`)    |

## Wire format notes

- **Closed delta catalog.** `LayoutDeltaKind` is `'reorder' | 'regroup' |
  'hide'`. The `$type` discriminator and its lowercase values are the wire
  format (`System.Text.Json` polymorphic serialization). Adding a kind requires
  an ADR-053 amendment plus a coordinated backend/front change — new shapes
  never appear "by convention".
- **`ReorderDelta` anchors are exclusive.** Exactly one of `beforeFieldName` or
  `afterFieldName` must be non-null; setting both is a backend 422.
- **`PUT` is a full replace, not a patch.** Send the complete delta list; the
  backend audits the change (ADR-053 §7).
- **Workspace audit fields are nullable.** `updatedAt` / `updatedByUserId` are
  `null` until the first write.

## Out of scope / caveats

- **No React, no hooks, no query keys** — this is a core package. React Query
  wrappers and headless editors live in
  [`@granit/react-entities-customization`](../react-entities-customization).
- **Permission keys are UX hints, not enforcement.** `CustomizationPermissions`
  lets callers gate controls; the `Granit.EntitiesCustomization` backend
  re-checks `Forms.Manage` / `Workspaces.Manage` on every mutation. Never treat
  a client-side check as a security boundary.
- **No delta authoring/validation logic** — semantic validation (duplicate
  reorders, unknown field names, cyclic groups) is owned by the backend; this
  SDK only carries the typed wire shapes.

## License

Apache-2.0
