# @granit/react-authentication-local

React hooks + provider for **local credential login** — the React layer over the
framework-agnostic [`@granit/authentication-local`](../authentication-local) SDK,
itself the TypeScript counterpart of the .NET `Granit.Identity.Local.Endpoints`
module (`granit-dotnet/src/Granit.Identity.Local.Endpoints`,
`contracts/openapi/identity-local.json`).

This package wraps the core login calls (password login, two-factor verification,
WebAuthn passkey assertion) as `@tanstack/react-query` mutations, resolving the
Axios client and base path from a `LocalAuthProvider` context. It covers the
**interactive login** surface only: on success the backend sets an ASP.NET Core
Identity session cookie, after which the caller redirects to the OIDC
authorization endpoint (`/connect/authorize`) to complete the token exchange.

Sibling-package split:

- [`@granit/authentication-local`](../authentication-local) — framework-agnostic
  core (request/response types + bare HTTP calls); no React/DOM dependency.
- **`@granit/react-authentication-local`** (this package) — React Query hooks +
  provider.
- [`@granit/react-ui-authentication-local`](../react-ui-authentication-local) —
  the end-user login UI feature kit (forms, screens) built on these hooks.

Account self-service (registration, password reset, passkey enrollment, profile,
2FA management) lives in [`@granit/account`](../account) /
[`@granit/react-account`](../react-account), **not** here.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors); login requires `withCredentials: true` so the Identity session
  cookie is stored.
- `@granit/authentication-local` — the core login types and HTTP calls these
  hooks wrap.
- `@granit/react-api-client` — provides `<GranitClientProvider>` /
  `useOptionalGranitClient`, the fallback source for the Axios client.
- `@tanstack/react-query` (`^5`) — every hook is a `useMutation`.
- `react` (`^19`).
- `msw` (`^2`, **optional**) — only needed to import the `/testing` MSW handlers.

## Quick start

```tsx
import {
  LocalAuthProvider,
  useLoginWithRedirect,
  useVerifyTwoFactorLogin,
} from '@granit/react-authentication-local';

// Wrap the login route. `client` falls back to <GranitClientProvider> when
// omitted; `basePath` defaults to /api/v1/account.
function App() {
  return (
    <LocalAuthProvider config={{}}>
      <LoginPage />
    </LocalAuthProvider>
  );
}

function LoginPage() {
  // Submits credentials, then navigates to the ?returnUrl= on success —
  // the BFF headless-login flow that drives /connect/authorize.
  const { loginAndRedirect, mutation } = useLoginWithRedirect({
    onTwoFactorRequired: () => {
      /* show the 2FA step — login response had requiresTwoFactor: true */
    },
    onError: (error) => {
      /* generic 401 for invalid / locked-out / not-allowed (anti-enumeration) */
    },
  });

  return (
    <button
      disabled={mutation.isPending}
      onClick={() => loginAndRedirect({ login: 'user@example.com', password })}
    >
      Sign in
    </button>
  );
}

// Second factor — `method` must be one of the login response's twoFactorMethods.
function TwoFactorStep() {
  const verify = useVerifyTwoFactorLogin();
  return (
    <button onClick={() => verify.mutate({ code, method: 'Authenticator' })}>
      Verify
    </button>
  );
}
```

## Public API

| Symbol                           | Kind     | Purpose                                                               |
|----------------------------------|----------|-----------------------------------------------------------------------|
| `LocalAuthProvider`              | provider | Supplies the Axios `client` + `basePath` to every hook below          |
| `useLocalAuthConfig`             | hook     | Reads resolved `{ client, basePath }`; throws outside the provider    |
| `LocalAuthConfig`                | type     | Provider input: optional `client` (Axios) and `basePath`              |
| `LocalAuthProviderProps`         | type     | `{ config, children }` props of `LocalAuthProvider`                   |
| `useLogin`                       | hook     | `POST {basePath}/login` (email/username + password)                   |
| `useLoginWithRedirect`           | hook     | Wraps `useLogin` with auto-redirect to `?returnUrl=` (+ 2FA/error cb) |
| `UseLoginWithRedirectOptions`    | type     | `search` / `fallbackUrl` / `onTwoFactorRequired` / `onError` config   |
| `UseLoginWithRedirectResult`     | type     | `{ loginAndRedirect, mutation }` return shape                         |
| `useVerifyTwoFactorLogin`        | hook     | `POST {basePath}/login/two-factor` (Authenticator/Email/RecoveryCode) |
| `useSendTwoFactorLoginEmailCode` | hook     | `POST {basePath}/login/two-factor/send-email` (no args; cookie user)  |
| `useBeginPasskeyAssertion`       | hook     | `POST {basePath}/passkeys/assertion/begin` -> WebAuthn options (JSON) |
| `useCompletePasskeyAssertion`    | hook     | `POST {basePath}/passkeys/assertion/complete` after WebAuthn `get()`  |

Request/response types (`AccountLoginRequest`, `AccountLoginResponse`,
`AccountTwoFactorLoginRequest`, `AccountPasskeyLoginRequest`, `TwoFactorMethod`)
are re-exported from [`@granit/authentication-local`](../authentication-local) —
import them from there.

### `/testing` subpath

MSW fixtures for tests (`msw` peer required). Covers the **login** endpoints only
— account self-service handlers live in `@granit/react-account/testing`.

| Symbol                       | Kind  | Purpose                                                      |
|------------------------------|-------|--------------------------------------------------------------|
| `createLocalAuthHandlers`    | fn    | MSW handlers for login, two-factor, and passkey assertion    |
| `mockLoginSuccess`           | const | `AccountLoginResponse` with `succeeded: true`                |
| `mockLoginRequiresTwoFactor` | const | Login response with `requiresTwoFactor` + `twoFactorMethods` |
| `mockLoginNotAllowed`        | const | Login response with `isNotAllowed: true`                     |
| `MOCK_CREDENTIALS`           | const | Fixture login + password the success handler accepts         |
| `MOCK_TOTP_CODE`             | const | Authenticator code accepted by the 2FA handler               |
| `MOCK_EMAIL_OTP_CODE`        | const | Email OTP code accepted by the 2FA handler                   |
| `MOCK_RECOVERY_CODE`         | const | Sample recovery code fixture                                 |

## Caveats

- **Session cookie, not a token.** Login sets an ASP.NET Core Identity session
  cookie server-side; the Axios `client` **must** use `withCredentials: true`.
  These hooks return no token — completing the OIDC exchange is the caller's job
  (redirect to `/connect/authorize`, which `useLoginWithRedirect` drives via
  `returnUrl`).
- **Anti-enumeration error handling.** Invalid credentials, locked-out, and
  not-allowed (e.g. unconfirmed email) all surface as a generic `401`
  `AxiosError<ProblemDetails>` — never a `200` body — to prevent account
  enumeration. Inspect `error.response` (the `detail` distinguishes cases) to
  tailor the message; do not assume a structured failure payload.
- **Offer only server-listed 2FA methods.** Render only the factors present in
  the login response's `twoFactorMethods`; `Email` appears only when the user has
  opted in. `useSendTwoFactorLoginEmailCode` takes no arguments — the server
  resolves the pending user from the two-factor session cookie.
- **Passkey ceremony is two-step.** `useBeginPasskeyAssertion` returns the
  WebAuthn request options as a JSON **string**; pass it to
  `navigator.credentials.get()`, then submit the result via
  `useCompletePasskeyAssertion`. This package does not call the WebAuthn API for
  you.

## Out of scope

- **Account self-service** (registration, password reset, email/passkey
  enrollment, profile, 2FA setup) — see [`@granit/account`](../account) /
  [`@granit/react-account`](../react-account).
- **Login UI** (forms, screens, validation messages) — see
  [`@granit/react-ui-authentication-local`](../react-ui-authentication-local).
- **Federated / external providers** (Cognito, Entra ID, Google Cloud, Keycloak)
  — separate `@granit/authentication-*` packages.

## License

Apache-2.0
