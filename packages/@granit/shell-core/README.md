# @granit/shell-core

Framework-agnostic **app-shell substrate** shared by every Granit app shell
(admin, mobile, site) **and** any UI framework. Headless logic only — no React,
no DOM-framework coupling — so a future `@granit/angular-*` shell reuses it
unchanged. It bundles the four cross-cutting concerns every shell needs before
any chrome is drawn: a persisted colour-theme store, a permission-aware
navigation model, a 403-redirect Axios interceptor, and the standard TanStack
`QueryClient` factory.

This is the framework-agnostic **core** layer. There is no backend counterpart —
this is pure client-side shell infrastructure, no OpenAPI contract. The split is
three packages over the same substrate:

- `@granit/shell-core` (this package) — framework-agnostic core: the vanilla
  Zustand store, the navigation types + filter, and the Axios/QueryClient
  factories, reusable from any UI framework.
- [`@granit/react-shell-core`](../react-shell-core) — React context providers +
  hooks binding the store to the React tree, plus theme/auth/route primitives.
- [`@granit/react-ui-shell-admin`](../react-ui-shell-admin) — the admin chrome
  feature kit (AppShell, AppSidebar, command palette, user menu) built on this
  substrate and the [`@granit/ui-theme`](../ui-theme) tokens.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (and `isAxiosError`) the
  403 interceptor installs onto.
- `@granit/idempotency` — `shouldRetryIgnoringTombstone`, the mutation-retry
  predicate that short-circuits on a tombstoned (replayed) idempotent response.
- `@tanstack/query-core` (`^5`) — the framework-agnostic `QueryClient` /
  `QueryCache` / `MutationCache` built by `createAppQueryClient` (this core stays
  React-free; a React app already has these via `@tanstack/react-query`).
- `axios` (`^1.6`) — peer of the underlying client.
- `zustand` (`^5`) — backs the vanilla colour-theme store.

## Quick start

Each export is independent; an app wires the ones it needs at the shell root.

```ts
import {
  createColorThemeStore,
  createAppQueryClient,
  installForbiddenRedirectInterceptor,
  filterNavByPermission,
  type NavItem,
} from '@granit/shell-core';
import { granitClient } from '@granit/api-client';
import { COLOR_THEMES } from '@granit/ui-theme';

// 1. Colour-theme store — persisted, reflected onto <html data-theme>. Created
// per app (not a module singleton) so multiple apps on one page stay isolated.
// Bind it to a UI framework at the edge (React: @granit/react-shell-core).
const colorThemeStore = createColorThemeStore({
  storageKey: 'admin.color-theme',
  defaultTheme: 'blue',
  themes: COLOR_THEMES,
});

// 2. App QueryClient — standard policy: errors surfaced via the injected
// handler (no UI lib here), idempotency-aware mutation retries.
const queryClient = createAppQueryClient({
  onApiError: (error) => toastFromProblemDetails(error),
});

// 3. Route 403s to an app-supplied handler; suppress background-endpoint 403s
// (notification bell, presence) so a missing optional permission never hijacks
// the document or aborts in-flight lazy route chunks.
installForbiddenRedirectInterceptor(granitClient, {
  onForbidden: () => location.assign('/access-denied'),
  suppressPatterns: [/\/notifications/, /\/presence/],
});

// 4. Navigation model — generic over icon + i18n-key types. Drop items the
// current user may not see before the shell renders them.
const items: NavItem[] = [
  { titleKey: 'nav.dashboard', href: '/', icon: undefined },
  { titleKey: 'nav.users', href: '/users', icon: undefined, permission: 'Users.Read' },
];
const visible = filterNavByPermission(items, (p) => myGrants.has(p));
```

`createColorThemeStore` returns a vanilla `StoreApi<ColorThemeState>`; the React
binding (`ColorThemeStoreProvider` / `useColorThemeStore`) lives in
[`@granit/react-shell-core`](../react-shell-core).

## Public API

| Symbol                                | Kind | Purpose                                                                        |
| ------------------------------------- | ---- | ------------------------------------------------------------------------------ |
| `createColorThemeStore`               | fn   | Vanilla Zustand store: persists the colour theme, reflects `<html data-theme>` |
| `ColorThemeState`                     | type | `{ colorTheme: string; setColorTheme }` — the reactive theme state             |
| `CreateColorThemeStoreOptions`        | type | `{ storageKey, defaultTheme, themes, migrate?, version? }`                     |
| `createAppQueryClient`                | fn   | Build the standard TanStack `QueryClient` (error surfacing + retry policy)     |
| `CreateAppQueryClientOptions`         | type | `{ onApiError, mutationMaxAttempts?, staleTimeMs? }`                           |
| `installForbiddenRedirectInterceptor` | fn   | Axios response interceptor routing 403 to `onForbidden`, suppressing patterns  |
| `ForbiddenRedirectOptions`            | type | `{ onForbidden, suppressPatterns?, logger? }`                                  |
| `filterNavByPermission`               | fn   | Keep nav items with no `permission` or one `hasPermission` grants              |
| `NavItem<TIcon, TKey>`                | type | One nav entry (`titleKey`, `href`, `icon`, optional `permission`, `children`)  |
| `NavGroup<TIcon, TKey>`               | type | A labelled group of `NavItem`s                                                 |

## Out of scope / caveats

- **No React, no rendering.** This package is headless substrate: the React
  context binding lives in [`@granit/react-shell-core`](../react-shell-core), and
  the visual chrome (sidebars, topbars, command palette) in
  [`@granit/react-ui-shell-admin`](../react-ui-shell-admin).
- **Headless colour store, app-typed palette.** `ColorThemeState.colorTheme` is a
  plain `string` — the agnostic store stays decoupled from any app's specific
  theme union. `themes` and `defaultTheme` must mirror the
  [`@granit/ui-theme`](../ui-theme) `COLOR_THEMES` set; bump `version` and supply
  `migrate` when persisted theme names change shape.
- **The store is created per call, never a module singleton**, so multiple apps
  mounted on one page keep independent theme state.
- **Permission filtering is a UX gate, not a security boundary.**
  `filterNavByPermission` hides links the user cannot use to avoid noisy 403s; the
  .NET backend re-checks authorization on every protected endpoint regardless.
  Likewise, the 403 interceptor reacts to the server's decision — it does not make
  one.
- **403 only.** `installForbiddenRedirectInterceptor` handles HTTP 403;
  401 (re-authentication) stays with the auth layer via `setOnUnauthorized` in the
  client. Background-endpoint patterns must be supplied by the app, since no route
  literals live here.
- **Idempotency-aware retries.** `createAppQueryClient` retries failed mutations up
  to `mutationMaxAttempts` (default 2) but short-circuits on a tombstoned replay via
  `shouldRetryIgnoringTombstone` from [`@granit/idempotency`](../idempotency); the
  `onApiError` handler must itself filter errors already handled elsewhere
  (401/403 redirects) to avoid double-surfacing.

## License

Apache-2.0
