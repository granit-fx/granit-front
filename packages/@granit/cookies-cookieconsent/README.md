# @granit/cookies-cookieconsent

`vanilla-cookieconsent` (cc_cookie) adapter for [`@granit/cookies`](../cookies/README.md).

Replaces the deprecated [`@granit/cookies-klaro`](../cookies-klaro/README.md) adapter.

## Installation

```bash
pnpm add @granit/cookies-cookieconsent vanilla-cookieconsent
```

## Usage

```ts
import { getCookieConsentConfig } from '@granit/cookies';
import { createCookieConsentProvider } from '@granit/cookies-cookieconsent';

const provider = createCookieConsentProvider({
  // Dynamic mode: fetch registered services from the backend (GET /cookies/config)
  loadConfig: () => getCookieConsentConfig(apiClient, '/cookies'),
  cookieName: 'cc_cookie', // default — must match Http:Cookies:CookieConsent:CookieName
});

// Pass to the React provider from @granit/react-cookies
<CookieConsentProvider provider={provider}>
  <App />
</CookieConsentProvider>
```

## Category mapping

The adapter maps `CookieCategory` to vanilla-cookieconsent category names:

| `CookieCategory`     | cc_cookie name    |
| -------------------- | ----------------- |
| `strictly_necessary` | `necessary`       |
| `preferences`        | `functional`      |
| `analytics`          | `analytics`       |
| `marketing`          | `marketing`       |
| `saleorsharing`      | `sale_or_sharing` |

Override via `categoryNames` if the backend is configured with non-default names:

```ts
createCookieConsentProvider({
  categoryNames: { analytics: 'stats', marketing: 'ads' },
});
```

## Headless mode

The adapter operates headlessly — it manages consent state without rendering UI.
`autoShow: false` is always set; the consuming application owns the consent banner.

## Migration from @granit/cookies-klaro

```ts
// Before
import { createKlaroCookieConsentProvider } from '@granit/cookies-klaro';
const provider = createKlaroCookieConsentProvider({ loadConfig, cookieName: 'klaro' });

// After
import { createCookieConsentProvider } from '@granit/cookies-cookieconsent';
const provider = createCookieConsentProvider({ loadConfig, cookieName: 'cc_cookie' });
```

The backend migration is handled by switching from `UseKlaro()` to `UseCookieConsent()`
in `AddGranitCookies()`. See [granit-dotnet#230](https://github.com/granit-fx/granit-dotnet)
for the .NET counterpart.
