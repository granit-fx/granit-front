# @granit/utils

Tiny, framework-agnostic **utility belt** for Digital Dynamics apps: Tailwind CSS
class merging, locale/timezone-aware date and number formatting, and URL-scheme
safety guards. No React, no DOM-write side effects, no backend contract — just
pure helpers and a couple of frozen scheme allow-lists.

This is a leaf **core** package: it depends only on small, well-known npm
peers (`clsx`, `tailwind-merge`, `date-fns`, `@date-fns/tz`) and is consumed
directly by almost every other `@granit/*` package and by the showcase apps.
There is no `react-utils` hooks layer and no `react-ui-utils` feature kit — the
helpers are intentionally environment-neutral and ship as a single barrel.
Unlike most source-direct packages it is a **published** exception (`tsup` →
`dist/`, `npm.pkg.github.com`) so external consumers can depend on the built
artifact.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases (source) or
the published `dist/` build. A consumer must declare these peers:

- `clsx` (`^2`) — conditional class-name composition behind `cn`.
- `tailwind-merge` (`^3`) — resolves conflicting Tailwind utilities in `cn`.
- `date-fns` (`^4`) — formatting (`format`, `formatDistanceToNow`) and the
  optional `Locale` argument.
- `@date-fns/tz` (`^1`) — `TZDate` for IANA-timezone conversion in the date
  formatters.

## Quick start

```ts
import {
  cn,
  formatDate,
  formatDateTime,
  formatTimeAgo,
  formatNumber,
  calculatePercentage,
  isSafeUrl,
  assertSafeUrl,
  LINK_URL_SCHEMES,
} from '@granit/utils';

// Tailwind-aware class merge: later conflicting utilities win.
const className = cn('px-2 py-1', isActive && 'bg-primary', 'px-4'); // → "py-1 bg-primary px-4"

// Locale + timezone-aware formatting (both args optional).
formatDate('2026-02-27T13:30:00Z', 'Europe/Brussels');     // "February 27, 2026"
formatDateTime('2026-02-27T13:30:00Z', 'Europe/Brussels'); // "February 27, 2026 14:30:00"
formatTimeAgo('2026-02-27T11:30:00Z');                     // "2 hours ago"

formatNumber(1234567.89, { maximumFractionDigits: 2 }, 'fr-FR'); // "1 234 567,89"
calculatePercentage(3, 7, 1);                                    // 42.9 (0 when total is 0)

// Guard a server-controlled URL before it reaches a DOM sink.
if (isSafeUrl(link.href, LINK_URL_SCHEMES)) {
  /* render <a href={link.href}> */
}
const target = assertSafeUrl(redirectUrl); // throws on javascript:/data:///evil.com
globalThis.location.assign(target);
```

## Public API

| Symbol                | Kind  | Purpose                                                         |
| --------------------- | ----- | --------------------------------------------------------------- |
| `cn`                  | fn    | Merge Tailwind classes (`clsx` + `tailwind-merge`)              |
| `formatNumber`        | fn    | `Intl.NumberFormat` wrapper (optional options + locale)         |
| `formatDate`          | fn    | Long date (`PPP`), optional IANA timezone + `date-fns` `Locale` |
| `formatDateTime`      | fn    | Date + `HH:mm:ss`, optional timezone + locale                   |
| `formatTimeAgo`       | fn    | Relative distance ("2 hours ago"), optional timezone + locale   |
| `calculatePercentage` | fn    | `value/total` percent; `decimals` rounding; `0` when `total` 0  |
| `isSafeUrl`           | fn    | `true` if relative or scheme in `allowedSchemes`; rejects `//`  |
| `assertSafeUrl`       | fn    | Returns input if safe, else throws — gate before DOM sinks      |
| `NAV_URL_SCHEMES`     | const | `Set` allow-list for full-page navigation (`http:`/`https:`)    |
| `LINK_URL_SCHEMES`    | const | `Set` allow-list for anchor `href` (`+ mailto:`/`tel:`)         |

The date formatters accept `string | Date`; passing a `timezone` converts via
`TZDate` first, and passing a `date-fns` `Locale` localizes the output.

## Security caveats

- **URL safety is an input filter, not output encoding.** `isSafeUrl` /
  `assertSafeUrl` exist to guard `location.href = …`, `<a href={…}>` and similar
  DOM sinks against server-controlled URLs carrying dangerous schemes
  (`javascript:`, `data:`, `vbscript:`, …). They normalize backslashes and reject
  protocol-relative URLs (`//evil.com`, `/\evil.com`) which would otherwise
  inherit the current scheme and redirect off-origin. They do **not** sanitize
  HTML — use a Trusted-Types policy / proper escaping for innerHTML-style sinks.
- **Same-origin relative URLs always pass.** Any input starting with a single
  `/` (after backslash normalization) is treated as same-origin and accepted
  regardless of `allowedSchemes`; only absolute URLs are scheme-checked.
- **Default allow-list is navigation-grade.** Both guards default to
  `NAV_URL_SCHEMES` (`http:`/`https:` only). Pass `LINK_URL_SCHEMES` explicitly
  when validating anchor hrefs that legitimately use `mailto:`/`tel:`.

## Out of scope

- **React bindings** — these helpers are environment-neutral; there is no
  `react-utils` hooks layer. Import them directly from React components.
- **HTML sanitization / Trusted Types** — URL guards filter schemes only; DOM
  script-sink protection lives in the package that writes the sink (see
  `pnpm check:csp` and per-package `<pkg>/csp` subpaths).
- **Currency/unit formatting beyond `Intl`** — `formatNumber` is a thin
  `Intl.NumberFormat` pass-through; richer domain formatting belongs in the
  consuming package.

## License

Apache-2.0
