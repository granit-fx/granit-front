# @granit/react-ui-error-boundary

Visible error UI for Granit admin apps — the fallback, route-error and
not-found pages that pair with the headless
[`@granit/react-error-boundary`](../react-error-boundary).

The headless package owns the _mechanism_ (`GranitErrorBoundary` catches render
errors and delegates UI via `renderFallback`); this package owns the _pages_.

## Components

- **`ErrorFallback`** — rendered by a boundary's `renderFallback`; shows the
  error, a retry button, and (in dev) a copyable detail block.
- **`ErrorPage`** — a React Router `errorElement`; distinguishes 404 from other
  route errors and links back home.
- **`NotFoundPage`** — a standalone 404 page.

Each page is app-agnostic:

- pass an optional `layout` slot (e.g. your public/centered layout) — without
  it the page renders bare;
- `ErrorPage` accepts an `onError` callback so the host can log via its own
  logger;
- the `Errors.*` strings ship in `errorBoundaryTranslationsEn` /
  `errorBoundaryTranslationsFr`; register them in your i18n instance.

## Usage

```tsx
import { GranitErrorBoundary } from '@granit/react-error-boundary';
import { ErrorFallback } from '@granit/react-ui-error-boundary';

<GranitErrorBoundary
  renderFallback={(error, reset) => (
    <ErrorFallback error={error} onReset={reset} layout={PublicLayout} />
  )}
>
  <App />
</GranitErrorBoundary>;
```
