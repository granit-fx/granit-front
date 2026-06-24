# @granit/account

Framework-agnostic **account self-service** SDK — the TypeScript counterpart of
the .NET `Granit.Identity.Local.Endpoints` module (`/account/*` routes;
contract snapshot in [`contracts/openapi/identity-local.json`](../../../contracts/openapi/identity-local.json)).

It exposes the request/response **types** and thin **Axios API functions** for a
signed-in (or anonymous) user to manage their own account: registration and
email confirmation, profile, password, two-factor (TOTP authenticator app +
email one-time-code), external OAuth/OIDC logins, WebAuthn passkeys, session
heartbeat / impersonation exit, email change, and account deletion. It holds
**no** React, DOM or Node-only dependency — every function takes the caller's
`AxiosInstance` plus a `basePath` (the `/account` collection root), so the same
calls work from React, React Native, a CLI or tests.

This is the bottom layer of the account split: the React Query hooks live in
[`@granit/react-account`](../react-account) and the self-service admin UI kit in
[`@granit/react-ui-account`](../react-ui-account). The passkey **assertion**
(sign-in) ceremony is intentionally not here — it belongs to the login flow in
`@granit/authentication-local`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the peers a consumer
must provide:

- `@granit/api-client` — supplies `AxiosInstance` (CSRF / auth / tenant
  interceptors) and the `HttpError` / `isAxiosError` helpers re-thrown here.
- `@granit/types` — branded id types (`UserId`, `EntityId`, `ISODateString`).

## Quick start

```ts
import { getProfile, changePassword, getTwoFactorStatus } from '@granit/account';
import type { AccountProfileResponse } from '@granit/account';
import { apiClient } from '@granit/api-client';

// `basePath` is the Identity.Local collection root — every call hangs off it.
const basePath = '/api/v1/account';

const profile: AccountProfileResponse = await getProfile(apiClient, basePath);

if (profile.hasPassword) {
  await changePassword(apiClient, basePath, {
    currentPassword: '...',
    newPassword: '...',
  });
}

const tfa = await getTwoFactorStatus(apiClient, basePath);
// tfa.isEnabled / tfa.hasAuthenticatorApp / tfa.hasEmailOtp / tfa.recoveryCodesLeft
```

The external-login callback is a discriminated union — narrow on `status`:

```ts
import { externalLoginCallback, completeExternalRegistration } from '@granit/account';

const result = await externalLoginCallback(apiClient, basePath, 'Google');

if (result.status === 'needs-profile-completion') {
  await completeExternalRegistration(apiClient, basePath, {
    token: result.continuationToken,
    email: result.prefill.email ?? '',
  });
}
// result.status === 'completed' → session already established server-side.
```

## Public API

All functions take `(client, basePath, …)` unless noted; mutating flows that
touch credentials require the current password as step-up authentication.

### Registration & email

| Symbol                             | Kind | Purpose                                                  |
| ---------------------------------- | ---- | -------------------------------------------------------- |
| `registerAccount`                  | fn   | `POST /register` — async, `202`, no body                 |
| `confirmEmail`                     | fn   | `GET /confirm-email?userId&token`                        |
| `resendConfirmationEmail`          | fn   | `POST /resend-confirmation-email` (authenticated)        |
| `changeEmail`                      | fn   | `POST /change-email` — anti-enumeration `202`            |
| `confirmEmailChange`               | fn   | `POST /confirm-email-change` (anonymous, token)          |
| `AccountRegisterRequest`           | type | `POST /register` body                                    |
| `AccountChangeEmailRequest`        | type | `POST /change-email` body (new email + current password) |
| `AccountConfirmEmailChangeRequest` | type | `POST /confirm-email-change` body                        |

### Profile & settings

| Symbol                        | Kind | Purpose                                                       |
| ----------------------------- | ---- | ------------------------------------------------------------- |
| `getProfile`                  | fn   | `GET /profile`                                                |
| `updateProfile`               | fn   | `PUT /profile` (name fields only)                             |
| `getAccountSettings`          | fn   | `GET /config` (anonymous) — self-registration + providers     |
| `AccountProfileResponse`      | type | Profile payload (email, names, 2FA, external logins)          |
| `AccountProfileUpdateRequest` | type | `PUT /profile` body                                           |
| `AccountSettingsResponse`     | type | Public config — `allowSelfRegistration` + `externalProviders` |

### Password

| Symbol                         | Kind | Purpose                                          |
| ------------------------------ | ---- | ------------------------------------------------ |
| `changePassword`               | fn   | `POST /change-password` (authenticated)          |
| `forgotPassword`               | fn   | `POST /forgot-password` — anti-enumeration `202` |
| `resetPassword`                | fn   | `POST /reset-password` (anonymous, token)        |
| `AccountPasswordChangeRequest` | type | `POST /change-password` body                     |
| `AccountForgotPasswordRequest` | type | `POST /forgot-password` body                     |
| `AccountPasswordResetRequest`  | type | `POST /reset-password` body                      |

### Two-factor (TOTP + email OTP)

| Symbol                                | Kind | Purpose                                                   |
| ------------------------------------- | ---- | --------------------------------------------------------- |
| `getTwoFactorStatus`                  | fn   | `GET /two-factor`                                         |
| `getAuthenticatorKey`                 | fn   | `GET /two-factor/authenticator-key` — shared key + QR URI |
| `enableTwoFactor`                     | fn   | `POST /two-factor/enable` — verify TOTP, returns codes    |
| `disableTwoFactor`                    | fn   | `POST /two-factor/disable` (password step-up)             |
| `generateRecoveryCodes`               | fn   | `POST /two-factor/recovery-codes` (password step-up)      |
| `sendTwoFactorEmailEnrollmentCode`    | fn   | `POST /two-factor/email/send`                             |
| `enableTwoFactorEmail`                | fn   | `POST /two-factor/email/enable`                           |
| `disableTwoFactorEmail`               | fn   | `POST /two-factor/email/disable` (password step-up)       |
| `AccountTwoFactorStatusResponse`      | type | Enabled flags + `recoveryCodesLeft`                       |
| `AccountAuthenticatorKeyResponse`     | type | `sharedKey` + `qrCodeUri`                                 |
| `AccountTwoFactorEnableRequest`       | type | TOTP `code` body                                          |
| `AccountTwoFactorEmailEnableRequest`  | type | Email OTP `code` body                                     |
| `AccountTwoFactorEnableResponse`      | type | Returned `recoveryCodes`                                  |
| `AccountRecoveryCodesResponse`        | type | Regenerated `recoveryCodes`                               |
| `AccountTwoFactorDisableRequest`      | type | Password step-up body                                     |
| `AccountGenerateRecoveryCodesRequest` | type | Password step-up body                                     |

### External logins (OAuth / OIDC)

| Symbol                                       | Kind | Purpose                                                  |
| -------------------------------------------- | ---- | -------------------------------------------------------- |
| `getExternalLogins`                          | fn   | `GET /external-logins` — linked providers                |
| `challengeExternalLogin`                     | fn   | `POST /external-logins/challenge/{provider}` (XHR)       |
| `getExternalLoginStartUrl`                   | fn   | Build the `…/start` URL for a top-level navigation       |
| `externalLoginCallback`                      | fn   | `GET /external-logins/callback?mode=json` (headless)     |
| `completeExternalRegistration`               | fn   | `POST /external-logins/complete-registration`            |
| `unlinkExternalLogin`                        | fn   | `DELETE /external-logins/{provider}`                     |
| `AccountExternalLoginInfo`                   | type | One linked provider descriptor                           |
| `AccountExternalLoginCallbackResponse`       | type | Union of the two callback variants                       |
| `AccountExternalLoginCompleted`              | type | `status: 'completed'` variant                            |
| `AccountExternalLoginNeedsProfile`           | type | `status: 'needs-profile-completion'` variant             |
| `AccountExternalLoginPrefill`                | type | Provider-proposed profile fields                         |
| `AccountCompleteExternalRegistrationRequest` | type | Completion body (continuation token + email)             |
| `ExternalLoginProvider`                      | type | Anonymous sign-in provider from `GET /config`            |
| `ExternalProviderType`                       | type | Open union brand-icon kind (`Google` … `Oidc`, or `str`) |

### Passkeys (WebAuthn)

| Symbol                              | Kind | Purpose                                                     |
| ----------------------------------- | ---- | ----------------------------------------------------------- |
| `getPasskeys`                       | fn   | `GET /passkeys`                                             |
| `beginPasskeyRegistration`          | fn   | `POST /passkeys/register/begin` — raw creation-options JSON |
| `completePasskeyRegistration`       | fn   | `POST /passkeys/register/complete`                          |
| `renamePasskey`                     | fn   | `PATCH /passkeys/{id}`                                      |
| `deletePasskey`                     | fn   | `DELETE /passkeys/{id}`                                     |
| `AccountPasskeyInfo`                | type | Passkey descriptor (`id`, `name`, timestamps)               |
| `AccountPasskeyRegistrationRequest` | type | `credentialJson` (+ optional `name`)                        |
| `AccountPasskeyCreatedResponse`     | type | Alias of `AccountPasskeyInfo`                               |
| `AccountPasskeyRenameRequest`       | type | `{ name }` body                                             |
| `PasskeyId`                         | type | Branded `EntityId<'Passkey'>`                               |

### Session & deletion

| Symbol                       | Kind | Purpose                                                    |
| ---------------------------- | ---- | ---------------------------------------------------------- |
| `sessionHeartbeat`           | fn   | `POST /session/heartbeat` — call ~every 5 min while active |
| `backToImpersonator`         | fn   | `POST /session/back-to-impersonator` — exit impersonation  |
| `deleteAccount`              | fn   | `POST /delete` — async, GDPR Art. 17                       |
| `AccountImpersonationResult` | type | Re-issued tokens after exiting impersonation               |
| `AccountDeleteRequest`       | type | `{ password }` step-up body                                |

## Out of scope / caveats

- **Login / passkey assertion** — sign-in (including `beginPasskeyAssertion`)
  lives in `@granit/authentication-local`, not here. This package is purely the
  *signed-in / self-service* surface plus the anonymous registration and
  password-reset entry points.
- **`getExternalLoginStartUrl` is for top-level navigation, not XHR.** The
  backend responds `302` to the provider, so feed the returned URL to
  `window.location.assign(...)`. `challengeExternalLogin` is the XHR variant and
  re-throws a typed `HttpError` for `400` (provider not configured) and `500`
  (handler not registered).
- **Anti-enumeration.** `forgotPassword` and `changeEmail` always return `202`
  whether or not the address exists — never branch UX on their outcome to infer
  account existence.
- **Step-up authentication.** Disabling 2FA, regenerating recovery codes and
  deleting the account require the current password in the request body
  (OWASP ASVS V2.8.1) — surface a re-auth prompt before calling them.
- **RGPD / GDPR.** `deleteAccount` is the Art. 17 right-to-erasure entry point;
  deletion is processed asynchronously server-side. Treat recovery codes,
  passkey credentials and the authenticator shared key as secrets — never log
  them.
- **Server is authoritative.** These functions are a typed contract over the
  `/account` routes; every permission, ownership and validation check is
  enforced by `Granit.Identity.Local` on the backend, not here.

## License

Apache-2.0
