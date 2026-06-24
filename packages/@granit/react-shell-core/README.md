# @granit/react-shell-core

React bindings for the Granit **app-shell substrate** — the shell-agnostic logic
shared by every Granit React app shell (admin, mobile, site). This is the **React
hooks + providers layer**: it wraps the framework-agnostic store and types from
[`@granit/shell-core`](../shell-core) (a vanilla Zustand colour-theme store, the
`ColorThemeState` shape) in React context, and adds the React-only pieces a shell
needs — a dark/light/system `ThemeProvider` (next-themes), a shell auth context,
and a `ProtectedRoute` gate. It holds no chrome: sidebars, topbars, tab-bars and
the visual frame live one layer up, in the per-shell packages.

The split is three packages over the same shell substrate (there is no backend
counterpart — this is pure client-side shell infrastructure, no OpenAPI contract):

- [`@granit/shell-core`](../shell-core) — framework-agnostic core: the vanilla
  `createColorThemeStore` and `ColorThemeState` type, reusable from any UI
  framework.
- `@granit/react-shell-core` (this package) — React context providers + hooks
  binding that store to the React tree, plus theme/auth/route React primitives.
- [`@granit/react-ui-shell-admin`](../react-ui-shell-admin) — the admin chrome
  feature kit (AppShell, AppSidebar, user menu, command palette) built on this
  substrate and the [`@granit/ui-theme`](../ui-theme) tokens.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/shell-core` — supplies `createColorThemeStore` and the
  `ColorThemeState` shape this layer provides to the tree.
- `next-themes` (`^0.4.6`) — backs `ThemeProvider` (dark/light/system via the
  `class` attribute).
- `zustand` (`^5`) — the vanilla store reflected into React context here.
- `react` and `react-dom` (`^19`).

## Quick start

The two theme dimensions are orthogonal and both wired at the app root: dark mode
(`ThemeProvider`, toggles `.dark`) and the colour palette (`ColorThemeStoreProvider`,
sets `<html data-theme>`). The store comes from `@granit/shell-core`; bind it once,
read it with a selector anywhere below.

```tsx
import {
  ColorThemeStoreProvider,
  ProtectedRoute,
  ShellAuthProvider,
  ThemeProvider,
  useColorThemeStore,
} from '@granit/react-shell-core';
import { createColorThemeStore } from '@granit/shell-core';
import { COLOR_THEMES } from '@granit/ui-theme';

// Created per app (not a module singleton) so multiple apps on one page stay
// independent. `themes` must mirror the @granit/ui-theme COLOR_THEMES set.
const colorThemeStore = createColorThemeStore({
  storageKey: 'admin.color-theme',
  defaultTheme: 'blue',
  themes: COLOR_THEMES,
});

function Root({ children }: { children: React.ReactNode }) {
  // `value` bridges the app's own auth provider (BFF / OIDC / mock) into the shell.
  const auth = { authenticated: true, loading: false, login: () => location.assign('/login') };

  return (
    <ThemeProvider defaultTheme="system">
      <ColorThemeStoreProvider store={colorThemeStore}>
        <ShellAuthProvider value={auth}>
          <ProtectedRoute>{children}</ProtectedRoute>
        </ShellAuthProvider>
      </ColorThemeStoreProvider>
    </ThemeProvider>
  );
}

function ThemePicker() {
  const theme = useColorThemeStore((s) => s.colorTheme);
  const setTheme = useColorThemeStore((s) => s.setColorTheme);
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      {COLOR_THEMES.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}
```

`ProtectedRoute` reads `ShellAuthContext`: it renders nothing while `loading` or
unauthenticated (kicking off `login()` in the latter case) and renders its children
once `authenticated`. The auth mechanism is the app's concern — the shell only sees
the resolved `ShellAuthState`.

## Public API

| Symbol                         | Kind      | Purpose                                                               |
| ------------------------------ | --------- | --------------------------------------------------------------------- |
| `ColorThemeStoreProvider`      | provider  | Inject a `createColorThemeStore` store into the tree via context      |
| `useColorThemeStore`           | hook      | Read the colour-theme store with a selector; throws outside provider  |
| `ThemeProvider`                | provider  | Dark/light/system (`next-themes`, `class` attribute, `enableSystem`)  |
| `ShellAuthProvider`            | provider  | Bridge the app's resolved auth state into the shell                   |
| `useShellAuth`                 | hook      | Read `ShellAuthState`; throws outside a `<ShellAuthProvider>`         |
| `ProtectedRoute`               | component | Gate a subtree behind auth; triggers `login()` when unauthenticated   |
| `ShellAuthState`               | type      | `{ authenticated, loading, login }` the shell needs, auth-agnostic    |
| `ShellAuthProviderProps`       | type      | `{ value, children }`                                                 |
| `ColorThemeStoreProviderProps` | type      | `{ store, children }` — store is a `StoreApi<ColorThemeState>`        |
| `ThemeProviderProps`           | type      | `{ children, defaultTheme? }` (`defaultTheme` defaults to `'system'`) |

## Out of scope / caveats

- **The two theme dimensions are independent and both required.** Dark mode toggles
  the `.dark` class (via `ThemeProvider`); the colour theme sets `<html data-theme>`
  (via the store from `ColorThemeStoreProvider`). The
  [`@granit/ui-theme`](../ui-theme) `.dark[data-theme=…]` palettes depend on **both**
  being present — mount both providers at the root.
- **The store is injected, never a module singleton.** Create it with
  `createColorThemeStore` from [`@granit/shell-core`](../shell-core) and pass it in,
  so multiple apps mounted on one page keep independent theme state. `themes` and
  `defaultTheme` must match the [`@granit/ui-theme`](../ui-theme) `COLOR_THEMES` set.
- **Auth is bridged, not resolved here.** `ShellAuthProvider` takes an already-resolved
  `ShellAuthState`; this package is decoupled from how the app authenticates
  (BFF / OIDC / Keycloak / mock). `ProtectedRoute` is a **UX gate**, not a security
  boundary — every protected endpoint must still enforce authentication server-side.
- **No chrome.** Sidebars, topbars, command palette and the visual frame live in
  [`@granit/react-ui-shell-admin`](../react-ui-shell-admin) (and future per-shell
  siblings); this package is headless substrate.
- **Headless colour store, app-typed palette.** `ColorThemeState.colorTheme` is a
  plain `string` — the agnostic store stays decoupled from any app's specific theme
  union; apps keep that typing alongside their [`@granit/ui-theme`](../ui-theme)
  palettes.

## License

Apache-2.0
