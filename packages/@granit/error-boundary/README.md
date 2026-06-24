# @granit/error-boundary

Framework-agnostic **error-capture contract** — the shared type surface for
structured error reporting (breadcrumb trails, route/user enrichment) across the
Granit front-end. It holds **no** React, DOM or Node-only dependency: it is a
pure `.ts` types barrel that the React runtime and the admin UI build on.

This is the *core* layer of a three-package split:

- **`@granit/error-boundary`** (this package) — the contract: `Breadcrumb`,
  `ErrorContextConfig`, `ErrorContextValue`.
- [`@granit/react-error-boundary`](../react-error-boundary) — the headless
  React runtime: `GranitErrorBoundary`, `GlobalErrorCapture`,
  `ErrorContextProvider`, `useBreadcrumb`.
- [`@granit/react-ui-error-boundary`](../react-ui-error-boundary) — the visible
  admin UI: `ErrorFallback`, `ErrorPage`, `NotFoundPage` and their `Errors.*`
  translations.

There is no backend counterpart — error capture is a client-side observability
concern. Diagnostics are surfaced through `@granit/logger`, not an HTTP
endpoint.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. This
package declares no peer dependencies; it is types-only and imports nothing at
runtime. Consumers wiring the actual boundary depend on the React siblings
instead (`@granit/react-error-boundary` pulls in `@granit/logger` and `react`).

## Quick start

The package exports types only — there is nothing to call at runtime. You
consume it when typing your enrichment configuration, then hand that config to
the `ErrorContextProvider` from the React sibling.

```ts
import type { ErrorContextConfig } from '@granit/error-boundary';

// Wire route + user enrichment for error reports. `getUserInfo` returns
// `undefined` when no user is authenticated; both accessors are optional.
const errorConfig: ErrorContextConfig = {
  getRouteInfo: () => window.location.pathname,
  getUserInfo: () => (session ? { id: session.userId } : undefined),
  maxBreadcrumbs: 20, // FIFO cap; defaults to 20 when omitted
};
```

```tsx
// The config flows into the React runtime (sibling package):
import { ErrorContextProvider } from '@granit/react-error-boundary';

<ErrorContextProvider config={errorConfig}>
  <App />
</ErrorContextProvider>;
```

The `ErrorContextValue` type describes what that provider exposes through
context — a read-only `breadcrumbs` trail plus an `addBreadcrumb(category,
message)` method and the resolved `getRouteInfo` / `getUserInfo` accessors.

## Public API

| Symbol               | Kind | Purpose                                                                                                |
| -------------------- | ---- | ------------------------------------------------------------------------------------------------------ |
| `Breadcrumb`         | type | One significant event before an error: `category`, `message`, ISO-8601 `timestamp`                     |
| `ErrorContextConfig` | type | Provider config: optional `getRouteInfo` / `getUserInfo` enrichers + `maxBreadcrumbs` (default `20`)   |
| `ErrorContextValue`  | type | Context shape: read-only `breadcrumbs` trail, `addBreadcrumb`, resolved `getRouteInfo` / `getUserInfo` |

## Out of scope / caveats

- **No runtime.** This package is a type contract. The boundary component,
  global `error` / `unhandledrejection` listeners and the `useBreadcrumb` hook
  live in [`@granit/react-error-boundary`](../react-error-boundary); the
  fallback and error pages in
  [`@granit/react-ui-error-boundary`](../react-ui-error-boundary).
- **PII in enrichment is your responsibility.** `getUserInfo` is typed to a
  bare `{ id: string }` on purpose — keep error context to an opaque
  identifier. Do not widen it with names, emails or tenant data: breadcrumbs and
  user info flow into logs, and logs are not a place for PII (RGPD).
- **`getUserInfo` may return `undefined`** for anonymous sessions — always
  narrow before reading `.id`.
- **No transport.** Captured errors are reported through `@granit/logger`
  (`createLogger`) by the React sibling, never `console.*` and never a bespoke
  HTTP call.

## License

Apache-2.0
