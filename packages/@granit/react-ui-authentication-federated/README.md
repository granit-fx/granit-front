# @granit/react-ui-authentication-federated

The **federated (external-IdP) login landing** for Granit apps — a provider-agnostic
"sign in" screen shown before the redirect to an external identity provider. This is the
**react-ui admin feature kit** layer: a single presentational page plus its i18n bundles.
It is headless of any auth transport — the host injects the auth state and the action that
starts the redirect, so the page renders the same against Keycloak, Entra ID, Cognito,
Google Cloud, or any OIDC IdP.

It does **not** render a credentials form (the IdP owns that). It shows a branded sign-in
button that calls `login()`, surfaces an `?error=<code>` auth error from the redirect
callback, and `<Navigate>`s home when the user is already authenticated. It is the
federated parallel to
[`@granit/react-ui-authentication-local`](../react-ui-authentication-local), which carries
the _local_ (OpenIddict) credentials/passkey/two-factor forms. There is no
framework-agnostic core nor a `react-` hooks sibling for the federated case — the auth
state comes from whichever per-provider package the app wires (for example
[`@granit/react-authentication-keycloak`](../react-authentication-keycloak),
[`@granit/react-authentication-entraid`](../react-authentication-entraid),
[`@granit/react-authentication-cognito`](../react-authentication-cognito), or
[`@granit/react-authentication-google-cloud`](../react-authentication-google-cloud)).
There is no backend counterpart: the IdP redirect and token exchange happen in the host
auth package and the BFF, not here.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published for
app consumption through a public registry. A consumer must declare these peers:

- `@granit/react-ui` — `Alert` / `AlertTitle` / `AlertDescription` / `Button` primitives.
- `@granit/react-localization` — `useTranslation` for the flat `Auth.*` keys.
- `react-router` (`^7.18`) — `useSearchParams` (reads `?error=`) and `Navigate`
  (the authenticated redirect); the page must render inside a router.
- `lucide-react` (`^1.21`) — the `AlertCircle` error icon.
- `react` / `react-dom` (`^19`).

## Quick start

The host owns the auth state and the public layout; this page only consumes them. Register
the i18n bundle once, then render the page with the auth wiring from the active provider.

```tsx
import {
  FederatedLoginPage,
  authFederatedTranslationsEn,
} from '@granit/react-ui-authentication-federated';

// Flat `Auth.*` keys in the `translation` namespace — merge into the host i18n instance.
i18n.addResourceBundle('en', 'translation', authFederatedTranslationsEn, true, true);

function LoginRoute() {
  // `login` / `loading` / `authenticated` come from the app's federated auth provider
  // (e.g. @granit/react-authentication-keycloak); this page is provider-agnostic.
  const { login, loading, authenticated } = useAuth();

  return (
    <FederatedLoginPage
      login={login}
      loading={loading}
      authenticated={authenticated}
      layout={PublicLayout}
    />
  );
}
```

When `authenticated` is `true` the page renders `<Navigate to="/" replace />` instead of
the button. When the IdP callback returns `?error=<code>`, the page shows a destructive
`Alert` whose body is `t('Auth.AccessDenied.<code>')` — bundle keys exist for
`access_denied`, `invalid_state`, `login_required`, `server_error`, and
`token_exchange_failed`. The optional `layout` defaults to a passthrough and receives an
`Auth.LoginPage.Restricted` footer node.

## Public API

| Symbol                        | Kind      | Purpose                                                     |
| ----------------------------- | --------- | ----------------------------------------------------------- |
| `FederatedLoginPage`          | component | IdP sign-in landing: button, `?error=` alert, auth redirect |
| `FederatedLoginPageProps`     | type      | `{ login, loading, authenticated, layout? }`                |
| `authFederatedTranslationsEn` | const     | Flat `Auth.*` English bundle (`translation` namespace)      |
| `authFederatedTranslationsFr` | const     | Flat `Auth.*` French bundle (`translation` namespace)       |

`FederatedLoginPageProps`: `login: () => void` starts the redirect, `loading: boolean`
disables the button and swaps its label to `Auth.SigningIn`, `authenticated: boolean`
triggers the home redirect, and `layout?: ComponentType<{ children; footer? }>` supplies
the host's public-page chrome (logo / centered card).

## i18n

The bundles ship **flat** `Auth.*` keys in the `translation` namespace. Register them with
`addResourceBundle(lng, 'translation', bundle, true, true)`. The page looks keys up with a
plain `t('Auth.AccessDenied.server_error')` — the lookup relies on the host i18n instance
having `keySeparator` / `nsSeparator` disabled (the Granit `@granit/react-localization`
default), so these are single flat string keys, not nested namespace traversals. The
`?error=` value is interpolated straight into the key (`Auth.AccessDenied.${error}`); an
unrecognised code falls through to i18next's missing-key handling rather than a curated
message.

## Out of scope / caveats

- **No auth transport.** This package starts no redirect and exchanges no tokens — it only
  calls the `login()` the host hands it and reads the auth booleans. The redirect, PKCE,
  and token exchange belong to the per-provider `@granit/react-authentication-*` package
  and the BFF.
- **No credentials form.** Federated login delegates the password/MFA UI to the external
  IdP. For self-hosted credentials, passkey, and two-factor screens use
  [`@granit/react-ui-authentication-local`](../react-ui-authentication-local).
- **Router-bound.** It calls `useSearchParams` and renders `Navigate`, so it must mount
  inside a `react-router` router; outside one it throws.
- **Error display is a hint.** The `?error=` alert is purely informational; the IdP and
  BFF remain the authority on whether a session is valid. Do not treat the absence of an
  error param as proof of an authenticated session — gate on the `authenticated` prop.

## License

Apache-2.0
