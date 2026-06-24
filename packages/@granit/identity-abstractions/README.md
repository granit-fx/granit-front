# @granit/identity-abstractions

Shared **identity contract primitives** — the framework-level TypeScript mirror of
the .NET `Granit.Identity.Abstractions` assembly. A type-only package with no
runtime, no DOM and no React dependency.

This is the framework-agnostic **core** layer at its smallest: two string-union
enums that several otherwise-independent packages need to agree on. Pulling them out
of `@granit/identity` into a standalone abstractions package — mirroring the backend
split — lets infra and domain packages depend on the shared contract without coupling
to each other, and prevents divergent per-package copies. The domain types,
HTTP calls and the device-label composer live in the sibling core package
[`@granit/identity`](../identity); the React hooks/providers layer is
[`@granit/react-identity`](../react-identity) and the admin feature kit is
[`@granit/react-ui-identity`](../react-ui-identity). There is no
`react-identity-abstractions`.

Both enums are serialized by the backend as their **string name** (via the
framework's `JsonStringEnumConverter`), so the TypeScript side models them as string
unions rather than numeric enums. The backend counterpart for the surrounding session
and device DTOs is the `identity` module (`contracts/openapi/identity.json`);
`@granit/contract-tests` treats these unions as the `string` family when diffing the
hand-written DTOs against that spec.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
to a public registry for app consumption. The package is type-only and declares **no**
runtime dependencies or peers; importing it adds nothing to a consumer's bundle (the
types erase at compile time).

## Quick start

Use the unions to type the risk and device fields of a session or device DTO. In
practice you consume them through `@granit/identity`, which already wires them into
`UserSessionResponse` / `UserDeviceResponse` and the `composeDeviceLabel` helper —
import directly from here only when you model the contract yourself.

```ts
import type { DeviceKind, UserSessionRiskLevel } from '@granit/identity-abstractions';

// A null risk level means no verdict was stored (anomaly detection not installed);
// 'None' means detection ran and found nothing.
function riskBadgeVariant(risk: UserSessionRiskLevel | null): string {
  switch (risk) {
    case 'High':
      return 'danger';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'info';
    case 'None':
    case null:
      return 'neutral';
  }
}

// `kind` drives the localized device label — it is derived from the OIDC client's
// declared kind (with a redirect-URI / grant-type heuristic fallback), NOT from
// User-Agent parsing.
const labels: Record<DeviceKind, string> = {
  Unknown: 'Unknown device',
  Browser: 'Browser',
  BrowserExtension: 'Browser extension',
  MobileApp: 'Mobile app',
  DesktopApp: 'Desktop app',
  Wearable: 'Wearable',
  Tv: 'TV',
  Embedded: 'Embedded device',
  ApiClient: 'API client',
};
```

## Public API

| Symbol                 | Kind | Purpose                                                          |
| ---------------------- | ---- | ---------------------------------------------------------------- |
| `UserSessionRiskLevel` | type | `None` / `Low` / `Medium` / `High` — coarse session risk         |
| `DeviceKind`           | type | Client kind of a session/device, used to compose a device label  |

## Caveats

- **Null vs `'None'` for risk.** A *null* `UserSessionRiskLevel` means no verdict was
  stored (anomaly detection not installed); `'None'` means detection ran and found
  nothing. Treat the field as `UserSessionRiskLevel | null` on every session DTO and
  distinguish the two states.
- **`DeviceKind` is authoritative, not heuristic UA parsing.** It comes from the
  authentication context (the OIDC client's declared kind, with a redirect-URI /
  grant-type fallback). Do not re-derive it from the raw User-Agent string.
- **Open unions over the wire.** Both enums are serialized as their string name. New
  members can be added backend-side; if you `switch` exhaustively, keep a default arm
  so an unrecognized future value (e.g. a new `DeviceKind`) degrades gracefully rather
  than throwing.

## License

Apache-2.0
