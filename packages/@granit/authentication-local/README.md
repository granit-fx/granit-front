# @granit/authentication-local

Framework-agnostic **local credential authentication** SDK — the headless
TypeScript counterpart of the .NET `Granit.Identity.Local.Endpoints` module
(`granit-dotnet/src/Granit.Identity.Local.Endpoints`). It mirrors the
`contracts/openapi/identity-local.json` contract for the login surface:
password login, two-factor verification, and WebAuthn passkey assertion.

It exposes the request/response types and the bare HTTP calls needed to drive a
headless login from any client — React, React Native, a CLI, tests. It holds
**no** React, DOM-rendering or Node-only dependency (the lone `globalThis`
access is a guarded `location` read in `extractReturnUrl`). The React hooks
layer lives in [`@granit/react-authentication-local`](../react-authentication-local);
the end-user login/registration UI kit lives in
[`@granit/react-ui-authentication-local`](../react-ui-authentication-local). The
provider-agnostic OIDC primitives shared across providers live in
[`@granit/authentication`](../authentication).

This package covers the **interactive login** flow only — it sets the ASP.NET
Core Identity session cookie, after which the caller redirects to the OIDC
authorization endpoint (`/connect/authorize`) to complete the token exchange.
Account self-service (registration, password reset, passkey enrollment, profile)
lives in [`@granit/account`](../account).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
`@granit/api-client` as a peer; pass its `AxiosInstance` (configured with
`withCredentials: true` so the browser accepts the session `Set-Cookie`).

## Quick start

```ts
import {
  loginAccount,
  verifyTwoFactorLogin,
  sendTwoFactorLoginEmailCode,
  extractReturnUrl,
} from '@granit/authentication-local';
import { apiClient } from '@granit/api-client';

// `basePath` is the Identity.Local account root from the contract.
const basePath = '/account';

// 1. Submit credentials. On success the server sets the Identity cookie.
const result = await loginAccount(apiClient, basePath, {
  login: 'jane@example.com',
  password: '••••••••',
  rememberMe: true,
});

if (result.requiresTwoFactor) {
  // 2. Offer ONLY the factors the server returned. If the user picks "Email":
  if (result.twoFactorMethods?.includes('Email')) {
    await sendTwoFactorLoginEmailCode(apiClient, basePath);
  }

  // 3. Verify the second factor (defaults to the authenticator app).
  await verifyTwoFactorLogin(apiClient, basePath, {
    code: '123 456',
    method: 'Email',
    rememberMe: true,
  });
}

// 4. Resume the OIDC ceremony the Identity Server originally intended.
const returnUrl = extractReturnUrl(); // null when absent or off-origin
globalThis.location.assign(returnUrl ?? '/connect/authorize');
```

Passkey login swaps step 1 for the WebAuthn assertion ceremony:

```ts
import {
  beginPasskeyAssertion,
  completePasskeyAssertion,
} from '@granit/authentication-local';

const optionsJson = await beginPasskeyAssertion(apiClient, '/account');
const credential = await navigator.credentials.get(JSON.parse(optionsJson));

const result = await completePasskeyAssertion(apiClient, '/account', {
  credentialJson: JSON.stringify(credential),
});
```

## Public API

| Symbol                         | Kind  | Purpose                                                           |
| ------------------------------ | ----- | ---------------------------------------------------------------- |
| `AccountLoginRequest`          | type  | `POST {basePath}/login` body (`login`, `password`, `rememberMe?`) |
| `AccountLoginResponse`         | type  | Login outcome flags + `twoFactorMethods?`                        |
| `AccountTwoFactorLoginRequest` | type  | `POST {basePath}/login/two-factor` body (`code`, `method?`)      |
| `AccountPasskeyLoginRequest`   | type  | `POST {basePath}/passkeys/assertion/complete` body              |
| `TwoFactorMethod`              | type  | `'Authenticator' \| 'RecoveryCode' \| 'Email'`                  |
| `loginAccount`                 | fn    | `POST {basePath}/login` — sets the Identity session cookie       |
| `verifyTwoFactorLogin`         | fn    | `POST {basePath}/login/two-factor` — completes the 2FA challenge |
| `sendTwoFactorLoginEmailCode`  | fn    | `POST {basePath}/login/two-factor/send-email` — email OTP        |
| `beginPasskeyAssertion`        | fn    | `POST {basePath}/passkeys/assertion/begin` — WebAuthn options    |
| `completePasskeyAssertion`     | fn    | `POST {basePath}/passkeys/assertion/complete` — WebAuthn finish  |
| `extractReturnUrl`             | fn    | Parse a same-origin `returnUrl` from a URL search string         |
| `IdentityLocalPermissions`     | const | Permission keys mirroring the .NET catalog                       |

## Out of scope / caveats

- **Open-redirect safety.** `extractReturnUrl` returns only the **path** of a
  **same-origin** `returnUrl` — absolute, protocol-relative (`//evil.com`), and
  backslash-authority (`/\evil.com`, `\\evil.com`) URLs are rejected (security
  audit VULN-202). Never feed a raw `returnUrl` to `location.assign` without it.
- **Cookies, not tokens.** These calls authenticate against ASP.NET Core
  Identity and rely on the session cookie — the `AxiosInstance` must use
  `withCredentials: true`. This package issues no access token; redirect to
  `/connect/authorize` afterwards to obtain one.
- **Server-driven 2FA methods.** Offer only the factors in
  `AccountLoginResponse.twoFactorMethods`; `"Email"` appears only when the user
  has opted in. `twoFactorMethods` is typed as `readonly string[]` because the
  set is server-owned and may grow independently of this SDK.
- **`sendTwoFactorLoginEmailCode` is a silent no-op** (still `204`) when the
  user has not enrolled the email factor; it returns `400` when there is no
  active two-factor session cookie.
- **`IdentityLocalPermissions`** (impersonation, local-role CRUD) gate
  **admin** endpoints handled elsewhere — they are not consumed by the login
  calls in this package, only re-exported as the canonical key source.
- **No React, no hooks, no UI.** Query hooks belong in
  [`@granit/react-authentication-local`](../react-authentication-local); the
  login/registration screens belong in
  [`@granit/react-ui-authentication-local`](../react-ui-authentication-local).
  Federated (external) login and passkey **enrollment** are out of scope here.
