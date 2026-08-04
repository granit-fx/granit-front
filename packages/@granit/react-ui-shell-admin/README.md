# @granit/react-ui-shell-admin

The Granit **admin app shell** (chrome): the back-office frame shared by every
Granit admin application — a collapsible sidebar + topbar + scrollable content +
right rail, plus the workspace switcher, command palette, and user-menu sub-menus
that live inside it. This is the **react-ui admin feature kit** layer: it renders;
it does not own auth, routing, or how an app builds its navigation.

It sits on top of the shared shell substrate — three packages over the same
framework concern:

- [`@granit/shell-core`](../shell-core) — framework-agnostic substrate: the
  `NavItem` / `NavGroup` model, `filterNavByPermission`, the color-theme store,
  query-client and Axios-interceptor wiring.
- [`@granit/react-shell-core`](../react-shell-core) — React hooks over that
  substrate (e.g. `useColorThemeStore`, consumed by `NavUserThemeMenu`).
- `@granit/react-ui-shell-admin` (this package) — the admin chrome components.

App-specific data — the host/tenant flavour, the static navigation model, and the
app version — is injected via **`ShellChromeProvider`**, so the chrome stays
decoupled from how each app resolves them. App-flavoured composition (the account
menu, header feature widgets) is passed as **slots** (`userMenu`, `headerActions`),
never through the context. Workspace-driven navigation, the launcher grid, and the
command palette read the live workspace tree from
[`@granit/react-workspaces`](../react-workspaces) (backend module
`Granit.Workspaces`, contract `contracts/openapi/workspaces.json`); the user-menu
presence sub-menu reads [`@granit/react-presence`](../react-presence)
(`contracts/openapi/presence.json`). A future mobile/site shell is a sibling kit
with different chrome, sharing the same substrate + tokens.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers (all `workspace:*` unless noted):

- `@granit/react-ui` — the shadcn/ui primitives the chrome renders with (Sidebar,
  Sheet, CommandDialog, DropdownMenu, Breadcrumb, …).
- `@granit/ui-theme` — color-theme palettes + swatches for the theme sub-menu.
- `@granit/shell-core` + `@granit/react-shell-core` — the nav model and the
  color-theme store.
- `@granit/workspaces` + `@granit/react-workspaces` — the workspace tree, URL
  helpers (`buildWorkspaceUrl`, `parseWorkspaceUrl`), and `useWorkspaces` /
  `useFeatureRouteTable` hooks.
- `@granit/presence` + `@granit/react-presence` — presence DTOs and the
  `useMyPresence` / `useSetMyPresence` hooks behind `NavUserPresenceMenu`.
- `@granit/react-authorization` — `usePermissions`, used to filter nav by
  permission.
- `@granit/react-localization` — `useTranslation` for every label, and the shared
  `resolveLabel`.
- `@granit/react-account` · `@granit/react-settings` · `@granit/localization` ·
  `@granit/types` · `@granit/utils` — supporting types and helpers.
- `lucide-react` (`^1.21`) — icons, incl. the dynamic-by-name `WorkspaceIcon`.
- `next-themes` (`^0.4.6`) — light/dark/system mode behind `NavUserThemeMenu`.
- `react` / `react-dom` (`^19`) and `react-router` (`^7.18`) — routing context
  (`useLocation`, `useNavigate`, `NavLink`) is required: mount the shell inside a
  Router.

## Quick start

Wrap the shell in a Router and a `ShellChromeProvider`, then render `AppShell` with
your app's account menu and header widgets as slots. Mount `CommandPalette` once at
the root so `Ctrl+K` / `⌘K` works on every route.

```tsx
import {
  AppShell,
  CommandPalette,
  NavUserPresenceMenu,
  NavUserThemeMenu,
  ShellChromeProvider,
  type ShellChromeValue,
} from '@granit/react-ui-shell-admin';
import { LayoutDashboard, Users } from 'lucide-react';
import { BrowserRouter, Outlet } from 'react-router';

// App-owned: the static nav model used until the user picks a workspace.
const chrome: ShellChromeValue = {
  appKind: 'host',
  appVersion: '1.4.0',
  navModel: {
    mainNavigation: [
      { href: '/', titleKey: 'Navigation.Home', icon: LayoutDashboard },
      { href: '/users', titleKey: 'Navigation.Users', icon: Users, permission: 'Users.Read' },
    ],
    navGroups: [],
  },
};

export function App() {
  return (
    <BrowserRouter>
      <ShellChromeProvider value={chrome}>
        <CommandPalette />
        <AppShell
          userMenu={<AccountMenu />}
          headerActions={<NotificationBell />}
          routeLabels={{ users: 'Navigation.Users' }}
        >
          <Outlet />
        </AppShell>
      </ShellChromeProvider>
    </BrowserRouter>
  );
}

// The account menu is app-owned; drop in the framework sub-menus as items.
function AccountMenu() {
  return (
    <DropdownMenu>
      {/* …app account header / logout… */}
      <NavUserPresenceMenu />
      <NavUserThemeMenu />
    </DropdownMenu>
  );
}
```

`AppSidebar` auto-prefers **workspace-driven** navigation whenever an active
workspace resolves to a tree node with at least one item, and falls back to
`navModel` otherwise (e.g. a fresh visit landing on `/`). Use `HostHomePage` as the
`/` route to get the Frappe/Odoo-style launcher grid of workspace tiles:

```tsx
import { HostHomePage } from '@granit/react-ui-shell-admin';
import { Route, Routes } from 'react-router';

<Routes>
  <Route path="/" element={<HostHomePage />} />
  {/* …app routes… */}
</Routes>;
```

## Public API

| Symbol                           | Kind      | Purpose                                                               |
| -------------------------------- | --------- | --------------------------------------------------------------------- |
| `AppShell`                       | component | The frame: sidebar + topbar + scrollable content + right rail         |
| `AppSidebar`                     | component | Workspace switcher + workspace-driven/static nav + `userMenu` footer  |
| `AppRightSidebar`                | component | Right rail: inline column on `lg+`, right-anchored `Sheet` below `lg` |
| `Header`                         | component | Topbar: breadcrumb, palette trigger, `actions` slot, rail toggle      |
| `CommandPalette`                 | component | `Ctrl+K`/`⌘K` modal listing every workspace + item across the tree    |
| `HostHomePage`                   | component | Launcher grid of workspace tiles; selecting navigates to `/w/{name}`  |
| `WorkspaceSwitcherMenu`          | component | Sidebar-header switcher; active workspace stays visible               |
| `WorkspaceContentNav`            | component | Active workspace's sections/items, incl. cascading `SubWorkspace`     |
| `WorkspaceIcon`                  | component | Lucide icon by backend kebab-case name; `Square` fallback             |
| `NavUserPresenceMenu`            | component | User-menu sub-menu: set manual presence + expiry                      |
| `NavUserThemeMenu`               | component | User-menu sub-menu: light/dark/system mode + color theme              |
| `ShellChromeProvider`            | provider  | Injects `appKind` / `navModel` / `appVersion` into the chrome         |
| `RightSidebarProvider`           | provider  | Right-rail open state (persisted); mounted internally by `AppShell`   |
| `useShellChrome`                 | hook      | Read the injected `ShellChromeValue`; throws outside the provider     |
| `useRightSidebar`                | hook      | Right-rail `open`/`sheetOpen`/`toggle`; throws outside provider       |
| `useActiveWorkspace`             | hook      | Active workspace (URL `/w/{name}` first, then persisted) + setter     |
| `openCommandPalette`             | fn        | Dispatch the open-palette event (header search trigger)               |
| `resolveItemHref`                | fn        | Workspace item → route (Entity/Link/Feature/Dashboard/SubWorkspace)   |
| `resolveItemLabel`               | fn        | Workspace item → display label via `displayKey` + `t`, w/ fallbacks   |
| `resolveLabel`                   | fn        | Re-export of the shared `@granit/react-localization` label resolver   |
| `OPEN_COMMAND_PALETTE_EVENT`     | const     | The `granit:open-command-palette` event name                          |
| `ShellChromeValue`               | type      | Provider input: `appKind` / `navModel` / `appVersion?`                |
| `ShellNavItem` / `ShellNavGroup` | type      | The chrome's nav model (icons as renderable components)               |
| `ShellNavIcon`                   | type      | `ComponentType<{ className?: string }>` — a renderable nav icon       |
| `AppShellProps` / `HeaderProps`  | type      | Component prop shapes (slots, `routeLabels`, `collapsedPaths`)        |
| `UseActiveWorkspaceReturn`       | type      | `{ activeWorkspaceName, setActiveWorkspace }`                         |
| `ShellChromeProviderProps`       | type      | `{ value, children }`                                                 |

## Out of scope / caveats

- **No locale bundle ships with this package.** Labels use the flat default
  `translation` namespace with inline English fallbacks, except `NavUserPresenceMenu`,
  which reads the framework's nested `presence` namespace. A consuming app supplies
  `Theme.*`, `Command.*`, `Workspace.*`, `Header.*`, `Home.*`, `Navigation.*` keys
  via its localization; absent keys render the inline English fallback.
- **`WorkspaceIcon` resolves untrusted backend icon names.** Names come from the
  workspace tree as kebab-case strings (`shield-user`, …) and are lazily loaded via
  lucide's `DynamicIcon`. Unknown / null names are caught by an internal error
  boundary and fall back to `Square` — it never throws and never injects markup.
- **Account menu, auth, and logout are app-owned.** Pass your own menu as the
  `userMenu` slot; this package only provides the `NavUserPresenceMenu` and
  `NavUserThemeMenu` items to drop into it. The host/tenant `appKind` only tunes
  workspace-query options and a few branches — it is not an authorization boundary.
- **Permission filtering here is UX gating, not enforcement.** `AppSidebar` hides
  nav items via `filterNavByPermission` + `usePermissions`; the .NET backend remains
  the only authority. Do not treat a hidden item as a security guarantee — see
  [`@granit/react-authorization`](../react-authorization) for the full model.
- **Router required.** `AppShell`, `Header`, the switcher, and the palette use
  `react-router` (`useLocation` / `useNavigate` / `NavLink`); mount inside a
  Router or they throw.
- **Right-rail content is a placeholder.** `AppRightSidebar` currently renders a
  built-in placeholder body (timeline-to-be); it is not yet a composition slot.
- **Rendering only.** DTOs and HTTP transport live in the core/hook layers
  ([`@granit/workspaces`](../workspaces), [`@granit/presence`](../presence) and
  their `react-*` wrappers); this package consumes their hooks and types.

## License

Apache-2.0
