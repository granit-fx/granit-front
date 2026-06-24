# @granit/react-ui-error-boundary

Visible **error UI** for Granit admin apps — the fallback, route-error and
not-found pages that pair with the headless
[`@granit/react-error-boundary`](../react-error-boundary). This is the
**react-ui admin feature kit** layer: it holds rendering only (shadcn `Button`,
`lucide-react` icons, Tailwind classes) and ships its own `Errors.*`
translations; it owns no boundary mechanism, no context and no HTTP. There is no
backend counterpart — error UI is purely presentational.

The split is three packages over the same error-handling concern:

- [`@granit/error-boundary`](../error-boundary) — framework-agnostic core: the
  `Breadcrumb` / `ErrorContextConfig` / `ErrorContextValue` context types.
- [`@granit/react-error-boundary`](../react-error-boundary) — headless React
  mechanism: `GranitErrorBoundary` (catches render errors, logs via
  `@granit/logger`, delegates UI through its `renderFallback` slot),
  `GlobalErrorCapture`, the `ErrorContextProvider` and `useBreadcrumb`.
- `@granit/react-ui-error-boundary` (this package) — the visible pages that plug
  into the slots above.

The headless package owns the _mechanism_; this package owns the _pages_.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-ui` — the shadcn `Button` the pages render.
- `@granit/react-localization` — `useTranslation`, the i18n hook the pages call.
- `lucide-react` (`^1.21`) — the `AlertTriangle` / `ServerCrash` / `Copy` icons.
- `react-router-dom` (`^7.18`) — `ErrorPage` reads `useRouteError`, both
  navigating pages use `Link`.
- `react` and `react-dom` (`^19`).

## Quick start

`ErrorFallback` plugs into the headless boundary's `renderFallback` slot;
`ErrorPage` is a React Router `errorElement`. Each page takes an optional
`layout` slot — without it the page renders bare — so the host owns the public /
centered chrome.

```tsx
import { GranitErrorBoundary } from '@granit/react-error-boundary';
import { ErrorFallback } from '@granit/react-ui-error-boundary';

function Root({ children }: { children: React.ReactNode }) {
  return (
    <GranitErrorBoundary
      logger={logger}
      renderFallback={(error, reset) => (
        <ErrorFallback
          error={error}
          onReset={reset}
          layout={PublicLayout}
          showErrorDetail={import.meta.env.DEV}
        />
      )}
    >
      {children}
    </GranitErrorBoundary>
  );
}
```

Register the bundled strings once in your i18n instance — the flat dotted
`Errors.*` keys are looked up verbatim (key separators disabled), and as a
React Router `errorElement`, `ErrorPage` logs through the host's logger via
`onError`:

```tsx
import { createBrowserRouter } from 'react-router-dom';
import {
  ErrorPage,
  errorBoundaryTranslationsEn,
  errorBoundaryTranslationsFr,
} from '@granit/react-ui-error-boundary';

i18n.addResourceBundle('en', 'translation', errorBoundaryTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', errorBoundaryTranslationsFr, true, true);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    errorElement: <ErrorPage layout={PublicLayout} onError={logger.error} />,
    // children…
  },
]);
```

## Public API

| Symbol                        | Kind      | Purpose                                                         |
| ----------------------------- | --------- | --------------------------------------------------------------- |
| `ErrorFallback`               | component | Boundary `renderFallback` UI: message, retry, dev detail block  |
| `ErrorPage`                   | component | Router `errorElement`: splits 404 from other errors, links home |
| `NotFoundPage`                | component | Standalone 404 page                                             |
| `ErrorFallbackProps`          | type      | `{ error, onReset, layout?, showErrorDetail? }`                 |
| `ErrorPageProps`              | type      | `{ layout?, onError?, showErrorDetail? }`                       |
| `NotFoundPageProps`           | type      | `{ layout? }`                                                   |
| `errorBoundaryTranslationsEn` | const     | English `Errors.*` resource bundle                              |
| `errorBoundaryTranslationsFr` | const     | French `Errors.*` resource bundle                               |

`ErrorFallback` takes the caught `error` plus the boundary's `onReset`;
`ErrorPage` reads the route error itself via `useRouteError` (no `error` prop)
and distinguishes a 404 (`AlertTriangle`, back-home link) from a server error
(`ServerCrash`). The translation bundles are named with the `errorBoundary`
prefix to avoid colliding with other packages' translation symbols.

## Caveats

- **`showErrorDetail` exposes the raw error.** When `true`, `ErrorFallback` and
  `ErrorPage` render a copyable block containing `error.toString()` /
  `error.message` (or the route `statusText`). Gate it on the host's dev flag —
  do not surface stack/error detail to end users in production.
- **`layout` is opt-in, not a default.** Omitting it renders the page bare with
  no surrounding chrome; pass your public/centered layout for a finished screen.
- **i18n strings are flat dotted keys.** The host must register the bundles in
  the `translation` namespace with key separators disabled (the `deep`/`overwrite`
  flags in `addResourceBundle`), otherwise the dotted `Errors.*` keys are not
  resolved verbatim.

## Out of scope

- **The boundary mechanism** — catching render errors, logging, the `reset`
  callback, global `window.error`/`unhandledrejection` capture and breadcrumb
  context all live in [`@granit/react-error-boundary`](../react-error-boundary).
- **Context types** — `Breadcrumb` / `ErrorContextConfig` / `ErrorContextValue`
  are owned by the framework-agnostic [`@granit/error-boundary`](../error-boundary).
- **HTTP / backend** — this package issues no requests and has no `.NET`
  counterpart; it is purely presentational.

## License

Apache-2.0
