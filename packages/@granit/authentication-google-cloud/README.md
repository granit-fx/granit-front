# @granit/authentication-google-cloud

Framework-agnostic **type contract** for the Google Cloud Identity Platform
(Firebase Auth) authentication mode. It declares the auth-context shape and the
host-supplied configuration that the React layers consume — and nothing else. No
React, DOM, Node or `firebase` runtime is pulled in; `firebase` appears only as a
type-level peer for the `Auth` instance reference.

This is the **core** tier of the Google Cloud auth split. The init hook that
drives Firebase lives in
[`@granit/react-authentication-google-cloud`](../react-authentication-google-cloud);
the drop-in provider that wires that hook into an app's auth context (with an
init spinner and locale forwarding) lives in
[`@granit/react-ui-authentication-google-cloud`](../react-ui-authentication-google-cloud).
`GoogleCloudAuthContextType` extends `BaseAuthContextType` from
[`@granit/authentication`](../authentication) — the shared base every auth-mode
provider implements (`keycloak`, `local`, `azure-ad`, …), so apps can swap IdPs
behind one context type. There is **no backend counterpart**: Firebase Auth is an
external IdP, not a Granit `.NET` module; the ID token it mints is forwarded as a
Bearer token to `@granit/api-client`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. A consumer
must declare these peers:

- `@granit/authentication` — supplies `BaseAuthContextType`, which
  `GoogleCloudAuthContextType` extends.
- `firebase` (`>=10.0.0`) — supplies the `Auth` type referenced by the context.
  Type-only here; the runtime is imported by the React init hook, not this
  package.

## Quick start

These are pure type contracts. Apps reference them when typing their auth context
and when assembling the Firebase config from the host environment — the React
layers do the actual work.

```ts
import type {
  GoogleCloudAuthContextType,
  GoogleCloudCoreConfig,
} from '@granit/authentication-google-cloud';

// Host-owned config, typically read from the environment at bootstrap.
const config: GoogleCloudCoreConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  scopes: ['email', 'profile'],
  // tokenStorage omitted → defaults to 'memory' (see caveats).
  onSessionExpired: () => console.warn('session expired'),
};

// The context value the provider produces and consumers read.
declare const ctx: GoogleCloudAuthContextType;
ctx.authenticated; // boolean   (from BaseAuthContextType)
ctx.user;          // OidcUserInfo | null
ctx.firebaseAuth;  // Auth | null — live Firebase instance, null until init
```

For the runtime wiring, mount `GoogleCloudAuthProvider` from
`@granit/react-ui-authentication-google-cloud` and pass it this `config`.

## Public API

| Symbol                       | Kind | Purpose                                                          |
| ---------------------------- | ---- | ---------------------------------------------------------------- |
| `GoogleCloudAuthContextType` | type | `BaseAuthContextType` + `firebaseAuth: Auth \| null`             |
| `GoogleCloudCoreConfig`      | type | Firebase init config: keys, scopes, token-storage posture, hooks |

`GoogleCloudCoreConfig` fields: required `apiKey` / `authDomain` / `projectId`;
optional `scopes` (OAuth scopes added at sign-in), `tokenStorage` (persistence
posture, see caveats), and the `onTokenRefreshError` / `onSessionExpired`
callbacks.

## Caveats

- **Token storage defaults to in-memory.** `tokenStorage` defaults to `'memory'`
  (`inMemoryPersistence`) so the refresh token never lands in IndexedDB or
  `localStorage`, where a same-origin script (XSS, malicious extension) could lift
  it. `'sessionStorage'` maps to Firebase `browserSessionPersistence`;
  `'localStorage'` maps to Firebase **IndexedDB** persistence. Override away from
  `'memory'` only when cross-tab / cross-reload persistence is genuinely required
  **and** the app ships an XSS-hardened CSP. For durable sessions, prefer the BFF
  cookie pattern (`@granit/bff`) over browser-side token persistence. See security
  audit VULN-201.

- **Type-only package.** This barrel exports two types and zero runtime. All
  behaviour (Firebase init, auth-state listener, token wiring to
  `@granit/api-client`, sign-in/out) lives in
  [`@granit/react-authentication-google-cloud`](../react-authentication-google-cloud)
  and [`@granit/react-ui-authentication-google-cloud`](../react-ui-authentication-google-cloud).

- **App-agnostic.** No admin-role, FHIR or HDS-specific assumptions. The host app
  owns its auth-context instance and decides — via its auth-mode selection —
  whether to mount the Google Cloud provider at all.

## License

Apache-2.0
