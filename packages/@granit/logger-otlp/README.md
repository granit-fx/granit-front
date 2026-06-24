<img src="https://granit-fx.dev/images/granit-icon.svg" alt="" height="32" align="left" style="margin-right:10px" />

# @granit/logger-otlp

OTLP HTTP transport for [`@granit/logger`](../logger) — batches log entries and
ships them to an OpenTelemetry collector (Grafana Alloy, .NET Aspire Dashboard,
or any OTLP/HTTP-JSON endpoint) as `resourceLogs`.

This is the framework-agnostic **core** layer: a single transport factory plus
the default PII scrubber. It has **no** React, DOM-framework or backend-domain
dependency, only `@granit/logger` for the `LogTransport` / `LogEntry` contract,
and it runs anywhere `fetch` is available (browser, edge, Node). There is no
`react-logger-otlp` hooks layer and no `react-ui` admin kit — apps wire the
transport once at logger-construction time. Sibling observability packages:
[`@granit/logger`](../logger) (the logger core), [`@granit/tracing`](../tracing)
and [`@granit/react-tracing`](../react-tracing) (the distributed-tracing
counterpart whose span context feeds the `getTraceContext` correlation hook).

Unlike most `@granit/*` packages this one is **published** (`tsup` build →
`dist/`, `publishConfig` → `npm.pkg.github.com`) rather than source-direct, so
deployments can consume it without the workspace.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
the single peer:

- [`@granit/logger`](../logger) — supplies the `LogTransport` interface this
  factory implements and the `createLogger` that accepts it.

## Quick start

Build the transport once and pass it to `createLogger` alongside (or instead of)
the default console transport. The logger drives `send` on every entry and
auto-flushes on `beforeunload`.

```ts
import { createLogger, createConsoleTransport } from '@granit/logger';
import { createOtlpTransport } from '@granit/logger-otlp';

const otlp = createOtlpTransport({
  endpoint: '/v1/logs', // Vite proxy in dev, full collector URL in prod
  serviceName: 'guava-front',
  serviceVersion: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.PROD ? 'production' : 'development',
  // Correlate log records with the active trace/span (optional).
  getTraceContext: () => activeSpan && { traceId: activeSpan.traceId, spanId: activeSpan.spanId },
  // PII redaction is ON by default (defaultPiiRedactor); see caveats below.
});

const logger = createLogger('checkout', {
  transports: [createConsoleTransport(), otlp],
});

logger.info('order placed', { orderId, amount }); // batched, redacted, exported
```

Entries buffer until `batchSize` (default `10`) is reached or `flushInterval`
elapses (default `5000` ms), then POST as one OTLP/HTTP-JSON payload with
`keepalive: true`. If the collector responds non-2xx or is unreachable, export
**self-disables for the session** (one `console.warn`, no retry storm) — logging
to the other transports continues unaffected.

To extend the baseline scrubber or opt out entirely, pass `redact`:

```ts
import { createOtlpTransport, defaultPiiRedactor } from '@granit/logger-otlp';

createOtlpTransport({
  endpoint: '/v1/logs',
  serviceName: 'guava-front',
  redact: (text) => defaultPiiRedactor(text).replace(/\bDOSSIER-\d+\b/g, 'DOSSIER-***'),
});
// redact: (s) => s  →  explicit opt-out (NOT recommended — see GDPR note)
```

## Public API

| Symbol                 | Kind | Purpose                                                           |
| ---------------------- | ---- | ----------------------------------------------------------------- |
| `createOtlpTransport`  | fn   | Build a batching `LogTransport` that exports to an OTLP collector  |
| `OtlpTransportOptions` | type | Factory config (endpoint, service identity, batching, redact)     |
| `TraceContext`         | type | `{ traceId, spanId }` from `getTraceContext` for correlation      |
| `defaultPiiRedactor`   | fn   | Built-in PII scrubber (the default `redact`); composable/reusable |

`OtlpTransportOptions` fields: `endpoint` and `serviceName` are required;
`serviceVersion`, `environment`, `headers`, `batchSize`, `flushInterval`,
`getTraceContext` and `redact` are optional. `service.*` and
`deployment.environment` land on the OTLP `resource`; everything else maps to
log-record attributes.

## Redaction (GDPR by default)

`defaultPiiRedactor` is applied to the log body and **every** attribute value
before serialization — protection by default per GDPR Art. 25 (security audit
VULN-205). It is defense-in-depth: it catches PII that leaks through paths the
call site cannot reach (`err.response.data`, `err.config.url`, Axios stack
traces). Built-in patterns, each masked to a non-reversible stub:

- **Email** — keeps up to 3 local chars + domain (`joh***@acme.com`).
- **`Bearer` tokens** and raw **JWTs** (`eyJ…` triple-segment) — head/tail only.
- **IBAN** — first 4 chars + `***`.
- **Credit card** — 13–19 digits, **Luhn-validated** to limit false positives on
  long numeric IDs, masked to last 4.
- **E.164 phone** (`+` + 8–15 digits) — head/tail only.

Order is deliberate (token/JWT before email). The function is pure, returns the
input unchanged when nothing matches, and is cheap enough to run on every
attribute.

## Out of scope / caveats

- **Logs only.** This is the OTLP **logs** signal. Distributed tracing lives in
  [`@granit/tracing`](../tracing) / [`@granit/react-tracing`](../react-tracing);
  this package merely stamps `traceId` / `spanId` onto records via
  `getTraceContext` so the collector can correlate the two.
- **Raw `fetch`, by design.** Telemetry sits *below* the `@granit/api-client`
  Axios stack (sanctioned infra), so it must not pull CSRF/auth/tenant
  interceptors. Do not route exports through the domain Axios client.
- **Self-disabling, not resilient.** On the first failed POST, export stops for
  the session — there is no retry, dead-letter queue or backpressure. Sizing the
  collector and proxy is the deployment's responsibility.
- **String attributes only.** OTLP attribute values are emitted as
  `stringValue`; objects/arrays in `context` are JSON-serialized (not nested
  OTLP `kvlist` / `arrayValue`), and `severityNumber` follows the OpenTelemetry
  logs data model (`DEBUG 5 / INFO 9 / WARN 13 / ERROR 17`).
- **Opting out of `redact` is a GDPR risk.** `redact: (s) => s` ships raw bodies
  and attributes to the collector — only do so for a sink you fully control and
  that applies its own minimisation.

## Documentation

See the [full documentation](https://granit-fx.dev/frontend/observability/logger/).
Part of the [Granit](https://granit-fx.dev) framework.

## License

Apache-2.0
