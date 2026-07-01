# @granit/csp

**Content Security Policy + Trusted Types** infrastructure for Granit apps —
the shared compartment registry that every framework package builds its scoped
DOM-sink policy on top of. Framework-agnostic **tooling**: no React, no domain
HTTP, no backend counterpart. It runs in the browser (policy install) and on
the server (directive builder for the BFF / Vite CSP header).

The model is least-privilege by default. The core `granit` policy **refuses
every DOM sink** — the framework itself never assigns to `innerHTML`,
`outerHTML` or `iframe.src`. A package that genuinely needs a sink (Leaflet
popups, the Keycloak silent-renew iframe, …) ships its own narrowly scoped
policy under a `<pkg>/csp` subpath and registers it here at install time. The
`trusted-types` directive is then derived from exactly the policies the app
installed — narrow by default, no opaque catch-all. The two scoped providers
that exist today are [`@granit/react-ui-map`](../react-ui-map) (`granit-map`) and
[`@granit/react-authentication-keycloak`](../react-authentication-keycloak)
(`granit-keycloak`); the convention is enforced by `pnpm check:csp`
(`scripts/check-csp-policies.mjs`).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. No
runtime peer dependencies; the package only touches the global `trustedTypes`
factory when present. The published build (`tsup` → `dist/`,
`npm.pkg.github.com`) ships the same `.` and `./testing` entry points.

## Quick start

Install the core policy once at app bootstrap, before any framework code
renders. Each scoped-policy provider installs itself the same way:

```ts
import { installPolicy as installCore } from '@granit/csp';
import { installPolicy as installMap } from '@granit/react-ui-map/csp';

installCore(); // 'granit' — refuses all sinks; throws loudly if misused
installMap(); // 'granit-map' — registers itself in the shared registry

// Idempotent and SSR-safe: a second call returns 'already-installed', and on a
// browser/runtime without Trusted Types it returns { status: 'unsupported' }.
```

Server-side (BFF response header or Vite dev middleware), build the
`trusted-types` directive from the policies actually installed:

```ts
import { getCspTrustedTypesDirective } from '@granit/csp';

res.setHeader(
  'Content-Security-Policy',
  `require-trusted-types-for 'script'; trusted-types ${getCspTrustedTypesDirective()};`
);
// e.g. "granit granit-map" — or "'none'" when no policy is installed, which
// blocks every sink under require-trusted-types-for 'script'.
```

To register a brand-new scoped policy from another package, wrap
`installNamedPolicy` rather than calling `trustedTypes.createPolicy` directly:

```ts
import { installNamedPolicy } from '@granit/csp';

export const GRANIT_MYPKG_POLICY_NAME = 'granit-mypkg' as const;

export function installPolicy() {
  return installNamedPolicy(GRANIT_MYPKG_POLICY_NAME, {
    createHTML: (input) => sanitize(input),
  });
}
```

## Public API

| Symbol                        | Kind  | Purpose                                                                |
| ----------------------------- | ----- | ---------------------------------------------------------------------- |
| `installPolicy`               | fn    | Install the core `granit` policy (refuses every sink); idempotent      |
| `GRANIT_CORE_POLICY_NAME`     | const | `'granit'` — core policy name, listed first in `trusted-types`         |
| `installNamedPolicy`          | fn    | Per-package primitive: install a named policy, register it, idempotent |
| `getCspTrustedTypesDirective` | fn    | Build the `trusted-types` directive value from installed policies      |
| `listInstalledGranitPolicies` | fn    | Snapshot of installed policy names, in insertion order                 |
| `GranitPolicyName`            | type  | Known policy names (`granit`, `granit-map`, `granit-keycloak`, …)      |
| `InstallResult`               | type  | Result union: `installed` / `already-installed` / `unsupported`        |
| `TrustedTypePolicyOptions`    | type  | `createHTML` / `createScript` / `createScriptURL` callbacks            |

The `@granit/csp/testing` subpath exports `resetInstalledPoliciesForTests`
and `resetGranitPoliciesForTests` to clear the module-level install state and
the shared registry between test cases. They are test-only and never flow into
production bundles.

## Out of scope / caveats

- **The core `granit` policy is a deliberate trap, not a sanitizer.** Its
  `createHTML` / `createScript` / `createScriptURL` callbacks **throw** rather
  than return a sanitized value. Any attempt to assign to a sink through it is
  a programming error and must surface loudly. Packages that need a real sink
  must register their own scoped policy.
- **No sink sanitization lives here.** This package owns install/registration/
  directive plumbing only. The actual `createHTML` sanitization logic belongs
  to each scoped provider (e.g. `@granit/react-ui-map/csp`), co-located with the
  code that writes to the sink.
- **Trusted Types is browser-enforced and best-effort.** `installNamedPolicy`
  no-ops (returns `unsupported`) outside a `window` / `trustedTypes` runtime —
  SSR, Node tests, and browsers without Trusted Types support. The real
  guarantee comes from the CSP header the server emits; the install registry
  only tells the server which policies to allow.
- **Call ordering matters.** `getCspTrustedTypesDirective()` reflects only the
  policies installed at the moment it runs. Install all scoped policies during
  bootstrap before computing or emitting the directive, or the header will be
  narrower than the app actually needs.
- **`markInstalled` / the registry mutate process-global state.** In tests,
  reset between cases via the `@granit/csp/testing` helpers to avoid
  cross-test leakage.

## License

Apache-2.0
