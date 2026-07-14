<img src="https://granit-fx.dev/images/granit-icon.svg" alt="" height="32" align="left" style="margin-right:10px" />

# @granit/cookies

Framework-agnostic **cookie consent** abstraction — the TypeScript counterpart of
the .NET `Granit.Http.Cookies` module. It defines the CMP-agnostic contract that
sits between the backend cookie registry and any Consent Management Platform
adapter: the `CookieConsentAdapter` interface, the `getCookieConsentConfig` HTTP
call, the consent-gated `document.cookie` helpers, and the shared category /
config types.

It holds **no** React, CMP-SDK or Node-only dependency — only a `document`
feature-test for the cookie helpers (which are SSR-safe no-ops). The React layer
(provider + hooks) lives in [`@granit/react-cookies`](../react-cookies); a
concrete CMP implementation lives in
[`@granit/cookies-cookieconsent`](../cookies-cookieconsent), which fulfils
`CookieConsentAdapter` against vanilla-cookieconsent and consumes
`getCookieConsentConfig` as its canonical `loadConfig`.

Part of the [Granit](https://granit-fx.dev) framework.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, never
installed standalone. Declare these peers:

- `@granit/api-client` — the `AxiosInstance` passed to `getCookieConsentConfig`
  (carries CSRF / auth / tenant interceptors).
- `@granit/logger` — `createLogger`; blocked cookie writes are logged at `debug`
  (cookie name + category only, never the value).

## Quick start

```ts
import {
  getCookieConsentConfig,
  defaultConsentState,
  setConsentedCookie,
  getCookie,
  removeCookie,
} from '@granit/cookies';
import type { CookieConsentAdapter } from '@granit/cookies';
import { apiClient } from '@granit/api-client';

// 1. Fetch the CMP-agnostic config (registered cookies + third-party services).
//    `basePath` encodes the backend collection root → `GET /cookies/config`.
const config = await getCookieConsentConfig(apiClient, '/cookies');

// 2. Start from the safe default: only `strictly_necessary` granted.
let consents = defaultConsentState();

// 3. Write a cookie ONLY if its category is consented. Returns false otherwise.
const wrote = setConsentedCookie('analytics_id', visitorId, {
  category: 'analytics',
  consents,
  maxAge: 60 * 60 * 24 * 30,
});

// 4. Read it back, or clear it (pass the same path/domain used to write it).
const id = getCookie('analytics_id');
removeCookie('analytics_id');
```

CMP adapter packages implement `CookieConsentAdapter` and wire `loadConfig` to
`getCookieConsentConfig`, keeping their initial state in sync with
`defaultConsentState()`:

```ts
const adapter: CookieConsentAdapter = {
  async init() {
    /* load CMP SDK, hydrate stored consent */
  },
  getConsents: () => defaultConsentState(),
  onConsentChange: (cb) => {
    /* subscribe */ return () => {
      /* unsubscribe */
    };
  },
  setConsent: (category, granted) => {
    /* persist single category */
  },
  setAllConsents: (granted) => {
    /* persist all non-essential */
  },
  hasConsented: () => false,
};
```

## Public API

| Symbol                        | Kind | Purpose                                                         |
| ----------------------------- | ---- | --------------------------------------------------------------- |
| `getCookieConsentConfig`      | fn   | `GET {basePath}/config` — registered cookies + 3rd-party config |
| `defaultConsentState`         | fn   | Safe default consent: only `strictly_necessary` granted         |
| `getCookie`                   | fn   | Read & decode a cookie by name (SSR-safe; `null` off-document)  |
| `setConsentedCookie`          | fn   | Write a cookie **only if** its category is consented            |
| `removeCookie`                | fn   | Expire a cookie (pass the original `path`/`domain`)             |
| `CookieCategory`              | type | Consent category union (mirrors backend snake_case enum)        |
| `ConsentState`                | type | `Record<CookieCategory, boolean>` — per-category grant map      |
| `CookieConsentAdapter`        | type | CMP abstraction adapter packages implement                      |
| `CookieConsentConfigResponse` | type | `GET /config` response (cookies + services)                     |
| `CookieDefinitionResponse`    | type | One registered internal cookie (name, category, retention)      |
| `ThirdPartyServiceResponse`   | type | A third-party service + its cookie name patterns                |
| `CookieAttributes`            | type | `document.cookie` attributes (secure/sameSite defaults)         |
| `ConsentedCookieOptions`      | type | `CookieAttributes` + `category` + `consents` for gated writes   |

## Out of scope / caveats

- **`setConsentedCookie` is a gate, not enforcement.** It refuses to write when
  the category is not consented, but it cannot stop other code (or a CMP SDK)
  from calling `document.cookie` directly. Route all first-party writes through
  it; for third-party scripts, gate the _script load_ via the CMP adapter.
- **SSR / non-browser:** `getCookie` returns `null`, and `setConsentedCookie` /
  `removeCookie` are no-ops when `document` is undefined. No cookie state is
  reconstructed server-side here.
- **Default-secure attributes.** Writes default to `path: '/'`, `secure: true`,
  `sameSite: 'lax'`; `SameSite=None` always co-sends `Secure`. `removeCookie`
  must receive the same `path`/`domain` used to write, or the browser keeps the
  original cookie.
- **`sale_or_sharing` is snake_case.** The CCPA "Sale or Sharing" category
  serializes with an underscore — the backend maps it explicitly (a plain
  `ToLowerInvariant()` would have glued the words into `saleorsharing`).
- **No React, no CMP SDK, no UI.** The provider and consent-aware hooks
  (`useCookieConsent`, `useConsentedCookie`) live in
  [`@granit/react-cookies`](../react-cookies); concrete CMP wiring lives in
  [`@granit/cookies-cookieconsent`](../cookies-cookieconsent).
- **Config is anonymous + cached.** `getCookieConsentConfig` hits an anonymous
  endpoint cached server-side (~1h); treat its payload as the public consent
  catalogue, not per-user state.

## License

Apache-2.0
