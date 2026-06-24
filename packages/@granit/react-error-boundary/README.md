# @granit/react-error-boundary

React bindings for the Granit **error-boundary** infrastructure — a headless
React error boundary, a global `window` error/rejection capture, and an error
context that enriches every caught error with the current route, user, and a
breadcrumb trail. This is the **React layer**: it wires the framework-agnostic
types from [`@granit/error-boundary`](../error-boundary) into React components,
a provider, and a hook, and logs through `@granit/logger`. It renders **no**
fallback UI itself — the visible pages live one layer up.

The split is three packages, no backend counterpart (this is client-side
observability infrastructure, not a domain module):

- [`@granit/error-boundary`](../error-boundary) — framework-agnostic core:
  `Breadcrumb`, `ErrorContextConfig`, `ErrorContextValue` types only.
- `@granit/react-error-boundary` (this package) — boundary component, global
  capture, context provider, breadcrumb hook.
- [`@granit/react-ui-error-boundary`](../react-ui-error-boundary) — the visible
  admin UI kit: `ErrorFallback`, `ErrorPage`, `NotFoundPage` plus their
  `Errors.*` translations, each taking an optional layout slot.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/error-boundary` — the core `Breadcrumb` / `ErrorContextConfig` /
  `ErrorContextValue` types this layer consumes.
- `@granit/logger` — supplies the `Logger` passed to `GranitErrorBoundary` and
  `GlobalErrorCapture`; caught errors are reported through it.
- `react` (`^19`).

## Quick start

Mount the provider once near the root so caught errors are enriched with route,
user, and breadcrumbs. Add `GlobalErrorCapture` for unhandled `window` errors,
and wrap render trees in `GranitErrorBoundary`. The boundary is headless — you
supply the fallback through `renderFallback` (or use a ready-made page from
[`@granit/react-ui-error-boundary`](../react-ui-error-boundary)).

```tsx
import {
  ErrorContextProvider,
  GlobalErrorCapture,
  GranitErrorBoundary,
} from '@granit/react-error-boundary';
import { createLogger } from '@granit/logger';

const logger = createLogger('app');

function App({ children }: { children: React.ReactNode }) {
  return (
    <ErrorContextProvider
      config={{
        getRouteInfo: () => location.pathname,
        getUserInfo: () => ({ id: currentUserId }),
      }}
    >
      <GlobalErrorCapture logger={logger} />
      <GranitErrorBoundary
        logger={logger}
        renderFallback={(error, reset) => (
          <div role="alert">
            <p>Something went wrong: {error.message}</p>
            <button type="button" onClick={reset}>
              Try again
            </button>
          </div>
        )}
      >
        {children}
      </GranitErrorBoundary>
    </ErrorContextProvider>
  );
}
```

Record breadcrumbs from anywhere below the provider to give caught errors a
trail of preceding events (stored in a FIFO buffer, default 20 entries):

```tsx
import { useBreadcrumb } from '@granit/react-error-boundary';

function SaveButton() {
  const { addBreadcrumb } = useBreadcrumb();
  return (
    <button
      type="button"
      onClick={() => {
        addBreadcrumb('user', 'Clicked save');
        save();
      }}
    >
      Save
    </button>
  );
}
```

## Public API

| Symbol                    | Kind      | Purpose                                                                   |
| ------------------------- | --------- | ------------------------------------------------------------------------- |
| `GranitErrorBoundary`     | component | Class boundary; catches render errors, logs them, calls `renderFallback`  |
| `GlobalErrorCapture`      | component | Renders nothing; logs `window` `error` + `unhandledrejection` events      |
| `ErrorContextProvider`    | provider  | Supplies route/user/breadcrumb enrichment to the two components above     |
| `useErrorBoundaryConfig`  | hook      | Read the resolved `ErrorContextValue`; throws outside the provider        |
| `useBreadcrumb`           | hook      | `{ addBreadcrumb }` — append to the error context trail                   |
| `ErrorBoundaryProps`      | type      | `GranitErrorBoundary` props (`logger`, `renderFallback`, `onError?`)      |
| `GlobalErrorCaptureProps` | type      | `GlobalErrorCapture` props (`logger`, `onError?`)                         |
| `UseBreadcrumbReturn`     | type      | Shape returned by `useBreadcrumb`                                         |

`GranitErrorBoundary` and `GlobalErrorCapture` both work standalone: with no
`ErrorContextProvider` mounted, error enrichment is simply empty. The provider's
`config` (`getRouteInfo`, `getUserInfo`, `maxBreadcrumbs`) and the
`Breadcrumb` / `ErrorContextValue` shapes are re-exported from
[`@granit/error-boundary`](../error-boundary).

## Out of scope / caveats

- **No fallback UI.** `GranitErrorBoundary` is headless — it only logs and
  invokes `renderFallback`. The ready-made `ErrorFallback`, `ErrorPage`, and
  `NotFoundPage` (with localized `Errors.*` strings) live in
  [`@granit/react-ui-error-boundary`](../react-ui-error-boundary).
- **Render errors only.** A React error boundary catches errors thrown during
  render, lifecycle, and child commit; it does **not** catch errors in event
  handlers, `setTimeout`, async callbacks, or SSR. Those reach
  `GlobalErrorCapture` via the `window` listeners instead.
- **Global capture deduplicates by message** within a 1-second window, so a
  burst of identical errors is logged once; distinct messages always log.
- **User enrichment is minimal by design.** `getUserInfo` returns only an
  `{ id }`; do not widen it to carry PII into logs — the framework keeps the
  error context to a stable user identifier and breadcrumb categories.
- **Logging only — no transport.** This package writes through `@granit/logger`;
  shipping those records to a backend (OTLP, etc.) is the logger sink's job, not
  this package's.

## License

Apache-2.0
