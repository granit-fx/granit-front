# @granit/entities

Framework-agnostic types and helpers for the **Granit entity manifest** — the
TypeScript counterpart of the .NET `Granit.Entities` module
(`Granit.Entities.Abstractions` + `Granit.Entities.Endpoints.Dtos`), backed by
the `contracts/openapi/entities.json` contract.

The .NET backbone publishes a per-entity manifest describing forms, details,
list layouts, relations, side panels and actions. Any client that wants to
render those entities — the React renderer, a mobile app, a future Vue port —
needs one source of truth for that wire shape. This package owns it on the
JavaScript side: the DTOs, two thin HTTP helpers, and a pure visibility-DSL
evaluator. It holds **no** React, DOM or Node-only dependency. The hooks +
providers layer lives in [`@granit/react-entities`](../react-entities); the
admin feature kit (generic list / detail / form / kanban / calendar / gallery
renderers) lives in [`@granit/react-ui-entities`](../react-ui-entities). Sibling
core packages cover adjacent concerns:
[`@granit/entities-views`](../entities-views) (saved `EntityView` aggregate)
and [`@granit/entities-customization`](../entities-customization) (Layer 1
form / workspace overrides).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not a
registry install. Declare these peers:

- `@granit/api-client` — the centralized Axios client passed to
  `executeBulkAction` (carries the CSRF, auth and tenant interceptors).
- `@granit/data-lookup` — supplies `LookupDescriptor`, referenced by
  `EntityFormFieldManifest.lookup`.

## Quick start

```ts
import {
  executeBulkAction,
  evaluateVisibility,
  ALL_ENTITY_FACETS,
  type EntityManifestResponse,
  type EntityFormFieldManifest,
} from '@granit/entities';
import type { AxiosInstance } from '@granit/api-client';

// 1. Read a per-entity manifest. The endpoint is owned by the React hooks
//    layer; here the parsed payload is typed against the wire contract.
declare const manifest: EntityManifestResponse;

// 2. Decide whether a form field shows, given the current form values.
//    `evaluateVisibility` is pure — no I/O, no logging.
function isFieldVisible(
  field: EntityFormFieldManifest,
  values: Readonly<Record<string, unknown>>
): boolean {
  return field.visibleIf === null || evaluateVisibility(field.visibleIf, values);
}

// 3. Fan one action across many ids in a single round-trip.
async function archiveMany(client: AxiosInstance, ids: readonly string[]) {
  const result = await executeBulkAction(client, 'Granit.Parties.Party', 'archive', {
    ids,
    payload: { reason: 'Quarterly cleanup' },
  });
  // Per-id failures are captured without short-circuiting the batch.
  return { affected: result.affected, failures: result.failures };
}

// `ALL_ENTITY_FACETS` is the explicit list for callers that want to request
// every facet of the manifest rather than relying on the default.
void ALL_ENTITY_FACETS;
```

## Public API

| Symbol                              | Kind  | Purpose                                                             |
| ----------------------------------- | ----- | ------------------------------------------------------------------- |
| `evaluateVisibility`                | fn    | Pure evaluator for one `VisibilityCondition` against form values    |
| `executeBulkAction`                 | fn    | `POST /api/v1/entities/{name}/bulk/{action}` — fan-out across ids   |
| `ALL_ENTITY_FACETS`                 | const | Explicit list of every `EntityFacet`                                |
| `MANIFEST_SCHEMA_VERSION`           | const | Schema version this package was compiled against (`1`)              |
| `EntityDiscoveryResponse`           | type  | `GET /api/entities` payload — module groups of readable entities    |
| `EntityModuleGroup`                 | type  | One module bucket in the discovery tree                             |
| `EntityDiscoveryItem`               | type  | One entity entry (name, display key, icon, permission group)        |
| `EntityDiscoveryLinks`              | type  | Hypermedia links (`manifest`, `list`) on a discovery entry          |
| `EntityManifestResponse`            | type  | `GET /api/entities/{name}` payload — every facet, nullable          |
| `EntityFacet`                       | type  | One selectable manifest facet (`identity`, `forms`, …)              |
| `EntityIdentitySection`             | type  | Identity facet — name, display key, icon, display property          |
| `EntityPermissionsSection`          | type  | Boolean snapshot of `can{Read,Create,Update,Delete,Manage,Execute}` |
| `EntityFormManifest`                | type  | One form variant — sections, customizable flag, override hides      |
| `EntityFormSectionManifest`         | type  | One form section — fields plus optional owned collection            |
| `EntityFormFieldManifest`           | type  | One field — component, config, `visibleIf`, `lookup`, provenance    |
| `EntityDetailManifest`              | type  | One detail variant — sections + side panels                         |
| `EntityDetailSectionManifest`       | type  | One detail section (own fields or inherited form variant)           |
| `EntityDetailSidePanelManifest`     | type  | One right-rail side panel reference                                 |
| `SidePanelKind`                     | type  | `Audit \| Timeline \| Comments \| Documents \| Activities`          |
| `EntityCollectionsSection`          | type  | Collections facet — query/export/metrics/dashboards/layouts/actions |
| `EntityCollectionReference`         | type  | Key + CLR type of an external query/export/metric/dashboard         |
| `EntityHeaderActionManifest`        | type  | Compact action pinned on the list-page header                       |
| `EntitySelectionActionManifest`     | type  | Compact action pinned on the selection bar (bulk surface)           |
| `EntityListLayoutManifest`          | type  | One alternative list layout (kanban / calendar / gallery)           |
| `EntityListLayoutKind`              | type  | `List \| Kanban \| Calendar \| Gallery`                             |
| `EntityKanbanLayoutManifest`        | type  | Kanban config — group-by, card schema, columns                      |
| `EntityKanbanCardManifest`          | type  | Kanban tile schema — title, fields, relations, actions              |
| `EntityKanbanColumnManifest`        | type  | One per-value kanban column (value, colour, default state)          |
| `EntityKanbanCardRelationManifest`  | type  | Compact relation pinned on a kanban tile                            |
| `EntityKanbanCardActionManifest`    | type  | Compact action pinned on a kanban tile                              |
| `KanbanColor`                       | type  | Closed colour catalog mapped to design tokens                       |
| `KanbanColumnState`                 | type  | `Open \| Collapsed \| Hidden`                                       |
| `EntityCalendarLayoutManifest`      | type  | Calendar config — start/end/title/colour property names             |
| `EntityCalendarTileActionManifest`  | type  | Compact action pinned on a calendar tile                            |
| `CalendarRangeRequest`              | type  | Query params for `GET /api/entities/{name}/calendar`                |
| `CalendarItemResponse`              | type  | One event positioned on the calendar time axis                      |
| `EntityGalleryLayoutManifest`       | type  | Gallery config — image/title/subtitle property names, card size     |
| `EntityGalleryCardActionManifest`   | type  | Compact action pinned on a gallery card                             |
| `GalleryCardSize`                   | type  | `Small \| Medium \| Large`                                          |
| `EntityRelationManifest`            | type  | One relation — cardinality, display mode, target, aggregates        |
| `EntityRelationAggregateManifest`   | type  | One aggregate declared on a relation                                |
| `RelationCardinality`               | type  | `Many \| One`                                                       |
| `RelationDisplay`                   | type  | `Tab \| SmartButton \| Sidebar \| InlineChips`                      |
| `RelationAggregateKind`             | type  | `Count \| Sum \| Avg \| Min \| Max`                                 |
| `RelationAggregateValue`            | type  | Computed aggregate values for one relation                          |
| `RelationAggregatesRequest`         | type  | Body for the relation-aggregates endpoint                           |
| `RelationAggregatesResponse`        | type  | Aggregate values keyed by relation name                             |
| `EntityActionManifest`              | type  | Full descriptor for one entity action                               |
| `EntityActionKind`                  | type  | `ApiCall \| Download \| Navigate \| WorkflowTransition \| Open*`    |
| `VisibilityCondition`               | type  | One `visibleIf` rule from the manifest                              |
| `FieldOp`                           | type  | Closed visibility operator set (`Eq`, `In`, `IsNull`, …)            |
| `BulkActionRequest`                 | type  | `{ ids, payload }` body for the bulk endpoint                       |
| `BulkActionResponse`                | type  | `{ affected, failures }` recap                                      |
| `BulkActionFailure`                 | type  | One captured per-id failure (`id`, `reason`)                        |

Three nested types are re-exported from `./types` but not from the package root
today, so they are not importable from `@granit/entities` directly — reach them
through their parent type:

- `EntityFormOwnedCollectionManifest` — inline owned-collection rendered within a
  form section (`EntityFormSectionManifest.ownedCollection`).
- `EntityProvenance` — manifest layer + override id that introduced a field
  (`EntityFormFieldManifest.provenance`).
- `EntityActivitiesManifest` — allowed activity types + default assignee rule
  (`EntityManifestResponse.activities`).

## Wire conventions

DTOs mirror the .NET source through `System.Text.Json` defaults: camelCase
property names, PascalCase string-literal enums (a `JsonStringEnumConverter`
without naming policy), `IReadOnlyList<T>` → `readonly T[]`, and
`IReadOnlyDictionary<string, T>` → `Readonly<Record<string, T>>`. The TypeScript
`?` axis tracks the OpenAPI `required` array, not nullability: a
nullable-but-required field is modelled as `T | null`, not `field?: T`.

`EntityManifestResponse` reports its `schemaVersion`; compare it against the
exported `MANIFEST_SCHEMA_VERSION` to fail fast when the backend has been bumped
past the renderer. The same value rides the `Granit-Entities-Schema-Version`
response header.

## Caveats

- **`evaluateVisibility` is intentionally strict.** Equality uses `===` (JSON
  literals only — no deep equality on objects/arrays), and a malformed condition
  throws (e.g. `In` with a non-array value) rather than silently hiding the
  field. Richer logic belongs server-side via a permission or domain rule, not
  the manifest layer.
- **Client-side gating is a UX hint, not enforcement.** `EntityPermissionsSection`
  and the per-field `visibleIf` rules let the renderer hide affordances the user
  cannot use; the .NET backend still re-checks authorization on every individual
  call (defense in depth). Entities and relations the caller cannot read are
  omitted from discovery and aggregate responses entirely, not merely flagged.
- **This package does no fetching for the manifest endpoints.** Only
  `executeBulkAction` issues a request (it needs the Axios client for the action
  fan-out). Discovery and manifest reads are owned by the
  [`@granit/react-entities`](../react-entities) hooks; this layer types the
  payloads they parse.

## License

Apache-2.0
