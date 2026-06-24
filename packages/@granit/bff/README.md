# @granit/bff

Framework-agnostic **BFF (Backend-for-Frontend) auth contract** — the
TypeScript mirror of the `Granit.Bff` .NET module
(`granit-dotnet/src/Granit.Bff`, contract `contracts/openapi/bff.json`).

It exposes the wire types, a runtime validator, and a CSRF token manager for
the two endpoints the BFF retains: `GET /{prefix}/bff/user` (session bootstrap)
and `POST /{prefix}/bff/csrf-token` (anti-CSRF token issuance). It holds **no**
React or DOM-render dependency — only the browser `fetch`/`URL` globals — so the
same code drives a React SPA, a test harness, or a non-React shell. The React
bindings (`BffProvider`, `useAuth`, `useCsrf`, `useBffFetch`, `BffGuard`) live in
[`@granit/react-bff`](../react-bff); the app-level wiring (auth-context adapter,
401→login bridge, init / backend-unavailable states) lives in
[`@granit/react-ui-bff`](../react-ui-bff).

The BFF terminates the OIDC session server-side and keeps tokens out of the
browser. The `/bff/user` response carries a filtered claim set and the
server-emitted `isHost` marker, modelled here as a discriminated union enforcing
the invariant **`isHost ⇔ tenantId absent`**.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a registry for app consumption. Declare these peers:

- `@granit/types` — provides `ISODateString` and the branded `TenantId`.
- `@granit/logger` (optional) — a redacting `Logger` for session-check and
  CSRF-refresh failures; falls back to a `console.warn` logger when omitted.

## Quick start

```ts
import {
  CsrfManager,
  parseBffSessionResponse,
  type BffUserResponse,
} from '@granit/bff';

const pathPrefix = '/admin';

// 1. Bootstrap the session. Never trust the raw body — validate the
//    discriminated-union shape before handing it to the auth context.
const raw: unknown = await fetch(`${pathPrefix}/bff/user`, {
  credentials: 'include',
}).then((r) => r.json());

const parsed = parseBffSessionResponse(raw);
if (!parsed.success) {
  // Malformed (e.g. rewritten by a proxy / captive portal) → force logout.
  throw new Error(parsed.issues.join('; '));
}

const session: BffUserResponse = parsed.data;
if (session.authenticated && session.isHost === false) {
  // Narrowed to BffTenantUser — `tenantId` is guaranteed present.
  console.log(session.tenantId);
}

// 2. CSRF for mutations. The wrapper auto-injects `X-CSRF-Token` on
//    POST/PUT/DELETE/PATCH and refuses any cross-origin URL.
const csrf = new CsrfManager(pathPrefix);
const fetchWithCsrf = csrf.createFetchWithCsrf();
await fetchWithCsrf(`${pathPrefix}/bff/logout`, { method: 'POST' });
```

## Public API

| Symbol                    | Kind  | Purpose                                                       |
| ------------------------- | ----- | ------------------------------------------------------------ |
| `BffUser`                 | type  | `BffTenantUser \| BffHostUser` authenticated union           |
| `BffTenantUser`           | type  | Tenant-scoped user - guarantees a non-empty `tenantId`       |
| `BffHostUser`             | type  | Host (cross-tenant) user - guarantees no `tenantId`          |
| `BffUnauthenticated`      | type  | `{ authenticated: false }` response                          |
| `BffUserResponse`         | type  | `BffUser \| BffUnauthenticated` - full `/bff/user` result    |
| `BffCsrfTokenResponse`    | type  | `POST /bff/csrf-token` body (`{ csrfToken }`)                |
| `BffConfig`               | type  | Provider config: `pathPrefix`, `onUnauthenticated`, interval |
| `ParseResult<T>`          | type  | `safeParse`-style `{ success, data } \| { success, issues }` |
| `parseBffSessionResponse` | fn    | Validate a raw `/bff/user` body into a `BffUserResponse`     |
| `CsrfManager`             | const | Class - fetches/caches the CSRF token, wraps `fetch`         |

`CsrfManager` instances expose `fetchToken()` (force a fresh token),
`getToken()` (`@internal` — for the api-client interceptor only), and
`createFetchWithCsrf()` (the same-origin-only mutation wrapper).

## Out of scope / caveats

- **Sessions & devices moved off the BFF** (granit-dotnet #2692). Listing or
  revoking the caller's own sessions is no longer a BFF concern. Use the
  canonical, transport-agnostic `/sessions` (+ `/devices`) endpoints via
  [`@granit/identity`](../identity) (`listMyUserSessions`,
  `revokeMyUserSession`, `revokeMyOtherUserSessions`, `listMyUserDevices`) and
  [`@granit/react-identity`](../react-identity) (`useMyUserSessions`,
  `useRevokeMyUserSession`, …). This package retains only auth bootstrap
  (`/bff/user`) and CSRF (`/bff/csrf-token`).
- **Tokens never reach the browser.** The BFF decodes the JWT server-side and
  returns only a filtered claim set. Do not attempt to read access/ID tokens
  client-side — they are not exposed by design.
- **`getToken()` is not a UI affordance.** It is marked `@internal` for the
  `@granit/api-client` interceptor wiring; exposing the raw CSRF token to UI
  code widens the attack surface for malicious same-origin scripts. Let
  `@granit/api-client` inject the header automatically.
- **Domain APIs do not belong here.** `createFetchWithCsrf()` rejects any URL
  that is not same-origin as the document — a cross-origin call would leak the
  BFF session cookie. Business/domain HTTP must go through `@granit/api-client`
  (CSRF, auth, and tenant interceptors); this helper is reserved for the BFF's
  own same-origin endpoints.
- **`isHost` is server-authoritative.** The SPA must never infer Host status
  from a missing `tenantId`; `parseBffSessionResponse` enforces the
  `isHost ⇔ tenantId absent` invariant and rejects any response that violates
  it. Treat a `{ success: false }` result as untrustworthy — log and force the
  unauthenticated state.
- **`name` / `email` may be empty.** The backend emits them as nullable
  (`string?`); a session whose id_token carries no profile claim is still
  authenticated, and the validator maps a null/absent claim to `''` rather than
  rejecting the user.

## License

Apache-2.0
