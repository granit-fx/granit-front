# @granit/workspaces

Framework-agnostic types and helpers for the Granit workspace tree.

## Why

Workspaces are the top-level navigation surface: a CRM workspace, an
Accounting workspace, an Operations workspace. Each one groups entities,
dashboards, sub-workspaces, and external links under a single sidebar. The
.NET side (`Granit.Workspaces`) computes the user-filtered tree at
`GET /api/workspaces` and resolves the landing route at
`GET /api/me/landing-route`.

This package owns the JavaScript-side contracts for both endpoints — plus
the typed schema for the preset overlay that lets the same entity show up
in two workspaces with different defaults (e.g. Party in CRM = full list,
Party in Accounting = overdue-balance preset).

## What's in here

- `WorkspaceTreeResponse` + `WorkspaceResponse` / `WorkspaceSectionResponse`
  / `WorkspaceItemResponse` types
- `WorkspaceItemKind` discriminated union (Entity / Dashboard / Link /
  SubWorkspace / Feature)
- `LandingRouteResponse` + `LandingRouteSource`
- Typed preset overlay schema + `composeWorkspacePresetOverlay(manifest, overlay)` helper
- `FeatureRouteTable` + `resolveFeatureRoute(table, name)` — host-side
  route name → SPA path lookup (ADR-057 §5)

## Feature route table (ADR-057)

Workspace items of kind `Feature` carry a logical `routeName`
(`{module}.{entity-plural}.{view}`), not a URL. The host application
ships a `FeatureRouteTable` mapping each route name to a SPA path; the
React renderer (or any other consumer) looks the path up at click time.

```ts
import type { FeatureRouteTable } from '@granit/workspaces';

export const ROUTES: FeatureRouteTable = {
  'identity.users.list': { path: '/users' },
  'invoicing.invoices.list': { path: '/invoicing' },
  'parties.parties.list': { path: '/crm/parties' },
};
```

When a feature is not registered in the host's table,
`resolveFeatureRoute` returns `null` — the renderer should hide the item
or display a disabled placeholder. The backend never learns about URLs.

The React renderer lives in [`@granit/react-workspaces`](../react-workspaces).

## Status

Scaffold only — implementation tracked under
[granit-fx/granit-front#300](https://github.com/granit-fx/granit-front/issues/300).
