# @granit/react-workspaces

React hooks + providers for the Granit **workspaces** module — the workspace
tree, the post-login landing redirect, the Notion-style SidePeek URL state, and
the host-supplied feature-route table. This is the **React hooks layer**: it
wraps the framework-agnostic Axios calls and DTOs from
[`@granit/workspaces`](../workspaces) in TanStack Query hooks plus a few pure,
router-agnostic state hooks. It holds no rendering — sidebars, drawers, and the
landing page live one layer up.

The split is three packages over the same .NET `Granit.Workspaces` backend
(contract: `contracts/openapi/workspaces.json`):

- [`@granit/workspaces`](../workspaces) — framework-agnostic core: DTOs + Axios
  calls (`getWorkspaceTree`, `getLandingRoute`, `setPinnedLandingRoute`) and the
  URL/route helpers (`buildEntityUrl`, `resolveFeatureRoute`, …).
- `@granit/react-workspaces` (this package) — React Query hooks + the
  `FeatureRouteTableProvider`.
- [`@granit/react-ui-workspaces`](../react-ui-workspaces) — admin UI kit: the
  workspace landing page reached from the launcher / workspace switcher.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/workspaces` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useGranitClient`, the context source for the
  Axios client used by the query hooks.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-workspaces/testing`
  subpath.

## Quick start

The query hooks read the Axios client from context — mount a
`<GranitClientProvider>` above them (no provider is required from this package).
Wrap the navigation root in `FeatureRouteTableProvider` once so `Feature` items
can resolve to your SPA paths, then call the hooks anywhere below it.

```tsx
import {
  FeatureRouteTableProvider,
  useWorkspaces,
  useResolvedWorkspaceItem,
} from '@granit/react-workspaces';
import type { FeatureRouteTable, WorkspaceItemResponse } from '@granit/workspaces';

const ROUTES: FeatureRouteTable = {
  'identity.users.list': { path: '/users' },
  'invoicing.invoices.list': { path: '/invoicing' },
  'parties.parties.list': { path: '/crm/parties' },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  return <FeatureRouteTableProvider table={ROUTES}>{children}</FeatureRouteTableProvider>;
}

function WorkspaceItemLink({ item }: { item: WorkspaceItemResponse }) {
  const { href, missingRoute, featureName } = useResolvedWorkspaceItem(item);
  // A Feature whose route is not registered renders as a disabled placeholder.
  if (missingRoute) return <span title={`No route for ${featureName}`}>{item.displayKey}</span>;
  return href ? <a href={href}>{item.displayKey}</a> : <span>{item.displayKey}</span>;
}

function Sidebar() {
  // `includeShells: false` drops Framework shell workspaces (halves the payload).
  const { data: tree, isLoading } = useWorkspaces({ includeShells: false });
  if (isLoading || !tree) return null;
  return tree.workspaces.map((w) => <section key={w.name}>{/* render sections/items */}</section>);
}
```

The landing redirect drives where a user lands after login. It is
router-agnostic — pass your router's imperative navigate:

```tsx
import { useLandingRedirect, useSidePeek } from '@granit/react-workspaces';
import { useNavigate, useLocation } from 'react-router';

function PostLoginLayout() {
  const navigate = useNavigate();
  // Fires `navigate(route)` exactly once after `GET /me/landing-route` resolves.
  useLandingRedirect((path) => navigate(path));
  return null;
}

function PeekHost() {
  const navigate = useNavigate();
  const { search } = useLocation();
  // URL-bound side-peek stack: ?peek=entityName:id[,entityName:id]*
  const { peek, stack, openPeek, closePeek } = useSidePeek({
    search,
    onSearchChange: (next) => navigate({ search: next }),
    onExpand: (fullPath) => navigate(fullPath), // ⌘+⇧+. expands to /entity/{id}
  });
  return peek ? <Drawer depth={stack.length} onClose={closePeek} entry={peek} /> : null;
}
```

## Public API

| Symbol                           | Kind     | Purpose                                                           |
| -------------------------------- | -------- | ----------------------------------------------------------------- |
| `useWorkspaces`                  | hook     | `GET /api/v1/workspaces` — permission-filtered tree (5 min stale) |
| `workspaceTreeQueryKey`          | fn       | Query-key factory; scope by the same `includeShells` flag         |
| `useLandingRoute`                | hook     | `GET /api/v1/me/landing-route` — resolved route + 5-tier source   |
| `useSetLandingPin`               | hook     | `PUT .../landing-route/pinned` — set/clear the personal pin       |
| `landingRouteQueryKey`           | fn       | Query-key factory for the landing-route query                     |
| `useLandingRedirect`             | hook     | One-shot `navigate(route)` after the landing route resolves       |
| `useSidePeek`                    | hook     | URL-bound `?peek=` stack + `Esc`/`⌘+⇧+.` shortcuts (router-free)  |
| `FeatureRouteTableProvider`      | provider | Supplies the host `FeatureRouteTable` to the renderer below it    |
| `useFeatureRouteTable`           | hook     | Read the route table from context (empty table if no provider)    |
| `useResolvedWorkspaceItem`       | hook     | Resolve one item to `{ href, missingRoute, featureName, spec }`   |
| `resolveWorkspaceItem`           | fn       | Pure variant of the above (SSR / tests, no React state)           |
| `ResolvedWorkspaceItem`          | type     | Resolver output: `href`, `missingRoute`, `featureName`, `spec`    |
| `FeatureRouteTableProviderProps` | type     | `{ table, children }`                                             |
| `SidePeekEntry`                  | type     | One peek: `{ entityName, entityId }`                              |
| `UseSidePeekOptions`             | type     | `useSidePeek` input (search, callbacks, shortcut opt-out)         |
| `UseSidePeekReturn`              | type     | `{ peek, stack, openPeek, closePeek, closeAll, expandPeek }`      |
| `UseLandingRedirectOptions`      | type     | `useLandingRedirect` input (`enabled`, `onResolved`)              |
| `UseLandingRedirectReturn`       | type     | `{ isResolving, resolved, hasRedirected }`                        |

`./testing` subpath (requires the optional `msw` peer):
`createWorkspacesHandlers` (stateful MSW handlers — the workspace tree under
`{baseUrl}`, the landing-route resolver under `{apiRoot}/me/landing-route`, with
the pinned route mutated in-memory; default base `/api/v1/workspaces`) plus the
`mockWorkspaceTree` and `mockDefaultLandingRoute` fixtures.

## Feature route table (ADR-057 §5)

`Feature` items carry a logical `routeName` (falling back to `featureName`); the
host's React app owns the mapping to SPA paths. `resolveWorkspaceItem` resolves
each item against the table:

- **`Feature`** — looked up in the table; returns the SPA path or signals
  `missingRoute: true` with `href: null` when the route is not registered (render
  a disabled placeholder rather than navigating).
- **`Link`** — `linkUrl` passes through unchanged (internal SPA route or external
  URL — not deprecated).
- **`Entity` / `Dashboard` / `SubWorkspace`** — out of scope here; `href` is
  `null` because their URL is computed elsewhere (entity URL helpers, dashboard
  routes, sub-workspace recursion).

`useFeatureRouteTable` returns a frozen empty table when no provider is mounted,
so the renderer degrades to placeholders rather than throwing.

## Caveats

- **SidePeek is router-agnostic and stateless.** `useSidePeek` derives the stack
  from the supplied `search` string and round-trips changes through
  `onSearchChange` — it never touches `history` itself. The wire format is
  `?peek=entityName:id[,entityName:id]*`, each segment URL-encoded individually so
  dots in entity names (`Granit.Parties.Party`) and slashes in ids survive.
  Malformed values parse to an empty stack rather than throwing, so a hand-typed
  URL never crashes the renderer. The `⌘+⇧+.` expand shortcut is a no-op unless
  `onExpand` is provided; pass `enableShortcuts: false` to own the keybindings.
- **Landing redirect is one-shot.** `useLandingRedirect` fires `navigate(route)`
  exactly once after the query lands, then stays inert (guarded by a ref). Set
  `enabled: false` on routes the user deep-linked to so the resolver does not
  clobber an explicit destination; the underlying query stays warm.
- **Cache staleness is intentional.** `useWorkspaces` uses a 5-minute
  `staleTime` (the tree is shaped by module DI + permission grants, which do not
  churn mid-session); `useLandingRoute` uses 60 s because the personal-sticky
  tier updates server-side as the user navigates. `useSetLandingPin` invalidates
  the landing-route query on success.
- **Invalidate by the right key.** `workspaceTreeQueryKey(includeShells)` is
  variant-scoped; invalidating the `['workspaces', 'tree']` prefix clears every
  variant, while a fully-qualified key clears only the matching one.

## Out of scope

- **Rendering** — the workspace sidebar, the SidePeek drawer chrome, and the
  landing page live in [`@granit/react-ui-workspaces`](../react-ui-workspaces) and
  consuming apps. This package is headless: it returns state and resolved URLs,
  not JSX.
- **DTOs, HTTP transport, and URL/route helpers** — owned by
  [`@granit/workspaces`](../workspaces) (mirror of `Granit.Workspaces`); the hooks
  here only adapt them to React Query and React context.
- **Navigation** — the host owns its router. `useLandingRedirect`, `useSidePeek`,
  and the resolved `href`s are all driven by an imperative navigate the caller
  supplies.

## License

Apache-2.0
