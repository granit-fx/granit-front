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
- `<FeatureRouteTableProvider />` + `useResolvedWorkspaceItem()` —
  host-supplied route table for `Feature` items (ADR-057 §5)

## Feature route table (ADR-057)

Items of kind `Feature` carry a logical `routeName`; the host's React
app owns the mapping to SPA paths. Wrap the nav root once at startup:

```tsx
import { FeatureRouteTableProvider, useResolvedWorkspaceItem } from '@granit/react-workspaces';
import type { FeatureRouteTable } from '@granit/workspaces';

const ROUTES: FeatureRouteTable = {
  'identity.users.list': { path: '/users' },
  'invoicing.invoices.list': { path: '/invoicing' },
  'parties.parties.list': { path: '/crm/parties' },
};

export function AppShell({ children }: { children: ReactNode }) {
  return <FeatureRouteTableProvider table={ROUTES}>{children}</FeatureRouteTableProvider>;
}

function WorkspaceItemLink({ item }: { item: WorkspaceItemResponse }) {
  const { href, missingRoute, featureName } = useResolvedWorkspaceItem(item);
  if (missingRoute) {
    return <span title={`Route not registered for feature ${featureName}`}>{item.displayKey}</span>;
  }
  return href ? <a href={href}>{item.displayKey}</a> : null;
}
```

When a feature is missing from the host table, the hook returns
`missingRoute: true` and `href: null` — render a disabled placeholder
rather than navigating. `linkUrl` on `Link` items is unaffected and
remains valid for internal SPA routes and external URLs.

## Status

Scaffold only — implementation tracked under
[granit-fx/granit-front#300](https://github.com/granit-fx/granit-front/issues/300).
