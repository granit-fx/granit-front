# @granit/workspaces

Framework-agnostic types and helpers for the Granit **workspace tree** — the
top-level navigation surface that groups entities, dashboards, sub-workspaces,
features, and external links under a single sidebar (a CRM workspace, an
Accounting workspace, an Operations workspace). It is the TypeScript counterpart
of the .NET `Granit.Workspaces` module
(`Granit.Workspaces.Abstractions` + `Granit.Workspaces.Endpoints.Dtos`; contract:
`contracts/openapi/workspaces.json`).

This is the framework-agnostic **core** layer: it exposes the wire DTOs, the
Axios calls for `GET /workspaces` / `GET /me/landing-route` /
`PUT /me/landing-route/pinned`, and pure router-agnostic helpers (URL build/parse,
host feature-route lookup). It holds **no** React, DOM, or Node-only dependency, so
any consumer — React renderer, mobile app, a future Vue port, tests — can read the
payloads with full type safety. The split is three packages over the same backend:

- `@granit/workspaces` (this package) — framework-agnostic core: DTOs, Axios
  functions, URL + feature-route helpers.
- [`@granit/react-workspaces`](../react-workspaces) — React Query hooks + provider.
- [`@granit/react-ui-workspaces`](../react-ui-workspaces) — admin / renderer UI kit.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the single peer:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call, and the `AxiosRequestConfig` type the
  call options spread into.

## Quick start

The Axios calls take an explicit `client` and `basePath` (the module mount root,
e.g. `/api/v1`), so the same functions work regardless of how the host wires
routing. The URL and feature-route helpers are pure and need no client.

```ts
import {
  getWorkspaceTree,
  getLandingRoute,
  setPinnedLandingRoute,
  buildWorkspaceUrl,
  resolveFeatureRoute,
  WORKSPACE_TREE_SCHEMA_VERSION,
} from '@granit/workspaces';
import type { FeatureRouteTable } from '@granit/workspaces';

const basePath = '/api/v1';

// 1. Permission-filtered workspace tree for the current user. Pass
//    `includeShells: false` to omit Framework shell workspaces (smaller
//    payload for Tenant-scope contexts).
const tree = await getWorkspaceTree(client, basePath, { includeShells: false });
if (tree.schemaVersion !== WORKSPACE_TREE_SCHEMA_VERSION) {
  // wire shape may differ from what this build expects — degrade gracefully.
}

// 2. Resolve the landing route via the 5-tier precedence chain, then pin a
//    personal preference (pass `route: null` to clear it).
const landing = await getLandingRoute(client, basePath); // { route, source }
await setPinnedLandingRoute(client, basePath, { route: '/w/Granit.Showcase.CRM' });

// 3. Host owns its URLs: Feature items carry a logical `routeName`, never a
//    URL — look the SPA path up in the host-supplied table at click time.
const routes: FeatureRouteTable = {
  'identity.users.list': { path: '/users' },
  'parties.parties.list': { path: '/crm/parties' },
};

for (const ws of tree.workspaces) {
  for (const section of ws.sections) {
    for (const item of section.items) {
      if (item.kind === 'Feature' && item.routeName) {
        const spec = resolveFeatureRoute(routes, item.routeName); // null ⇒ hide item
        if (spec) navigate(spec.path);
      } else if (item.kind === 'SubWorkspace' && item.subWorkspaceName) {
        navigate(buildWorkspaceUrl(item.subWorkspaceName)); // → /w/{name}
      }
    }
  }
}
```

## Public API

| Symbol                          | Kind  | Purpose                                                            |
|---------------------------------|-------|--------------------------------------------------------------------|
| `getWorkspaceTree`              | fn    | `GET {basePath}/workspaces` — filtered tree (`includeShells?`)     |
| `getLandingRoute`               | fn    | `GET {basePath}/me/landing-route` — resolved route + source tier   |
| `setPinnedLandingRoute`         | fn    | `PUT {basePath}/me/landing-route/pinned` — pin / clear (`null`)    |
| `buildWorkspaceUrl`             | fn    | Build `/w/{workspace}/{...segments}` (each segment URI-encoded)    |
| `buildEntityUrl`                | fn    | Build the workspace-agnostic `/entity/{id}` detail URL             |
| `parseWorkspaceUrl`             | fn    | Parse `/w/{workspace}/...` → `{ workspace, segments }` or `null`   |
| `parseEntityUrl`                | fn    | Parse `/entity/{id}` → `{ id }` or `null` (no match)               |
| `resolveFeatureRoute`           | fn    | Route name → `FeatureRouteSpec` from host table, else `null`       |
| `InvalidFeatureNameError`       | fn    | `Error` thrown when `resolveFeatureRoute` gets an empty name       |
| `WORKSPACE_TREE_SCHEMA_VERSION` | const | Wire schema version this build targets (currently `1`)             |
| `WorkspaceTreeResponse`         | type  | `GET /workspaces` payload (`schemaVersion`, `workspaces[]`)        |
| `WorkspaceResponse`             | type  | One workspace (`name`, `isShell`, ordered `sections[]`)            |
| `WorkspaceSectionResponse`      | type  | One section (`key`, `collapsedByDefault`, ordered `items[]`)       |
| `WorkspaceItemResponse`         | type  | One item — kind-tagged optional fields, narrow on `kind`           |
| `WorkspaceItemKind`             | type  | `Entity \| Dashboard \| Link \| SubWorkspace \| Feature` literals  |
| `LandingRouteResponse`          | type  | `{ route, source }` for `GET /me/landing-route`                    |
| `LandingRouteSource`            | type  | Precedence tier that resolved the route (5 string literals)        |
| `SetPinnedLandingRouteRequest`  | type  | `{ route: string \| null }` body for the pin endpoint              |
| `FeatureRouteSpec`              | type  | One route-table row (`{ path }` — SPA path only)                   |
| `FeatureRouteTable`             | type  | `Readonly<Record<routeName, FeatureRouteSpec>>` host lookup table  |
| `ParsedWorkspaceUrl`            | type  | `{ workspace, segments }` — `parseWorkspaceUrl` result             |
| `ParsedEntityUrl`               | type  | `{ id }` — `parseEntityUrl` result                                 |

`WorkspaceItemResponse` is modeled on the wire as a single shape with optional
fields rather than a discriminated union: `entityName` / `entityViewName` /
`entityPresetOverlay` are set for `Entity`, `dashboardName` for `Dashboard`,
`linkUrl` for `Link`, `subWorkspaceName` for `SubWorkspace`, and
`featureName` / `routeName` for `Feature`. Always narrow on `kind` before reading
the kind-specific fields.

## Feature route table (ADR-057)

Workspace items of kind `Feature` carry a logical `routeName`
(`{module}.{entity-plural}.{view}`), not a URL. The host application ships a
`FeatureRouteTable` mapping each route name to a SPA path; the renderer looks the
path up at click time via `resolveFeatureRoute`. Two consequences worth recalling:

1. The frontend owns its URLs — renaming `/invoicing` → `/billing/invoices` no
   longer requires a backend deployment.
2. Different hosts can map the same feature to different paths.

When a feature is not registered in the host's table, `resolveFeatureRoute`
returns `null` — the renderer should hide the item or render a disabled
placeholder. `resolveFeatureRoute` throws `InvalidFeatureNameError` for an empty
or whitespace route name (a programmer error, never a runtime miss). The backend
never learns about URLs.

## Caveats

- **Untyped preset overlay.** `WorkspaceItemResponse.entityPresetOverlay` carries
  the additive preset (filters / sort / columns) layered on the entity's compiled
  defaults. Its wire shape is currently an opaque
  `Readonly<Record<string, unknown>> | null` — a typed schema is pending on the
  .NET side (cross-repo correction filed against `granit-fx/granit-dotnet#1554`).
  Treat it as untrusted JSON until the typed contract lands.
- **Schema version is a guard, not a migration.** A `Feature` kind plus the
  `featureName` / `routeName` fields (ADR-057) is an additive change — new fields
  are nullable, the new kind is a string literal older renderers can detect and
  skip — so `WORKSPACE_TREE_SCHEMA_VERSION` did **not** bump on it. Compare
  `tree.schemaVersion` to assert the build matches; only a breaking shape change
  bumps the const.
- **Router-agnostic by design.** `buildWorkspaceUrl` / `parseWorkspaceUrl` produce
  and parse the canonical `/w/{workspace}` and `/entity/{id}` shapes but take no
  router dependency; the app wires them into React Router (or any router) itself.
  Segment semantics after the workspace name are deliberately left to the app.

## Out of scope

- **Rendering** — sidebar, sections, item chrome, and the landing-route admin
  surface live in [`@granit/react-ui-workspaces`](../react-ui-workspaces). This
  package is headless.
- **React Query** — query-key factories, hooks, and the provider live in
  [`@granit/react-workspaces`](../react-workspaces); the Axios functions here are
  framework-agnostic.
- **Permission filtering** — the tree is already filtered server-side by
  `Granit.Workspaces`; this package neither computes nor re-checks visibility.

## License

Apache-2.0
