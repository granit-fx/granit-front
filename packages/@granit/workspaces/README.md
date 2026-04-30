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
  SubWorkspace)
- `LandingRouteResponse` + `LandingRouteSource`
- Typed preset overlay schema + `composeWorkspacePresetOverlay(manifest, overlay)` helper

The React renderer lives in [`@granit/react-workspaces`](../react-workspaces).

## Status

Scaffold only — implementation tracked under
[granit-fx/granit-front#300](https://github.com/granit-fx/granit-front/issues/300).
