# @granit/entities-views

Framework-agnostic types and helpers for Granit saved views.

## Why

Saved views are how users carve a list down to "their slice": their open
deals, their team's overdue invoices, the tenant-wide default kanban for
support tickets. The .NET side promotes them to a first-class aggregate
(`Granit.Entities.Views`) with a delta model — a view stacks on top of a
base view and stores only what differs, so renaming a column on the base
view doesn't fork every personal copy.

This package owns the JavaScript-side contracts for that aggregate, plus
the pure helpers that compose / diff / reset the delta. It deliberately
sits in a separate package from `@granit/entities` so a renderer can
consume the manifest without dragging the views CRUD surface in.

## What's in here

- `EntityView` + `EntityViewSummary` types
- `EntityViewVisibility` (Personal / Shared / Tenant)
- View flags: `isPinned`, `isDefault`, `isPersonalDefault`
- `basedOn` delta (`baseViewName` + `state` patch)
- View-state delta helpers: `composeViewState`, `diffViewState`, `resetViewState`

The React hooks + tab strip live in [`@granit/react-entities-views`](../react-entities-views).

## Status

Scaffold only — implementation tracked under
[granit-fx/granit-front#301](https://github.com/granit-fx/granit-front/issues/301).
