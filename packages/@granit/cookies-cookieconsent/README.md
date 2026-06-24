# @granit/cookies-cookieconsent

A **CMP adapter** that backs the framework-agnostic
[`@granit/cookies`](../cookies) consent core with
[`vanilla-cookieconsent`](https://github.com/orestbida/cookieconsent) (the
`cc_cookie` storage format). It is a thin, framework-agnostic glue package: it
holds no React, DOM-rendering or Node-only code, only the `CookieConsentAdapter`
implementation that `@granit/cookies` and `@granit/react-cookies` consume.

It sits in the **adapter** layer of the cookies stack:

- [`@granit/cookies`](../cookies) — framework-agnostic core: `CookieCategory`,
  `ConsentState`, the `CookieConsentAdapter` interface, the cookie store, and the
  `GET {basePath}/config` client. Counterpart of the .NET `Granit.Http.Cookies`
  module ([`contracts/openapi/cookies.json`](../../../contracts/openapi/cookies.json)).
- **`@granit/cookies-cookieconsent`** (this package) — concrete adapter built on
  `vanilla-cookieconsent`. Swap in a different CMP by providing a different
  adapter; nothing else in the stack changes.
- [`@granit/react-cookies`](../react-cookies) — React bindings
  (`CookieConsentProvider`, `useCookieConsent`) that take any adapter instance.

The adapter runs **headlessly**: it owns consent state and category mapping but
renders no UI (`autoShow: false` is always set). The consuming application owns
the consent banner and calls the provider methods.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
the peers a consumer must provide:

- `@granit/cookies` (`workspace:*`) — supplies the `CookieConsentAdapter`
  contract, `ConsentState`, and the `getCookieConsentConfig` client.
- `vanilla-cookieconsent` (`^3.0.0`) — the CMP runtime, lazily imported on
  `init()`.

## Quick start

```ts
import { getCookieConsentConfig } from '@granit/cookies';
import { createCookieConsentProvider } from '@granit/cookies-cookieconsent';

const provider = createCookieConsentProvider({
  // Dynamic mode: derive the active category list from the backend service
  // registry (GET /cookies/config). Omit to register all optional categories.
  loadConfig: () => getCookieConsentConfig(apiClient, '/cookies'),
  // Default — must match Http:Cookies:CookieConsent:CookieName on the backend.
  cookieName: 'cc_cookie',
});
```

```tsx
// Hand the adapter to the React provider from @granit/react-cookies.
import { CookieConsentProvider } from '@granit/react-cookies';

<CookieConsentProvider provider={provider}>
  <App />
</CookieConsentProvider>;
```

`init()` lazily `import()`s `vanilla-cookieconsent`, registers the `necessary`
(always-on) category plus the optional categories in use, and wires the
library's `onConsent` / `onChange` callbacks into the adapter's subscribers.

## Category mapping

The adapter maps each `CookieCategory` to a `cc_cookie` category name:

| `CookieCategory`     | `cc_cookie` name  |
| -------------------- | ----------------- |
| `strictly_necessary` | `necessary`       |
| `preferences`        | `functional`      |
| `analytics`          | `analytics`       |
| `marketing`          | `marketing`       |
| `saleorsharing`      | `sale_or_sharing` |

Override the optional names via `categoryNames` when the backend is configured
with non-default values:

```ts
createCookieConsentProvider({
  categoryNames: { analytics: 'stats', marketing: 'ads' },
});
```

## Public API

| Symbol                                | Kind | Purpose                                                               |
| ------------------------------------- | ---- | --------------------------------------------------------------------- |
| `createCookieConsentProvider`         | fn   | Build a headless `CookieConsentAdapter` over `vanilla-cookieconsent`  |
| `CreateCookieConsentProviderOptions`  | type | `loadConfig?`, `cookieName?`, `categoryNames?` factory options        |
| `CategoryNames`                       | type | `CookieCategory` → `cc_cookie` name map (optional categories)         |

`createCookieConsentProvider` returns a `CookieConsentAdapter` (defined in
`@granit/cookies`), implementing `init`, `getConsents`, `onConsentChange`,
`setConsent`, `setAllConsents`, and `hasConsented`.

## Out of scope / caveats

- **No UI.** This adapter never renders the consent banner or preferences modal
  (`autoShow: false`). Showing consent UI and translations is the application's
  responsibility — `vanilla-cookieconsent` is run with an empty `en` translation
  block solely because `run()` throws when `language.translations` is missing.
- **`strictly_necessary` is read-only.** `setConsent('strictly_necessary', …)`
  is a no-op; the `necessary` category is registered `enabled` + `readOnly` and
  cannot be revoked, matching RGPD/CCPA essential-cookie rules.
- **Category names must match the backend.** `cookieName` and `categoryNames`
  must agree with `Http:Cookies:CookieConsent:*` configuration; otherwise consent
  written by the client will not be read consistently by the backend.
- **`saleorsharing` is verbatim.** The CCPA "Sale or Sharing" category is
  serialized without an underscore by the backend; do not "normalize" it.
- **CMP-agnostic by design.** Because the React layer depends only on the
  `CookieConsentAdapter` interface, replacing `vanilla-cookieconsent` with
  another CMP means swapping this adapter alone — provider wiring and hooks are
  unchanged.

## License

Apache-2.0
