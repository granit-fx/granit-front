# @granit/react-entities

React hooks + generic renderers for the Granit entity manifest.

## Why

Most of an admin app is the same six screens repeated across thirty
different aggregates: a list, a kanban, a form, a detail view, a relation
drawer, a side peek. Hand-rolling those screens per entity is busywork that
also makes cross-cutting changes (a new widget, a permission rule, a layout
tweak) impossible to roll out at once.

This package consumes the manifest produced by `Granit.Entities.Endpoints`
(see [`@granit/entities`](../entities)) and gives you back four ready-to-use
renderers. You declare the entity once, on the .NET side; you get the React
UI for free.

## What's in here

- Hooks
  - `useEntityDiscovery()` — calls `GET /api/entities`, ETag-aware
  - `useEntityMetadata(name, { facets? })` — calls `GET /api/entities/{name}`
- Generic renderers
  - `<EntityList />` — bridges to `@granit/query-engine`
  - `<EntityKanban />` — board grouped by enum
  - `<EntityForm />` — sections / fields / widgets / `VisibleIf`
  - `<EntityDetail />` — sections + side panels + smart-button slots
- `<EntityRendererProvider>` — carries the widget catalog and i18n bridge
- Standard widget catalog + `custom:` extension hook

## Status

Scaffold only. Implementation lands across:

- [granit-fx/granit-front#298](https://github.com/granit-fx/granit-front/issues/298) — hooks
- [granit-fx/granit-front#299](https://github.com/granit-fx/granit-front/issues/299) — renderers
- [granit-fx/granit-front#302](https://github.com/granit-fx/granit-front/issues/302) — smart-button consumption
