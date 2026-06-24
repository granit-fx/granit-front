# @granit/react-cookies

React bindings for the Granit **cookie consent** module — a context provider that
drives a Consent Management Platform (CMP) adapter, plus consent-aware hooks for
reading consent state and writing consent-gated cookies. This is the **React
hooks + provider layer**: it wraps the framework-agnostic adapter contract and
`document.cookie` helpers from [`@granit/cookies`](../cookies) in a
`CookieConsentProvider` and exposes them through `useCookieConsent` /
`useConsentedCookie`. It holds no CMP SDK and renders no banner — those live one
layer down (the concrete adapter) and one layer up (your app's banner UI).

The split is three packages over the same .NET `Granit.Http.Cookies` backend
(contract: `contracts/openapi/cookies.json` — a single anonymous
`GET /cookies/config` route):

- [`@granit/cookies`](../cookies) — framework-agnostic core: the
  `CookieConsentAdapter` contract, the `getCookieConsentConfig` Axios call,
  consent-gated `document.cookie` helpers, and the shared category / config types.
- `@granit/react-cookies` (this package) — React provider + consent hooks.
- [`@granit/cookies-cookieconsent`](../cookies-cookieconsent) — a concrete
  `CookieConsentAdapter` implementation backed by vanilla-cookieconsent
  (`cc_cookie`).

There is no `react-ui-cookies` admin feature kit; the consent banner itself is
app-owned and built on top of the hooks here.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/cookies` — the core adapter contract, consent state, and gated cookie
  helpers this layer binds to React.
- `@granit/logger` — `createLogger`; CMP initialization failures are logged at
  `error` (the provider keeps safe defaults and stays mounted).
- `react` (`^19`).
- `msw` (`^2`, **optional**) — only for the `@granit/react-cookies/testing`
  subpath.

A concrete `CookieConsentAdapter` (e.g. [`@granit/cookies-cookieconsent`](../cookies-cookieconsent))
must be supplied to the provider; this package ships none.

## Quick start

Mount the provider once with a CMP adapter, then read consent anywhere below it.
The provider initializes the adapter, subscribes to consent changes, and exposes
the live state plus per-category and bulk grant/revoke actions.

```tsx
import { CookieConsentProvider, useCookieConsent } from '@granit/react-cookies';
import { createCookieConsentProvider } from '@granit/cookies-cookieconsent';
import { apiClient } from '@granit/api-client';

const adapter = createCookieConsentProvider({
  loadConfig: () => apiClient.get('/cookies/config').then((r) => r.data),
});

function App({ children }: { children: React.ReactNode }) {
  return <CookieConsentProvider provider={adapter}>{children}</CookieConsentProvider>;
}

function ConsentBanner() {
  const { isLoaded, hasConsented, acceptAll, revokeAll } = useCookieConsent();

  // `isLoaded` flips true once the adapter has hydrated stored consent.
  if (!isLoaded || hasConsented) return null;
  return (
    <div role="dialog" aria-label="Cookie consent">
      <button type="button" onClick={acceptAll}>Accept all</button>
      <button type="button" onClick={revokeAll}>Reject non-essential</button>
    </div>
  );
}
```

Gate side effects on a category, and write first-party cookies through the
consent-aware accessor — `set` is a no-op (returns `false`) until the bound
category is granted:

```tsx
import { useCookieConsent, useConsentedCookie } from '@granit/react-cookies';

function Analytics() {
  const { consents } = useCookieConsent();
  if (consents.analytics) {
    // load analytics scripts here
  }
  return null;
}

function ThemePersistence({ theme }: { theme: string }) {
  const prefs = useConsentedCookie('theme', 'preferences');
  // Writes only when `preferences` is consented; `isAllowed` reflects it live.
  if (prefs.isAllowed) prefs.set(theme, { maxAge: 60 * 60 * 24 * 365 });
  return null;
}
```

`revokeCategory` / `revokeAll` never drop `strictly_necessary` — that category is
always granted and ignored on revoke.

## Public API

| Symbol                      | Kind     | Purpose                                                             |
| --------------------------- | -------- | ------------------------------------------------------------------- |
| `CookieConsentProvider`     | provider | Initializes the CMP adapter, subscribes to changes, exposes consent |
| `useCookieConsent`          | hook     | Live consent state + per-category / bulk grant-revoke actions       |
| `useConsentedCookie`        | hook     | Consent-gated accessor for one named cookie (`get`/`set`/`remove`)  |
| `ConsentedCookie`           | type     | Accessor returned by `useConsentedCookie` (`isAllowed`-gated `set`) |
| `CookieConsentContextValue` | type     | Context shape: `consents`, `isLoaded`, `hasConsented`, actions      |

`useCookieConsent` returns `{ consents, isLoaded, hasConsented, acceptCategory,
revokeCategory, acceptAll, revokeAll }` and throws if called outside a
`CookieConsentProvider`. The `CookieCategory`, `ConsentState`, and
`CookieConsentAdapter` types are owned by [`@granit/cookies`](../cookies) and
re-imported, not re-exported here.

### `./testing` subpath

Requires the optional `msw` peer:

- `createCookieConsentHandlers(baseUrl = '/api/v1')` — MSW handler for
  `GET {baseUrl}/cookies/config`, returning the fixture below (mirrors
  `Granit.Http.Cookies.Endpoints`; the route is anonymous, cached ~1h
  server-side).
- `mockCookieConsentConfig` — a `CookieConsentConfigResponse` fixture covering
  every category (`strictly_necessary`, `preferences`, `analytics`, `marketing`)
  for banner rendering.

## Out of scope / caveats

- **Consent gating is a UX/compliance gate, not enforcement.** `set` refuses to
  write a cookie when its category is not granted, but it cannot stop other code
  or a CMP SDK from calling `document.cookie` directly. Route first-party writes
  through `useConsentedCookie`; gate third-party *script loads* via the CMP
  adapter, not after the fact.
- **`strictly_necessary` is always on.** It cannot be revoked through
  `revokeCategory`/`revokeAll`, and `useConsentedCookie(name, 'strictly_necessary')`
  reports `isAllowed: true` regardless of consent state.
- **Resilient init.** If the adapter's `init()` rejects, the provider logs at
  `error` and stays mounted with `defaultConsentState` (only `strictly_necessary`
  granted) and `isLoaded: true` — the app keeps rendering rather than blocking on
  a failed CMP.
- **`remove` needs matching attributes.** Pass the same `path`/`domain` used to
  write a cookie, or the browser keeps the original; `maxAge`/`expires` are not
  accepted on `remove`.
- **No banner UI, no CMP SDK.** This package is headless. The concrete adapter
  lives in [`@granit/cookies-cookieconsent`](../cookies-cookieconsent); the
  config fetch, gated `document.cookie` helpers, and types live in
  [`@granit/cookies`](../cookies).

## License

Apache-2.0
