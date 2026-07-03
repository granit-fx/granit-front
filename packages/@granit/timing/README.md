# @granit/timing

Framework-agnostic **calendar-token resolution** for the Granit framework — the
JS/TS counterpart of the backend `Granit.Timing` assembly. Pure TypeScript, no
React, no DOM, no HTTP.

It owns:

- **`resolvePeriodToken`** — expands a named token (`last_30d`, `mtd`, `pw`,
  `today`, …) into absolute `[from, to)` bounds, mirroring
  `Granit.Timing.PeriodResolver` so a window resolved on the client (display,
  preview, shift arrows) matches what the server resolves for the same token.
- **`Weekday`** — the `0 = Sunday … 6 = Saturday` index shared by the resolver
  and the React first-day-of-week hook.

The `TimeZoneId` brand lives in [`@granit/types`](../types) (the shared brand
vocabulary) and is re-exported here for convenience, since the resolver's API
speaks it.

## Install

Workspace-internal — inside the monorepo it resolves through the `@granit/*`
Vite/Vitest aliases like every other package. It depends on `@granit/types` for
the `TimeZoneId` brand; `@date-fns/tz` is an **optional** peer dependency, only
pulled in on the timezone-aware code path.

```ts
import { resolvePeriodToken, toTimeZoneId } from '@granit/timing';
```

## Timezone semantics

- Sub-day rolling tokens (`last_5m` … `last_24h`) resolve to `[now - duration,
now)` in absolute instants — timezone-independent.
- Calendar tokens are day-aligned in the local day of the supplied `timeZone`,
  then converted back to UTC **DST-correctly** (a "day" spans 23/24/25 h across
  a transition). `wtd` / `pw` honour `weekStartsOn`; month/year arithmetic
  clamps to the target month's last day like .NET `AddMonths` / `AddYears`.
- **Without** a `timeZone` the resolver is pure UTC — byte-for-byte identical to
  the historical behaviour, so it is safe as a drop-in default.

```ts
// Local day of Asia/Tokyo, DST-correct, mirroring the backend resolver.
resolvePeriodToken('today', {
  now: new Date('2026-07-03T20:00:00Z'),
  timeZone: toTimeZoneId('Asia/Tokyo'),
});
// → { from: 2026-07-03T15:00:00Z, to: 2026-07-04T15:00:00Z }
```
