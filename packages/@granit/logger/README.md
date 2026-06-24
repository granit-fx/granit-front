# @granit/logger

Configurable **logger factory** (`createLogger`) for Digital Dynamics
applications — the canonical logging entry point the whole framework is required
to use instead of raw `console.*` (enforced by `@granit/arch-tests`). Part of the
[Granit](https://granit-fx.dev) framework.

This is the framework-agnostic **core** layer: a tiny, dependency-free logger
with pluggable transports and a set of PII-redaction helpers. It holds **no**
React, no DOM-only and no Node-only dependency — it degrades gracefully in any
runtime (the `beforeunload` flush hook is feature-detected). The OpenTelemetry
transport that ships logs to a collector lives in the sibling package
[`@granit/logger-otlp`](../logger-otlp) (`createOtlpTransport`); there is no
`react-logger` hooks layer — a `Logger` is plain and can be created anywhere. The
redaction helpers mirror the .NET `Granit.Diagnostics.LogRedaction` static class
so masked values are consistent across the front and back ends.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases (source
direct), and published to `npm.pkg.github.com` via `tsup` for out-of-workspace
consumers. It has **no peer dependencies**: the default console transport uses
the platform `console`, and the optional `beforeunload` flush listener is
feature-detected on `globalThis`.

The log level is auto-resolved from Vite's `import.meta.env.DEV` (`DEBUG` in dev,
`WARN` in prod) unless you pass an explicit `level`.

## Quick start

```ts
import { createLogger, redact } from '@granit/logger';

// One logger per module; the prefix is rendered as a styled console badge.
const log = createLogger('Checkout');

log.info('Cart opened', { itemCount: 3 });
log.warn('Coupon expired', { code: 'SUMMER' });

try {
  await placeOrder();
} catch (error) {
  // error is a dedicated 2nd arg; arbitrary context is the 3rd.
  log.error('Order failed', error, { userEmail: redact.email(email) });
}

// Derive a child logger — the sub-prefix is appended, level + transports shared.
const paymentLog = log.child('Payment'); // prefix: "Checkout Payment"
paymentLog.debug('Tokenizing card');
```

Wiring a non-default transport (for example the OTLP transport from the sibling
package) is done once, at app bootstrap, and propagates to every `child`:

```ts
import { createConsoleTransport, createLogger } from '@granit/logger';
import { createOtlpTransport } from '@granit/logger-otlp';

const root = createLogger('App', {
  level: 'INFO',
  transports: [createConsoleTransport(), createOtlpTransport({ /* … */ })],
});
```

## Public API

| Symbol                   | Kind  | Purpose                                                          |
| ------------------------ | ----- | ---------------------------------------------------------------- |
| `createLogger`           | fn    | Build a `Logger` for a prefix; resolves level + console default  |
| `Logger`                 | type  | `debug` / `info` / `warn` / `error(msg, err?, ctx?)` / `child`   |
| `LoggerOptions`          | type  | `{ level?, transports? }` passed to `createLogger`               |
| `LogLevel`               | const | `{ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }` (numeric thresholds)  |
| `LogLevelName`           | type  | `'DEBUG' \| 'INFO' \| 'WARN' \| 'ERROR'`                         |
| `LogLevelValue`          | type  | The numeric value of a level (`0 \| 1 \| 2 \| 3`)                |
| `LogContext`             | type  | `Record<string, unknown>` structured per-call context           |
| `LogEntry`               | type  | The dispatched record a transport receives                       |
| `LogTransport`           | type  | `{ send(entry), flush?(): Promise<void> }` sink contract         |
| `createConsoleTransport` | fn    | Built-in styled-badge `console` transport (the default)          |
| `redact`                 | const | Aggregate of the redactors, mirroring .NET `LogRedaction`        |
| `redactEmail`            | fn    | `joh***@example.com` — keeps ≤3 leading chars + domain           |
| `emailDomain`            | fn    | Bounded, non-PII domain tag (`example.com`)                      |
| `redactPhone`            | fn    | Keeps country prefix + last 2 digits (`+336*****78`)             |
| `redactToken`            | fn    | Keeps 4-char prefix + 3-char suffix (`dLkj...fGh`)               |
| `redactIpAddress`        | fn    | Masks IPv4 to /24 (`192.168.1.***`), truncates IPv6              |
| `redactUsername`         | fn    | Keeps a 3-char prefix (`joh***`)                                 |
| `hashPrefix`             | fn    | `async` SHA-256[:4] (8 hex) correlation tag, non-reversible      |

## Transports

A transport implements `send(entry)` and an optional `async flush()`. Every
transport that exposes `flush` is auto-registered against a single shared
`beforeunload` listener, so buffered entries are drained on page unload without
each transport wiring its own handler. The default `createConsoleTransport`
renders the level, prefix and message as styled `%c` console badges, appends the
`error` only for `ERROR` entries, and appends `context` when present.

## Caveats

- **Redact PII at the call-site.** The transports do **not** scrub anything —
  passing a raw email/phone/token into `context` ships it verbatim to the
  console and to any OTLP collector. Wrap PII with the `redact.*` helpers
  (GDPR Art. 5, ISO 27001 A.5.34) before it enters a `LogContext`.
- **Redaction is one-way and best-effort.** The helpers keep small prefixes for
  correlation; they are masking, not anonymisation. Use `hashPrefix` when even a
  prefix must not be stored — it is `async` (Web Crypto `subtle.digest`).
- **Level is resolved once, at creation.** `createLogger` snapshots the effective
  level (explicit `level` ?? `import.meta.env.DEV` heuristic); changing the
  environment afterwards does not re-evaluate it. `child` inherits the resolved
  level and the same transport array.
- **`console` is allowed here only.** This package is the single sanctioned
  wrapper around `console`; application and other framework code must call
  `createLogger`, never `console.*` directly (`@granit/arch-tests`).

## Out of scope

- **OTLP / OpenTelemetry export** — lives in [`@granit/logger-otlp`](../logger-otlp)
  (`createOtlpTransport`, trace-context propagation, default PII redactor).
- **React integration** — a `Logger` is plain and runtime-agnostic; there is no
  `@granit/react-logger`. Create one per module at import time.

## License

Apache-2.0
