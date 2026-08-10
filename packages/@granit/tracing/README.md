# @granit/tracing

Framework-agnostic **browser distributed tracing** core for OpenTelemetry — the
type contracts and the single pure helper that bridge the OTel Web SDK to the
rest of the Granit observability stack. It carries **no** React, DOM-rendering,
or Node-only dependency: it depends only on the OTel API and instrumentation
contracts, so it is safe to import from React, plain modules, workers, or tests.

This is the **core** layer. The two configuration types here (`TracingConfig`,
`TracingExporterConfig`) describe the shape consumed by `TracingProvider` in the
React layer, [`@granit/react-tracing`](../react-tracing), which owns the
`WebTracerProvider` bootstrap, auto-instrumentations (fetch / XHR /
document-load), the OTLP HTTP exporter, and the `useSpan` hook. There is no
`react-ui` admin feature kit and no backend counterpart — traces are emitted to
an OTLP collector, not to a Granit `.NET` module.

The one runtime export, `getTraceContext`, reads the active span's W3C trace and
span IDs from the OTel global context. Its primary consumer is
[`@granit/logger-otlp`](../logger-otlp), which calls it per log record to
correlate logs with traces (`createOtlpTransport({ getTraceContext })`).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. (Unlike
most source-direct packages, this one also ships a `tsup` build to
`npm.pkg.github.com` for external publication; in-repo consumers still resolve
the `src` barrel through the aliases.) A consumer must declare these peers:

- `@opentelemetry/api` (`^1.9.0`) — the `trace` / `context` global singletons
  `getTraceContext` reads from, and the source of the `TraceContext` IDs.
- `@opentelemetry/instrumentation` (`>=0.50.0`) — the `Instrumentation` type
  referenced by `TracingConfig.additionalInstrumentations`.

## Quick start

Use `getTraceContext` as the trace-correlation callback when wiring the OTLP log
transport — it returns the current trace/span IDs (or `undefined` when no span
is active) without pulling in any React or SDK bootstrap code:

```ts
import { createOtlpTransport } from '@granit/logger-otlp';
import { getTraceContext } from '@granit/tracing';

// Each log record is stamped with the active span's IDs for trace<->log
// correlation in the collector. Returns undefined outside an active span.
const transport = createOtlpTransport({
  endpoint: '/v1/logs',
  getTraceContext,
});
```

The `TracingConfig` type is the input contract for the React provider; the SDK
bootstrap and the actual `<TracingProvider>` JSX live in
[`@granit/react-tracing`](../react-tracing):

```ts
import type { TracingConfig } from '@granit/tracing';

// Shape passed to <TracingProvider config={...}> in @granit/react-tracing.
const config: TracingConfig = {
  serviceName: 'guava-front',
  serviceVersion: '1.4.0',
  exporter: { url: '/v1/traces' },
  instrumentFetch: true, // also instrumentXhr / instrumentDocumentLoad (default true)
};
```

## Public API

| Symbol                  | Kind | Purpose                                                                 |
| ----------------------- | ---- | ----------------------------------------------------------------------- |
| `getTraceContext`       | fn   | Active span's `{ traceId, spanId }` from OTel global, else `undefined`  |
| `TraceContext`          | type | W3C trace/span IDs (shared contract with `@granit/logger-otlp`)         |
| `TracingConfig`         | type | Full provider input: service/version, exporter, instrumentation toggles |
| `TracingExporterConfig` | type | OTLP HTTP exporter target: `{ url, headers? }`                          |

`getTraceContext` returns `undefined` not only when no span is active but also
when the active span context is missing a `traceId` or `spanId` (it never
returns a partially-populated `TraceContext`).

## Out of scope / caveats

- **No SDK bootstrap.** This package neither creates a `WebTracerProvider` nor
  registers instrumentations nor opens spans. That initialization, the OTLP
  trace exporter (including the collector-availability probe that disables export
  for the session when the endpoint is unreachable), and the `useSpan` hook all
  live in [`@granit/react-tracing`](../react-tracing).

- **Reads the global, never sets it.** `getTraceContext` only observes
  `@opentelemetry/api`'s global `trace`/`context` singletons. If no provider has
  registered a context manager, there is no active span and it returns
  `undefined` — it does not start one.

- **No backend module.** Spans are exported over OTLP to a collector; there is no
  `Granit.Tracing` .NET module and no `contracts/openapi/*.json` mirror.

## License

Apache-2.0
