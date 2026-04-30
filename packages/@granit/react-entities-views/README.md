# @granit/react-entities-views

React hooks + view tab strip for Granit saved views.

## Why

The view tab strip is the daily driver of any list-heavy admin: pin three
views you live in, accept the team's tenant default, save your in-progress
filter as a new personal view, then "Save for everyone" once you're sure.
This package bundles the hooks and the strip itself so apps don't reinvent
the dirty-state UX every time.

It also owns the clean-break replacement for the legacy `useSavedViews`
hook from `@granit/react-query-engine`, which goes away in the same PR
sequence (see [granit-fx/granit-front#301](https://github.com/granit-fx/granit-front/issues/301)).

## What's in here

- Hooks against `/api/entities/{name}/views`
  - `useEntityViews(entityName)`, `useEntityView(entityName, id)`
  - `useCreateEntityView`, `useUpdateEntityView`, `useDeleteEntityView`
  - `usePinEntityView`, `useStarEntityView`, `useShareEntityView`,
    `useSetDefaultEntityView`
- `<EntityViewTabStrip />` — pinned + personal-default + recent, dirty
  badge, save-as-new / update / reset, Notion-style "Save for everyone"
  promotion (Personal → Shared / Tenant)
- Integration helpers for `<EntityList />` (active-view binding)

## Status

Scaffold only — implementation tracked under
[granit-fx/granit-front#301](https://github.com/granit-fx/granit-front/issues/301).
