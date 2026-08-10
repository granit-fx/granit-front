# Frontend foundation architecture — shared UI, shell & substrate packages

This document describes the **frontend foundation layer** of the Granit
ecosystem: the packages that let multiple applications (admin back-offices,
showcases, future mobile apps and public sites) share UI, theming and shell
plumbing **without duplicating code**.

It was extracted from `granit-showcase-react` (the reference admin app) into
`granit-front` so any number of similar apps can consume it. The showcase is now
a thin consumer that composes these packages.

The guiding rule:

> Share the **substrate** (tokens, primitives, providers, navigation model) and
> the **presentational structure** (the shell frame). Keep **app composition**
> (which features are mounted, the account menu, auth wiring) close to each app.
> Putting app composition into a shared package doesn't remove duplication — it
> relocates it as coupling.

---

## The layers

```text
Apps          showcase-admin · (future) app-mobile · (future) site-X
                pick a shell + nav config + a theme override + own composition
   ▲
Shells        @granit/react-ui-shell-admin   (admin chrome: sidebar + topbar + content + rail)
 (chrome)         + future react-ui-shell-mobile / react-ui-shell-site
   ▲
Admin-kit     @granit/react-ui-kit     (data grid, querying, form dialog, view switcher)
   ▲
Primitives    @granit/react-ui               (shadcn/ui: Button, Input, Dialog, Table, Sidebar…)
Tokens        @granit/ui-theme               (CSS variables: colours, dark mode, palettes, fonts)
   ▲
Substrate     @granit/react-shell-core       (React bindings: theme provider/hook, auth ctx, ProtectedRoute)
              @granit/shell-core             (agnostic: colour-theme store, api/query factories, nav model)
```

Each application picks the shell it needs, injects its navigation and feature
composition, and overrides theme tokens to re-brand. Nothing above is mandatory
wholesale — an app takes the layers it needs.

---

## Naming & the agnostic / framework split

Two orthogonal axes are encoded in every package name:

- **Framework** — no prefix = framework-agnostic; `react-` = React; (future)
  `angular-` = Angular.
- **Concern** — `ui` in the name = it renders visuals (components or tokens);
  no `ui` = headless logic/substrate.

| Package                        | Framework | Concern         |
| ------------------------------ | --------- | --------------- |
| `@granit/ui-theme`             | agnostic  | visual (tokens) |
| `@granit/react-ui`             | React     | visual          |
| `@granit/react-ui-kit`         | React     | visual          |
| `@granit/react-ui-shell-admin` | React     | visual (chrome) |
| `@granit/shell-core`           | agnostic  | logic           |
| `@granit/react-shell-core`     | React     | logic           |

The agnostic/framework split mirrors the rest of the monorepo (every domain is
`@granit/X` + `@granit/react-X`) and exists so a **future Angular UI** reuses the
agnostic logic (`shell-core`, the nav model, the theme store) and the shared
**tokens** (`ui-theme`) unchanged — only the React-specific layers get an
`angular-*` sibling.

This keeps brand consistency across an org's admin app, mobile app and public
site for free: they all consume the same `@granit/ui-theme` tokens.

---

## Package reference

### `@granit/ui-theme` — design tokens (agnostic)

A single CSS stylesheet (`./base.css`) of semantic custom properties: colour
palettes, dark mode, five built-in colour themes (`data-theme`), typography,
shadows and sidebar variables. Plus `COLOR_THEMES` / `ColorTheme` (the source of
truth for the theme list, shared with the store).

This is the **theme contract**: components consume semantic tokens
(`bg-primary`, `text-foreground`, …), so overriding a CSS variable in a
consuming app re-brands the whole UI — including domain components — without
touching component code.

```css
@import 'tailwindcss';
@import '@granit/ui-theme/base.css';

:root {
  --color-primary: #ff0000; /* re-brand: cascades everywhere */
}
```

### `@granit/react-ui` — primitives (React, visual)

The shadcn/ui primitives (Button, Input, Dialog, Table, Select, Sidebar,
Command, Tooltip, …) plus a few generic form-field wrappers. Presentational
only: no data fetching, no business logic. `cn` comes from `@granit/utils`.
Barrel-only — import everything from the package root.

### `@granit/react-ui-kit` — admin building blocks (React, visual)

Cross-cutting pieces that are neither bare primitives nor tied to one domain:
`ManualDataTable`, the querying suite (`SmartFilterBar`, `SortSelector`,
`GroupBySelector`, `ColumnVisibility`, `FilterPresets`, `BulkActions`,
`DatePeriodPicker`, server-paginated tables), `FormDialog`, `ViewSwitcher`.
Composes `@granit/react-ui` with `@granit/react-query-engine` hooks; the host app
mounts the query/client providers.

### `@granit/shell-core` — substrate logic (agnostic)

Headless, framework-agnostic logic shared by every shell and any framework:

- `createColorThemeStore` — a vanilla Zustand store that persists the colour
  theme and reflects it onto `<html data-theme>`. Created per call (not a module
  singleton) so multiple apps on one page stay independent.
- `createAppQueryClient` — a TanStack QueryClient with Granit's policy
  (idempotency-aware mutation retries, defaults) and an injected `onApiError`.
- `installForbiddenRedirectInterceptor` — routes HTTP 403 to an app-supplied
  handler with background-endpoint suppression; no route literals.
- The **navigation model** — generic `NavItem<TIcon, TKey>` / `NavGroup` (so an
  app specialises icons/keys without coupling the model to a UI library) and
  `filterNavByPermission`.

### `@granit/react-shell-core` — substrate React bindings

React glue over `shell-core`, shared by every React shell:

- `ColorThemeStoreProvider` / `useColorThemeStore` — inject a colour-theme store
  via context (not a singleton) and read it with a selector.
- `ThemeProvider` — dark/light/system via `next-themes` (`class` attribute),
  orthogonal to the colour theme.
- `ShellAuthProvider` / `useShellAuth` — auth **state**
  (`authenticated`/`loading`/`login`) decoupled from how an app resolves auth.
- `ProtectedRoute` — gates a route subtree, kicks off login when unauthenticated.

### `@granit/react-ui-shell-admin` — admin chrome (React, visual)

The admin app-shell frame, shared by every Granit admin app:

- `AppShell` — collapsible sidebar + topbar + scrollable content + right rail,
  with responsive behaviour.
- `AppSidebar` — workspace-driven navigation (falls back to a static nav model),
  permission-filtered.
- `Header` — breadcrumb + command-palette trigger + right-panel toggle.
- Workspace switcher / content nav, command palette, host home, presence menu.

App-specific data is **injected**, not baked in:

- `ShellChromeProvider` carries `{ appKind, navModel, appVersion }`.
- The account menu is a `userMenu` **slot** (so each app keeps its own auth,
  routes and menu).
- Header widgets are a `headerActions` slot; feature providers/overlays wrap
  `AppShell` in the app's composition root.

---

## Injection patterns

Because the chrome must serve apps that differ, app-specific concerns are never
hardcoded in the packages. Four patterns are used, in order of preference:

1. **Slots / children** — for app-flavoured UI (account menu, header widgets,
   feature mounts). The package renders `{slot}`; the app passes its component.
   This is why `NavUser` stays in the showcase, passed to `AppSidebar` via
   `userMenu`.
2. **Context** — for data the chrome reads deep in its tree: navigation +
   app kind via `ShellChromeProvider`; auth state via `ShellAuthProvider`.
3. **Factories with callbacks** — for policy that varies by app: the API
   interceptor's `onForbidden`, the query client's `onApiError`, the theme
   store's `storageKey`/`themes`.
4. **Direct framework hooks** — when the dependency is already a Granit package
   (e.g. `usePermissions` from `@granit/react-authorization`), the chrome imports
   it directly; no custom injection needed.

What is **not** injected: the showcase's account routes, impersonation logic,
notification SSE wiring — those live in the app, because forcing them into a
shared package would make a "generic" component secretly depend on auth +
languages + logger + features (a false-generic, rigid across apps).

---

## How an app consumes the foundation

```tsx
// 1. Theme: import tokens, override CSS vars to re-brand (index.css)
//    @import 'tailwindcss'; @import '@granit/ui-theme/base.css';

// 2. Substrate: wire providers near the root
<ColorThemeStoreProvider store={colorThemeStore}>
  <ThemeProvider>
    {/* auth, query client, etc. */}
    <ShellAuthBridge>{children}</ShellAuthBridge>
  </ThemeProvider>
</ColorThemeStoreProvider>;

// 3. Chrome: compose the shell, injecting nav + app composition
<ShellChromeProvider value={{ appKind, navModel, appVersion }}>
  <AppShell
    userMenu={<NavUser />}
    routeLabels={ROUTE_LABELS}
    headerActions={
      <>
        <Search />
        <NotificationBell />
      </>
    }
  >
    <Outlet />
  </AppShell>
</ShellChromeProvider>;
```

The app brings: a navigation config, an account menu, its feature wiring, and
(optionally) a theme override. Everything visual and structural comes from the
packages.

---

## Dependency direction

```text
ui-theme        (leaf: CSS, no JS deps)
react-ui        → @granit/utils
react-ui-admin-kit → react-ui, react-localization, react-query-engine, data-lookup
shell-core      → idempotency, @tanstack/react-query, axios, zustand   (agnostic)
react-shell-core → shell-core, react, next-themes, zustand
react-ui-shell-admin → react-ui, react-shell-core, shell-core, ui-theme,
                       react-workspaces, react-presence, react-account, …
```

No layer imports a layer above it. Domain `@granit/react-*` components and the
foundation both consume the same tokens, so a theme override cascades through
everything.

---

## Consumption mechanics (monorepo + showcases)

- **Source-direct.** Apps consume these packages from source via pnpm `link:`
  deps + a Vite alias to `src/index.ts` (auto-discovered), locally and in CI.
  The `dist`/`publishConfig` only serve publication to GitHub Packages.
- **Tailwind `@source`.** Utility classes used only inside the symlinked
  packages are emitted because the app scans
  `@granit/react-*/src/**` (the `react-` prefix covers every visual package).
  `ui-theme` ships CSS, not utility classes, so it needs no glob — but its CSS
  subpath needs an explicit alias so the greedy bare-package alias doesn't
  swallow `@granit/ui-theme/base.css`.
- **Dedupe.** Libraries whose React context must reach components served from
  the package source (`cmdk`, `@tanstack/react-table`, radix, react-query, …)
  are listed in the app's Vite `resolve.dedupe` so there is a single instance.
- **`tsc -b` incremental state.** After rebuilding a granit-front package, clear
  the app's stale `tsbuildinfo` (`tsc -b --clean`) before typecheck to avoid
  phantom "no exported member" errors.

---

## Multi-framework & multi-shell

The split is built to scale beyond one React admin app:

```text
Agnostic :  ui-theme · shell-core · query-engine · validation · every @granit/X
React :     react-ui · react-ui-admin-kit · react-shell-core · react-ui-shell-admin · react-X
Angular :   angular-ui · angular-ui-admin-kit · angular-shell-core · angular-ui-shell-admin · angular-X
```

- A **mobile** or **public-site** shell is a sibling package
  (`react-ui-shell-mobile`, `react-ui-shell-site`) with its own chrome (tab bar,
  header/footer) sharing the same `shell-core` + `ui-theme`.
- A future **Angular** UI reuses the agnostic layers + tokens unchanged.

### When apps are near-identical: a preset, not more chrome

If two admin apps share not just the structure but the **wiring** (same auth,
same feature mounts, same account menu), that wiring is worth extracting — but
into a higher layer, **not** into the presentational chrome:

```text
react-ui-shell-admin  → presentational chrome (slots)        ← all admin apps
react-admin-preset    → chrome + standard wiring (optional)   ← near-clone apps
app                   → preset, or chrome + own wiring        ← divergent apps
```

Create `@granit/react-admin-preset` only once a **second real admin app** proves
the wiring is identical — otherwise you'd be abstracting a wiring you've never
compared against a second case.
