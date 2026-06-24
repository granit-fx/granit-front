# @granit/react-entities

React hooks, providers and **headless renderers** driven by the Granit entity
manifest — the React layer over the framework-agnostic
[`@granit/entities`](../entities) core. It wraps the manifest DTOs and Axios
helpers in TanStack Query hooks (`useEntityDiscovery`, `useEntityMetadata`,
`useEntityCalendar`, `useEntityRelationAggregates`) and ships generic,
intentionally **unstyled** renderers — `EntityList`, `EntityDetail`,
`EntityForm`, `EntityKanban`, `EntityCalendar`, `EntityGallery` — plus the
action-dispatch, overlay-host and row-selection primitives they share. You
declare the entity once on the .NET side; this package paints it from the wire
manifest with no per-entity React code.

The split is layered over the same .NET `Granit.Entities` backend (contract:
`contracts/openapi/entities.json`):

- [`@granit/entities`](../entities) — framework-agnostic core: manifest DTOs,
  the two HTTP helpers (`executeBulkAction`), and the pure `visibleIf`
  evaluator (`evaluateVisibility`).
- `@granit/react-entities` (this package) — React Query hooks, the
  `EntityRendererProvider` catalog/i18n bridge, and the headless renderer set
  with the standard unstyled component catalog.
- [`@granit/react-ui-entities`](../react-ui-entities) — the styled admin UI kit
  (shadcn-flavoured layouts, blob-image and workspace seams) built on top of
  these renderers.

Adjacent siblings cover saved views ([`@granit/entities-views`](../entities-views),
[`@granit/react-entities-views`](../react-entities-views)) and Layer-1 overrides
([`@granit/entities-customization`](../entities-customization),
[`@granit/react-entities-customization`](../react-entities-customization)).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/entities` — manifest DTOs, `executeBulkAction`, `evaluateVisibility`.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) for every entity call.
- `@granit/react-api-client` — `useGranitClient`, the ambient Axios client the
  hooks and dispatcher read.
- `@granit/query-engine` / `@granit/react-query-engine` — `EntityList` /
  `EntityKanban` / `EntityGallery` / `EntityCalendar` bridge to the host's
  ambient `<QueryProvider>` (`useQueryEndpoint`, `useQueryMeta`, `FilterEntry`,
  `ColumnDefinition`).
- `@granit/react-data-lookup` — `LookupSelect`, backing the standard `lookup`
  form component (server typeahead, cascading scope).
- `@granit/logger` — `createLogger`; the renderer logger redacts action
  payloads (a `console` shim is used only when no logger is wired).
- `@granit/utils` — `assertSafeUrl` / `isSafeUrl` URL-scheme guards.
- `@tanstack/react-query` (`^5`), `react` (`^19`), `react-hook-form` (`^7`,
  used by `useEntityForm`), and `react-i18next` (`^17`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-entities/testing`
  subpath.

`@granit/react-entities/styles.css` carries the renderers' minimal default
styling (selectable separately from the component logic).

## Quick start

Mount `<EntityRendererProvider>` once with a component catalog (the standard
unstyled set, or your own shadcn/Tailwind components), then drive any renderer
off the manifest fetched by `useEntityMetadata`. Wrap list-shaped renderers in
the host's `<QueryProvider>` for the entity's list endpoint.

```tsx
import {
  EntityRendererProvider,
  EntityList,
  EntityForm,
  useEntityMetadata,
  useEntityForm,
  STANDARD_FORM_COMPONENTS,
} from '@granit/react-entities';

function App({ children }: { children: React.ReactNode }) {
  // `resolveLabel` bridges manifest i18n keys to react-i18next (or any
  // resolver); the catalog maps `field.component` ids to React components.
  return (
    <EntityRendererProvider components={STANDARD_FORM_COMPONENTS}>
      {children}
    </EntityRendererProvider>
  );
}

function PartyForm() {
  const { data: manifest } = useEntityMetadata('Granit.Parties.Party', {
    facets: ['forms'], // slim the payload — server omits unrequested facets
  });
  const variant = manifest?.forms?.[0];
  // useEntityForm derives empty-state defaults from each field's CLR type.
  const { formProps, handleSubmit, isDirty } = useEntityForm(variant!);

  if (!variant) return null;
  return (
    <form onSubmit={handleSubmit((values) => save(values))}>
      <EntityForm variant={variant} {...formProps} />
      <button type="submit" disabled={!isDirty}>Save</button>
    </form>
  );
}
```

`useEntityMetadata` is wired for HTTP 304: it stashes the server's strong ETag
alongside the manifest, replays it as `If-None-Match`, and recovers the cached
payload on a 304. `useEntityDiscovery` (`GET /api/v1/entities`) returns the
permission-filtered entity tree with a long `staleTime` since the catalogue
only churns on deploys or grants.

Action surfaces wire through the dispatcher and the optional overlay hosts:

```tsx
import {
  EntityListPageHeader,
  EntitySelectionBar,
  SelectionProvider,
  EntityActionModalHost,
  useEntityActionDispatcher,
} from '@granit/react-entities';
import { useNavigate } from 'react-router';

function PartyListScreen({ manifest }: { manifest: EntityManifestResponse }) {
  const navigate = useNavigate();
  // Override only the kinds you care about; ApiCall/Download have defaults.
  // The default `navigate` does a full page load — override for SPA routing.
  const handlers = {
    navigate: (action) => navigate(action.urlTemplate ?? '/'),
  };
  return (
    <SelectionProvider>
      <EntityActionModalHost>
        <EntityListPageHeader manifest={manifest} handlers={handlers} />
        <EntityList manifest={manifest} onRowClick={(row) => navigate(`./${row.id}`)} />
        <EntitySelectionBar
          manifest={manifest}
          onComplete={(_action, recap) =>
            toast(`${recap.succeeded.length} done, ${recap.failed.length} failed`)
          }
        />
      </EntityActionModalHost>
    </SelectionProvider>
  );
}
```

## Public API

| Symbol                                        | Kind      | Purpose                                                           |
| --------------------------------------------- | --------- | ----------------------------------------------------------------- |
| `EntityRendererProvider`                      | provider  | Carries the component catalog, i18n `resolveLabel` and logger     |
| `useEntityRenderer`                           | hook      | Read the renderer context; throws outside a provider              |
| `EMPTY_COMPONENT_CATALOG`                     | const     | Frozen empty catalog (default / tests)                            |
| `useEntityDiscovery`                          | hook      | `GET .../entities` — permission-filtered entity tree by module    |
| `useEntityMetadata`                           | hook      | `GET .../entities/{name}` — per-entity manifest, ETag/304-aware   |
| `useEntityCalendar`                           | hook      | `GET .../{name}/calendar` — items overlapping a time window       |
| `useEntityRelationAggregates`                 | hook      | `POST .../{name}/{id}/relations/aggregates` — batched counts/sums |
| `useInvalidateEntityRelationAggregates`       | hook      | Invalidate one aggregate query per distinct parent marker         |
| `parseRelationAggregateParentMarker`          | fn        | Parse a `"{Entity}:{Id}"` marker (`null` when malformed)          |
| `useEntityForm`                               | hook      | Bind `<EntityForm>` to RHF with type-derived empty defaults       |
| `entity*QueryKey`                             | fn        | Query-key factories (discovery/manifest/calendar/relations)       |
| `EntityList`                                  | component | Table renderer bridging `collections.query` to the query engine   |
| `EntityKanban`                                | component | Read-only board grouped client-side by a categorical property     |
| `EntityForm`                                  | component | Controlled form renderer — sections/fields/`visibleIf`/widgets    |
| `EntityDetail`                                | component | Read-mode sections + side panels + relation display slots         |
| `EntityCalendar`                              | component | Time-axis renderer over `useEntityCalendar` items                 |
| `EntityGallery`                               | component | Infinite-scroll card grid with an app-supplied image slot         |
| `EntityListPageHeader`                        | component | Entity-scope (header) action bar above the layout tabs            |
| `EntityActionButton`                          | component | One action as an accessible `data-*`-attributed icon-button       |
| `resolveAction`                               | fn        | Resolve a compact action ref to its full `manifest.actions` entry |
| `useEntityActionDispatcher`                   | hook      | Dispatch by `action.kind` (ApiCall/Download/Navigate/Open*/…)     |
| `resolveActionUrl`                            | fn        | Substitute `{id}` into a URL template (throws on header-misuse)   |
| `EntityActionDrawerHost`                      | component | Overlay context host for `OpenDrawer` actions                     |
| `EntityActionModalHost`                       | component | Overlay context host for `OpenModal` actions                      |
| `useEntityActionDrawer`                       | hook      | Read the active drawer overlay state inside the host's UI         |
| `useEntityActionModal`                        | hook      | Read the active modal overlay state inside the host's UI          |
| `EntityActionDrawerContext`                   | const     | The drawer overlay context (advanced host wiring)                 |
| `EntityActionModalContext`                    | const     | The modal overlay context (advanced host wiring)                  |
| `SelectionProvider`                           | provider  | Per-list row-selection state (toggle / replace / clear)           |
| `useSelection`                                | hook      | Read selection state; no-op default outside the provider          |
| `SelectionContext`                            | const     | The row-selection context                                         |
| `EntitySelectionBar`                          | component | Bulk-action bar (per-row fan-out or batched bulk endpoint)        |
| `fanOutWithCap`                               | fn        | Concurrency-capped fan-out helper used by the selection bar       |
| `SELECTION_FANOUT_CONCURRENCY_CAP`            | const     | Per-row fan-out concurrency cap (`10`)                            |
| `STANDARD_FORM_COMPONENTS`                    | const     | The standard unstyled form-component catalog                      |
| `STANDARD_DETAIL_COMPONENTS`                  | const     | The standard unstyled read-mode component catalog                 |
| `LookupFormComponent`                         | component | `lookup` widget over `@granit/react-data-lookup`'s `LookupSelect` |
| `defaultDetailFormat`                         | fn        | Fallback formatter for unregistered detail components             |
| `executeBulkAction`                           | fn        | Re-export of the `@granit/entities` bulk helper                   |
| `entitiesTranslationsEn` / `…Fr`              | const     | i18next bundles (namespace `entities`)                            |
| `Entity*Props` / `Use*Options` / `…Return`    | type      | Component props and hook option/return shapes                     |
| `EntityComponentCatalog` / `Entity*Component` | type      | Catalog and renderer slot signatures                              |

`./testing` subpath (requires the optional `msw` peer): `createEntitiesHandlers`
(stateful MSW handlers, base `ENTITIES_BASE_PATH`) plus `SAMPLE_MANIFEST_ETAG`,
`SAMPLE_ENTITY_ID` / `SAMPLE_ENTITY_NAME`, and the `mockEntityDiscovery`,
`mockEntityManifest`, `mockCalendarItems`, `mockRelationAggregates`,
`mockBulkActionResponse` fixtures.

## Security and caveats

- **Server-stored URLs are untrusted.** `Navigate` / `Download` action
  templates and the `url` detail formatter flow through `assertSafeUrl` /
  `isSafeUrl` (from `@granit/utils`) before any `location.href` assignment or
  `<a href>` render — `javascript:` / `data:` / protocol-relative schemes are
  rejected, since `urlTemplate` and persisted field values can carry
  attacker-controlled schemes. Custom catalog components must apply the same
  guard.
- **Wire a redacting logger.** `EntityRendererProvider` falls back to a
  `console`-backed shim when no `logger` is supplied; production apps must pass
  a `createLogger` instance so failed-action diagnostics don't leak payloads
  into the browser console.
- **Client-side form validation is a UX hint.** `useEntityForm` defaults to RHF
  `mode: 'onSubmit'` and synthesises no rules from the manifest — the .NET
  endpoints run FluentValidation on every write, which is the authoritative
  gate.
- **Relation-aggregate invalidation is fan-in.** `useInvalidateEntityRelation`
  `Aggregates` dedups parent markers so a 100-row bulk touching 5 parents fires
  5 invalidations, not 100; the framework ships no child→parent topology
  resolver (the wire manifest doesn't expose the FK predicate), so per-row
  callers pass the parent refs they computed.
- **Headless by design.** Renderers emit minimal markup with `data-granit-*`
  attributes and ship only the unstyled standard catalog. Drag-and-drop kanban
  transitions, full list filter/sort/saved-views UI, and the master
  "all-matching-filter" selection mode are reserved for follow-up stories
  (the `mode` field is exposed on the selection shape today so host checkboxes
  can branch ahead of the bump).

## Out of scope

- **Styled admin layouts** — shadcn-flavoured list/detail/form chrome, the
  blob-image gallery slot, and the workspace-aware side-peek live in
  [`@granit/react-ui-entities`](../react-ui-entities).
- **Manifest DTOs and HTTP transport** — owned by
  [`@granit/entities`](../entities) (mirror of `Granit.Entities`); hooks here
  only adapt them to React Query.
- **Workflow execution** — the dispatcher's `WorkflowTransition` kind no-ops by
  default (the framework doesn't depend on `@granit/react-workflow`); apps wire
  the `workflowTransition` handler.

## License

Apache-2.0
</content>
</invoke>
