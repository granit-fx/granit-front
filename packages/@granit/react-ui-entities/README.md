# @granit/react-ui-entities

Manifest-driven entity-rendering **UI** for Granit admin apps — generic
list / detail / form pages plus calendar, kanban and gallery layouts, entity
action overlays (drawer / modal) and child-collection sections. Every screen is
driven entirely by the backend entity manifest, so there is **no per-entity
code**: adding a new entity downstream surfaces the full toolbar, view switcher,
row actions and overlays for free.

This is the **react-ui admin feature kit** layer over the .NET `Granit.Entities`
module (contract: `../../../contracts/openapi/entities.json`). The split is four
packages:

- [`@granit/entities`](../entities) — framework-agnostic core: manifest DTOs,
  descriptors, the visibility-DSL evaluator (mirrors
  `Granit.Entities.Abstractions`).
- [`@granit/react-entities`](../react-entities) — React hooks
  (`useEntityDiscovery` / `useEntityMetadata` / `useEntityCalendar`, the action
  dispatcher, selection) + the headless renderers (`EntityList`, `EntityForm`,
  `EntityDetail`, `EntityGallery`).
- `@granit/react-ui-entities` (this package) — the admin pages, alternative
  views, page-layout shell and action-overlay hosts that compose those hooks and
  renderers into Odoo-style screens.
- [`@granit/react-ui-entities-customization`](../react-ui-entities-customization)
  — the Layer-1 layout-customization + saved-views admin (a sibling feature kit,
  not consumed by this package).

App-agnostic by construction: image rendering, the active workspace name, and
label resolution are injected rather than imported, so the package carries no
storage, workspace or tenancy assumptions.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers (all `workspace:*` unless a version range is given):

- `@granit/react-entities` — manifest hooks, headless renderers and the action
  dispatcher this kit wraps.
- `@granit/entities` — manifest DTOs and layout descriptors (`EntityListLayout*`,
  `EntityKanbanLayout*`, `EntityCalendarLayout*`, …).
- `@granit/react-query-engine` + `@granit/query-engine` — the query-endpoint
  state, metadata, smart-filter and `PagedResult` / `QueryRequest` types behind
  the list / gallery surfaces.
- `@granit/react-ui` and `@granit/react-ui-kit` — the shadcn primitives
  (`Button`, `Sheet`, `Dialog`, `Card`, `Table`, …) and the admin building blocks
  (`QueryDataTable`, `SmartFilterBar`, `SortSelector`, `FilterPresets`,
  `GroupBySelector`).
- `@granit/react-localization` — `useTranslation`, `useDateFormatter`,
  `useTimezone`, `resolveLabel` (timezone-aware, label-key resolution).
- `@granit/react-api-client` — `useGranitClient`, the ambient Axios instance
  (CSRF, auth, tenant interceptors) used for entity GET / POST / PATCH.
- `@granit/react-workspaces` — `useSidePeek`, the URL-driven peek-stack the
  list page and side-peek drawer share.
- `@granit/logger` (`createLogger`) and `@granit/utils` (`cn`).
- `@tanstack/react-query` (`^5`), `@tanstack/react-table` (`^8.21`),
  `react` / `react-dom` (`^19`), `react-router-dom` (`^7.18`),
  `date-fns` (`^4`), `lucide-react` (`^1.21`), `sonner` (`^2`).

## Quick start

Mount the workspace entity routes against `react-router-dom`, inject the image
slot, and mount the global overlay hosts once in the app shell. `renderImage`
keeps the kit storage-agnostic (e.g. `<BlobImage>` from
[`@granit/react-blob-storage`](../react-blob-storage)); `activeWorkspaceName`
comes from the host's workspace context.

```tsx
import {
  WorkspaceEntityPage,
  WorkspaceEntityDetailPage,
  WorkspaceEntityFormPage,
  EntityActionScopeProvider,
  ActionDrawer,
  ActionModal,
  SidePeekDrawer,
} from '@granit/react-ui-entities';
import { Route, Routes } from 'react-router-dom';

// Card / gallery images are injected — the kit never imports a storage layer.
const renderImage = (blobId: string | null) =>
  blobId ? <BlobImage blobId={blobId} /> : null;

function AppShell({ activeWorkspaceName }: { activeWorkspaceName: string | null }) {
  return (
    // The scope provider lets the globally-mounted overlay hosts read the
    // active entity name set by the list page on mount.
    <EntityActionScopeProvider>
      <Routes>
        <Route path="/w/:workspace/:entity" element={<WorkspaceEntityPage renderImage={renderImage} />} />
        <Route path="/w/:workspace/:entity/new" element={<WorkspaceEntityFormPage mode="create" />} />
        <Route path="/w/:workspace/:entity/:id" element={<WorkspaceEntityDetailPage />} />
        <Route path="/w/:workspace/:entity/:id/edit" element={<WorkspaceEntityFormPage mode="edit" />} />
      </Routes>

      {/* Mount the overlay hosts + side peek once, above the routes. */}
      <ActionDrawer />
      <ActionModal />
      <SidePeekDrawer activeWorkspaceName={activeWorkspaceName} />
    </EntityActionScopeProvider>
  );
}
```

`WorkspaceEntityPage` resolves the REST base path from `useEntityDiscovery`, the
title from the manifest's identity facet, and builds the table columns
generically from the query metadata plus manifest field-widget hints. The view
switcher offers whatever `manifest.collections.listLayouts` declares (List /
Kanban / Calendar / Gallery), defaulting to a single tabular List. Compose the
lower-level views directly when you need a layout outside the standard page:

```tsx
import { EntityKanbanView, EntityGalleryView, EntityPageLayout } from '@granit/react-ui-entities';

function CustomBoard({ manifest, layout, rows }: BoardProps) {
  return (
    <EntityPageLayout title="Pipeline" contentWidth="full">
      <EntityKanbanView
        entityName="Granit.Crm.Lead"
        manifest={manifest}
        layout={layout}      // manifest.collections.listLayouts[].kanban
        rows={rows}          // from the parent's useQueryEndpoint (filter-aware)
        canUpdate            // enables drag-and-drop column transitions (PATCH)
        locale="en"
        onCardClick={(id) => openDetail(id)}
      />
    </EntityPageLayout>
  );
}
```

## Public API

| Symbol                            | Kind      | Purpose                                                                  |
| --------------------------------- | --------- | ------------------------------------------------------------------------ |
| `WorkspaceEntityPage`             | component | List page (`/w/:workspace/:entity`) — toolbar, view switcher, layouts    |
| `WorkspaceEntityDetailPage`       | component | Detail route (`/w/:workspace/:entity/:id`) — back shell + detail body    |
| `WorkspaceEntityFormPage`         | component | Create / edit form route (`mode` prop); POST / PATCH to the entity REST  |
| `EntityCalendarView`              | component | Odoo-style day/week/month/year calendar over a date-projected layout     |
| `EntityKanbanView`                | component | Drag-and-drop kanban; column transition PATCHes the group-by property    |
| `EntityGalleryView`               | component | Infinite-scroll card gallery (flat + grouped) with injected images       |
| `EntityViewSwitcher`              | component | Tab strip over `listLayouts`; renders nothing for a single layout        |
| `EntityDetailContent`             | component | Manifest-driven detail body (header, sections, relations, collections)   |
| `CollectionSectionCard`           | component | Child-collection table card (per-column formatter + optional Sum footer) |
| `ActionDrawer`                    | component | Global drawer host for `OpenDrawer` actions (detail body or URL iframe)  |
| `ActionModal`                     | component | Global modal host for `OpenModal` actions (form body or URL iframe)      |
| `EntityActionButton`              | component | shadcn-styled trigger for one `EntityActionManifest` via the dispatcher  |
| `EntityActionScopeProvider`       | provider  | Carries the active entity name to the globally-mounted overlay hosts     |
| `useEntityActionScope`            | hook      | Read `{ entityName, setEntityName }`; throws outside the provider        |
| `EntityPageLayout`                | component | Fixed-slot shell (title / actions / view switcher / controls / body)     |
| `SidePeekDrawer`                  | component | Notion-style side peek over `useSidePeek`; reuses `EntityDetailContent`  |
| `recapParentRefs`                 | fn        | Bulk-recap parent markers → `ParentRef[]` (cache-invalidation targets)   |
| `asExtended`                      | fn        | Cast `EntityManifestResponse` to the forward-looking extension type      |
| `WorkspaceEntityFormPageProps`    | type      | `{ mode: 'create' \| 'edit' }`                                           |
| `EntityCalendarViewProps`         | type      | Calendar view props (`entityName`, `manifest`, `layout`, handlers)       |
| `CalendarViewMode`                | type      | `'day' \| 'week' \| 'month' \| 'year'`                                   |
| `EntityKanbanViewProps`           | type      | Kanban view props (rows, `canUpdate`, locale, handlers)                  |
| `EntityGalleryViewProps`          | type      | Gallery view props (`layout`, `renderImage`, handlers)                   |
| `GalleryRenderImage`              | type      | `(blobId, row) => ReactNode` — the storage-agnostic image slot           |
| `EntityViewSwitcherProps`         | type      | `{ layouts, activeKind, onChange }`                                      |
| `EntityDetailContentProps`        | type      | `{ entityName, entityId, workspace?, onRelationClick? }`                 |
| `EntityActionButtonProps`         | type      | `{ action, entityId, actionHandlers? }`                                  |
| `EntityPageLayoutProps`           | type      | Page-shell slot props                                                    |
| `EntityPageLayoutWidth`           | type      | `'full' \| 'comfortable' \| 'narrow'`                                    |
| `SidePeekDrawerProps`             | type      | `{ activeWorkspaceName? }`                                               |
| `ParentRef`                       | type      | `{ entityName, entityId }` produced by `recapParentRefs`                 |
| `ExtendedEntityManifest`          | type      | `EntityManifestResponse` + `collectionSections` (forward-looking)        |
| `ExtendedIdentitySection`         | type      | Identity facet alias used by the extended manifest                       |
| `EntityCollectionSectionManifest` | type      | Child-collection descriptor (property, columns, currency, footer)        |
| `CollectionColumnManifest`        | type      | One collection column (property, label key, component, align)            |

## App-agnostic seams

- **`renderImage`** — gallery card images are injected (e.g. `<BlobImage>` from
  [`@granit/react-blob-storage`](../react-blob-storage)) so the package stays
  storage-agnostic; the signature matches the framework `<EntityGallery>`'s slot.
- **`activeWorkspaceName`** — `SidePeekDrawer` receives the active workspace from
  the host's workspace context; without it, relation links fall back to opening
  the full detail page instead of a cross-entity peek.
- **Label resolution** — display labels go through `resolveLabel` from
  `@granit/react-localization`; dates / times through `useDateFormatter` /
  `useTimezone` (rendered in the user's preferred timezone, never raw `Intl`).

## Security / caveats

- **URL action overlays are sandboxed.** `ActionDrawer` and `ActionModal` render
  a server-supplied `urlTemplate` inside a `sandbox="allow-forms
  allow-same-origin allow-scripts"` `<iframe>` rather than injecting the response
  as HTML — untrusted markup is never parsed as the host's DOM (XSS avoidance).
  Apps needing richer wiring (postMessage handshake, custom auth headers) replace
  the component via a `dispatch` override on `useEntityActionDispatcher`.
- **Link cells enforce a scheme allowlist.** `CollectionSectionCard` renders
  `email` / `tel` / `url` cells as anchors but rejects any URL whose scheme is
  not `http(s)` (and only allows same-origin relative paths starting with a
  single `/`), blocking `javascript:` / `data:` injection through untrusted
  entity field values (CWE-79). External links get `rel="noreferrer"`.
- **Server is authoritative for permissions and validation.** `canCreate` /
  `canUpdate` from the manifest only gate the UI (hide Create / Edit / drag).
  Every entity GET / POST / PATCH and every action dispatch is re-checked and
  re-validated by the .NET endpoints (FluentValidation); the UI just relays the
  response toast. Client-side gating is a UX hint, not a security boundary.
- **Forward-looking manifest extensions.** `ExtendedEntityManifest` /
  `collectionSections` are additive structural types over the framework
  `EntityManifestResponse` until `Granit.Entities` ships the matching DTOs
  (Phase 1.G). `asExtended` is a structural cast — it performs no validation.
- **Kanban / calendar are pointer-driven.** Drag-and-drop column transitions and
  inline tile actions are mouse-first by design; assistive-tech users drive the
  same state changes through per-card / per-row action buttons.

## Out of scope

- **Manifest fetching, the action dispatcher, selection, and the headless
  renderers** — owned by [`@granit/react-entities`](../react-entities); this kit
  composes them into pages and alternative views.
- **Manifest DTOs and the visibility DSL** — owned by
  [`@granit/entities`](../entities) (mirror of `Granit.Entities`).
- **Layout customization and saved views** — the form-layout editor, field
  inspector and saved-views manager live in
  [`@granit/react-ui-entities-customization`](../react-ui-entities-customization).
- **Image transport / blob URLs** — injected via `renderImage`; resolution and
  auth belong to [`@granit/react-blob-storage`](../react-blob-storage).

## License

Apache-2.0
