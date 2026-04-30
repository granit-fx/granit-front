# @granit/react-workspaces

React shell components for the Granit workspace tree.

## Why

A workspace is more than a sidebar entry: it's the entry point a user lands
on after login, the URL prefix that scopes their lists, and the context that
decides which preset overlay applies to a shared entity. Wiring all that
plumbing app-by-app produces drift; centralising it here means every
consuming app inherits the same routing rules, the same side-peek shortcuts,
and the same landing-redirect behaviour.

This package is the React layer on top of [`@granit/workspaces`](../workspaces).

## What's in here

- Hooks: `useWorkspaces`, `useWorkspace`, `useLandingRoute`, `useSetLandingPin`
- `<WorkspaceNav />` — recursive sidebar (≤ 4 levels), icons, breadcrumbs
- Route helpers
  - `/w/{workspace}/...` workspace-scoped lists
  - `/entity/{id}` workspace-agnostic detail
- `<SidePeek />` — Notion-style drawer (`?peek=…`, `Esc` to close,
  `⌘+⇧+.` to expand to full page, stacked peeks)
- `<LandingRedirect />` — calls `useLandingRoute()` on login, honours the
  5-tier precedence and URL whitelist

## Status

Scaffold only — implementation tracked under
[granit-fx/granit-front#300](https://github.com/granit-fx/granit-front/issues/300).
