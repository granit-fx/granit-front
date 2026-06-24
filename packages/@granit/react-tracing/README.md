# @granit/react-tracing

React bindings for browser **distributed tracing** — a `TracingProvider` that
boots an OpenTelemetry `WebTracerProvider` with OTLP-over-HTTP export and
auto-instrumentation, plus hooks to read the live `Tracer` and open custom
spans. This is the **React provider + hooks layer**: it wraps the
framework-agnostic config types and helpers from
[`@granit/tracing`](../tracing) and turns them into context + hooks. It holds no
rendering surface and no admin UI.

Tracing has no Granit backend module — spans are shipped to an OTLP collector
(e.g. an OpenTelemetry Collector / Tempo / Jaeger HTTP endpoint), not to a
`Granit.*` API. The sibling split is two packages plus a logging companion:

- [`@granit/tracing`](../tracing) — framework-agnostic core: `TracingConfig` /
  `TracingExporterConfig` config shapes and `getTraceContext()` (extract the
  active W3C `traceId` / `spanId`). No React, DOM, or Node dependency.
- `@granit/react-tracing` (this package) — `TracingProvider` + `useSpan` /
  `useTracingConfig`.
- [`@granit/logger-otlp`](../logger-otlp) — shares the same `TraceContext` so log
  records correlate with the active span. There is no `react-ui-tracing` kit.

Like [`@granit/csp`](../csp), this package ships a `tsup` build (`dist/` +
`publishConfig` to `npm.pkg.github.com`) rather than staying source-direct.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers (all already required transitively by the OTel SDK):

- `@granit/tracing` — the core `TracingConfig` / `TracingExporterConfig` shapes
  passed into the provider.
- `@granit/logger` — `createLogger`; the provider warns through it when the
  collector is unreachable.
- `react` (`^19`).
- `@opentelemetry/api` (`^1.9`) — the `Tracer` / `Span` surface returned by the
  hooks.
- The OTel web SDK set: `@opentelemetry/sdk-trace-web`,
  `@opentelemetry/context-zone`, `@opentelemetry/resources`,
  `@opentelemetry/semantic-conventions`,
  `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/instrumentation`
  and the three auto-instrumentations (`-fetch`, `-xml-http-request`,
  `-document-load`).

## Quick start

Mount `TracingProvider` once at the app root with a `TracingConfig`; the OTel
provider, exporter, and auto-instrumentations boot synchronously on first
render and flush on unmount. Call the hooks anywhere below it.

```tsx
import { TracingProvider, useSpan } from '@granit/react-tracing';

function Root({ children }: { children: React.ReactNode }) {
  return (
    <TracingProvider
      config={{
        serviceName: 'guava-front',
        serviceVersion: '1.4.0',
        exporter: { url: '/v1/traces', headers: { 'X-Tenant-Id': tenantId } },
        // instrumentFetch / instrumentXhr / instrumentDocumentLoad default to true
      }}
    >
      {children}
    </TracingProvider>
  );
}

function SaveButton({ invoiceId, data }: { invoiceId: string; data: unknown }) {
  const { withSpan } = useSpan();

  const handleSave = () =>
    // The span auto-ends on resolve/reject; exceptions are recorded and the
    // span status is set to ERROR before re-throwing.
    withSpan('save-invoice', async (span) => {
      span.setAttribute('invoice.id', invoiceId);
      await fetch('/invoices', { method: 'POST', body: JSON.stringify(data) });
    });

  return <button type="button" onClick={handleSave}>Save</button>;
}
```

`useSpan()` also exposes `createSpan(name, options?)` for manual lifetimes — you
own `span.end()` in that case. To read the raw `Tracer` (e.g. to bridge into a
non-React library), call `useTracingConfig()`.

## Public API

| Symbol                 | Kind     | Purpose                                                           |
| ---------------------- | -------- | ----------------------------------------------------------------- |
| `TracingProvider`      | provider | Boots `WebTracerProvider` + OTLP exporter + auto-instrumentations |
| `useSpan`              | hook     | `{ withSpan, createSpan }` helpers for custom spans               |
| `useTracingConfig`     | hook     | The active OTel `Tracer`; throws outside a `TracingProvider`      |
| `TracingProviderProps` | type     | `{ config: TracingConfig; children }`                             |
| `UseSpanReturn`        | type     | Shape returned by `useSpan` (`withSpan` / `createSpan`)           |

`useSpan().withSpan(name, fn)` runs `fn` inside the span's active context
(`context.with`), so any `fetch` / XHR it issues nests under the span; it sets
`SpanStatusCode.OK` on success, records the exception and sets
`SpanStatusCode.ERROR` on throw, and always calls `span.end()` in `finally`.
`createSpan` returns an un-activated span you must `end()` yourself.

The `config` shape (`serviceName`, `serviceVersion`, `exporter`,
`instrumentFetch` / `instrumentXhr` / `instrumentDocumentLoad`,
`additionalInstrumentations`) is `TracingConfig`, owned by
[`@granit/tracing`](../tracing).

## Out of scope / caveats

- **Gated exporter — fail-soft, not fail-loud.** On the first export the
  provider probes the OTLP `url` with an empty payload. If the collector is
  unreachable or returns non-2xx, it logs a single `logger.warn` and disables
  export for the rest of the session — so a missing collector does **not** spam
  the console with repeated 500s. There is no automatic retry once disabled;
  reload to re-probe.
- **Config is read once.** The `Tracer` is created on first render via a ref and
  the provider shuts down only on unmount. Changing `config` props after mount
  has no effect — give the provider a stable config (remount, e.g. via `key`, to
  re-boot with new settings).
- **Global OTel registration.** `provider.register()` installs a process-global
  tracer provider and context manager (`ZoneContextManager`). Mount exactly one
  `TracingProvider` per app; nesting or remounting competes for the same global.
- **No PII in span data.** Span names and attributes are exported off-origin to
  the collector. Do not put tokens, personal data, or secrets in span names or
  attribute values, and scope `exporter.headers` to what the collector needs.
- **No rendering and no admin UI.** This package is headless; there is no
  `react-ui-tracing` feature kit.
- **No Granit backend.** Traces target an OTLP collector, not a `Granit.*`
  endpoint — there is no `contracts/openapi` module for this package.

## License

Apache-2.0
