# @granit/types

Cross-cutting **branded types** for the Granit framework — the compile-time
vocabulary every other package shares for identifiers, timestamps, timezones,
and currencies. Branding tags a plain `string` with a phantom property so the
type system tells `UserId` from `TenantId` (or an `ISODateString` from any old
string) while the runtime value stays an ordinary string with zero overhead —
the brand is erased during compilation.

This is a **framework-agnostic core** leaf: pure TypeScript, no React, no DOM,
no Node, no HTTP, no backend counterpart. It is the bottom of the dependency
graph — domain cores (`@granit/parties`, `@granit/authorization`, …) import
these brands to type their DTOs, and there is no React or `react-ui` layer above
it. Unlike most source-direct packages, `@granit/types` is **published**: it
ships a `tsup` build (`dist/` + `publishConfig`) to `npm.pkg.github.com` so it
can be consumed as a regular dependency, not only via Vite aliases.

## Install

Workspace-internal — inside the monorepo it resolves through the `@granit/*`
Vite/Vitest aliases like every other package. It has **no runtime
dependencies** and declares **no peer dependencies**: brands are types plus a
handful of identity-cast helpers, so nothing needs to be provided by the
consumer.

```ts
import type { EntityId, ISODateString } from '@granit/types';
```

## Quick start

Brands prevent argument-order bugs at compile time and mark string-typed DTO
fields as semantically meaningful. The `to*` helpers are unchecked identity
casts (assert at the boundary, then brand); the `is*` guards are **structural
only** — they verify a non-empty string, not the actual format.

```ts
import {
  isISODateString,
  toEntityId,
  toISODateString,
  toTimeZoneId,
} from '@granit/types';
import type { EntityId, ISODateString, TimeZoneId } from '@granit/types';

// Per-aggregate id brands derive from the generic EntityId<Brand>.
type InvoiceId = EntityId<'Invoice'>;

interface Invoice {
  id: InvoiceId;
  issuedAt: ISODateString;
  dueTimezone: TimeZoneId;
}

// Brand at the system boundary (API deserialization, URL params).
const invoice: Invoice = {
  id: toEntityId<'Invoice'>('inv-001'),
  issuedAt: toISODateString(new Date().toISOString()),
  dueTimezone: toTimeZoneId('Europe/Brussels'),
};

function getInvoice(tenantId: EntityId<'Tenant'>, invoiceId: InvoiceId) {
  /* … */
}

// Compile error: InvoiceId is not assignable to EntityId<'Tenant'> — the brand
// catches the inverted arguments that a bare `string` signature would accept.
// getInvoice(invoice.id, tenantId);

// Guards narrow `unknown` to a brand before you trust it (structural check).
function parse(raw: unknown): ISODateString | null {
  return isISODateString(raw) ? raw : null;
}
```

## Public API

| Symbol            | Kind | Purpose                                                        |
| ----------------- | ---- | -------------------------------------------------------------- |
| `EntityId<Brand>` | type | Branded `string` id, discriminated by an entity-name `Brand`   |
| `UserId`          | type | `EntityId<'User'>` — shared by identity, notifications, audit  |
| `TenantId`        | type | `EntityId<'Tenant'>` — shared by tenancy, payments, webhooks   |
| `CorrelationId`   | type | `EntityId<'Correlation'>` — distributed-tracing correlation id |
| `toEntityId`      | fn   | Unchecked cast `string → EntityId<Brand>` (caller asserts)     |
| `isEntityId`      | fn   | Structural guard: non-empty string → `EntityId<string>`        |
| `ISODateString`   | type | Branded ISO 8601 timestamp string (`"2024-12-31T23:59:59Z"`)   |
| `toISODateString` | fn   | Unchecked cast `string → ISODateString`                        |
| `isISODateString` | fn   | Structural guard: non-empty string → `ISODateString`           |
| `TimeZoneId`      | type | Branded IANA timezone string (`"Europe/Brussels"`)             |
| `toTimeZoneId`    | fn   | Unchecked cast `string → TimeZoneId`                           |
| `isTimeZoneId`    | fn   | Structural guard: non-empty string → `TimeZoneId`              |
| `CurrencyCode`    | type | ISO 4217 currency-code union (EU/EEA, majors, trading)         |

## Caveats

- **`to*` helpers do not validate.** They are identity casts that only attach a
  phantom brand. Validate format yourself (a real UUID, a parseable date, a
  legitimate IANA zone) *before* branding — the brand asserts intent, not
  correctness.
- **`is*` guards are structural, not format checks.** Each returns `true` for
  any non-empty string and `false` for empty strings or non-strings. They guard
  the "is this even a string" boundary; they do **not** prove the value is a
  valid id / ISO date / IANA timezone. An invalid IANA string, for example,
  fails silently at runtime (`TZDate` falls back to UTC) — the brand makes that
  class of error visible at call sites, but the guard will not catch a malformed
  one.
- **`EntityId` brands are nominal by name, structural underneath.** Two
  `EntityId<'Invoice'>` aliases declared independently are interchangeable
  (same brand string), but `EntityId<'Invoice'>` and `EntityId<'Tenant'>` are
  not — pick brand strings that match the entity name to keep ids from crossing.
- **`CurrencyCode` is a curated union, not the full ISO 4217 list.** It covers
  EU/EEA currencies, the major globals, and common trading partners. Extend the
  union in `src/currency-code.ts` when a module needs a code not yet listed.

## License

Apache-2.0
