# @granit/react-account

React Query **hooks + provider** for account self-service — the React layer over
the framework-agnostic [`@granit/account`](../account) SDK (TypeScript counterpart
of the .NET `Granit.Identity.Local.Endpoints` module; `/account/*` routes, contract
snapshot in
[`contracts/openapi/identity-local.json`](../../../contracts/openapi/identity-local.json)).

This package owns the **headless** layer of the account split: an `AccountProvider`
that resolves the `AxiosInstance` + `basePath`, a query-key factory, and one hook per
self-service operation — profile, registration / email confirmation, password,
two-factor (TOTP authenticator app + email one-time-code), external OAuth/OIDC
logins, WebAuthn passkeys, session heartbeat / impersonation exit, email change and
account deletion. It holds no visual component. The bottom SDK layer is
[`@granit/account`](../account); the self-service admin UI kit that composes these
hooks is [`@granit/react-ui-account`](../react-ui-account). The passkey **assertion**
(sign-in) ceremony is intentionally absent — it belongs to the login flow in
`@granit/authentication-local`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
to a public registry for app consumption. Declare the peers a consumer must provide:

- `@granit/account` — the SDK whose API functions every hook wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF / auth / tenant
  interceptors) and the `HttpError` type surfaced on external-login mutations.
- `@granit/react-api-client` — exposes `<GranitClientProvider>` /
  `useOptionalGranitClient`, the fallback source of the Axios client.
- `@tanstack/react-query` (`^5`) — query/mutation engine and `QueryClientProvider`.
- `react` (`^19`).
- `msw` (`^2`, optional) — only needed to pull the `@granit/react-account/testing`
  MSW handlers; not a runtime dependency.

## Quick start

Wrap the subtree once. `config.client` is optional — when omitted, the provider
falls back to the nearest `<GranitClientProvider>`; it throws if neither is present.
`basePath` defaults to `/api/v1/account`.

```tsx
import { AccountProvider, useProfile, useChangePassword } from '@granit/react-account';

function App() {
  return (
    <AccountProvider config={{ client: axiosInstance }}>
      <ProfilePage />
    </AccountProvider>
  );
}

function ProfilePage() {
  const { data: profile } = useProfile();
  const { mutate: changePassword, isPending } = useChangePassword();

  return (
    <section>
      <h1>{profile?.email}</h1>
      <button
        disabled={isPending}
        onClick={() =>
          changePassword({ currentPassword: '…', newPassword: '…' })
        }
      >
        Change password
      </button>
    </section>
  );
}
```

External logins use a top-level browser navigation, not an XHR — build the start URL
with the bound builder rather than mutating from a hook:

```tsx
import { useExternalLoginStartUrl } from '@granit/react-account';

function SignInWithGoogle() {
  const buildStartUrl = useExternalLoginStartUrl();
  return (
    <a href={buildStartUrl('Google', '/account/profile')}>Sign in with Google</a>
  );
}
```

## Public API

| Symbol                                | Kind     | Purpose                                                                |
| ------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `AccountProvider`                     | provider | Resolves `client` (own or `<GranitClientProvider>`) + `basePath`       |
| `useAccountConfig`                    | hook     | Reads the resolved `{ client, basePath, queryKeyPrefix }` from context |
| `buildAccountQueryKey`                | fn       | Query-key factory: `[...prefix, ...segments]`                          |
| `AccountConfig`                       | type     | Provider input: optional `client` / `basePath` / `queryKeyPrefix`      |
| `AccountProviderProps`                | type     | `{ config, children }`                                                 |
| `useAccountSettings`                  | hook     | `GET /config` — public settings (anonymous, `staleTime: Infinity`)     |
| `useAvailableExternalProviders`       | hook     | Selector over settings → external provider list (empty while loading)  |
| `AvailableExternalProviders`          | type     | `{ providers, isLoading }` returned by the selector                    |
| `useProfile`                          | hook     | `GET /profile` — current user's profile                                |
| `useUpdateProfile`                    | hook     | `PUT /profile`; invalidates the profile query                          |
| `useRegister`                         | hook     | `POST /register` — sign up (202, no body)                              |
| `useConfirmEmail`                     | hook     | Confirm email via `{ userId, token }` from the link                    |
| `useResendConfirmation`               | hook     | Re-send the confirmation email                                         |
| `ConfirmEmailVariables`               | type     | `{ userId, token }` mutation input                                     |
| `useChangePassword`                   | hook     | `POST /change-password` (current + new password)                       |
| `useForgotPassword`                   | hook     | `POST /forgot-password` — request reset email                          |
| `useResetPassword`                    | hook     | `POST /reset-password` — apply reset via emailed token                 |
| `useTwoFactorStatus`                  | hook     | `GET /two-factor` — TOTP / email-OTP / recovery-codes status           |
| `useAuthenticatorKey`                 | hook     | `GET /two-factor/authenticator-key` — shared key + `otpauth://` QR URI |
| `useEnableTwoFactor`                  | hook     | Enable TOTP with a code → recovery codes; invalidates status           |
| `useDisableTwoFactor`                 | hook     | Disable TOTP (password-confirmed); invalidates status                  |
| `useGenerateRecoveryCodes`            | hook     | Regenerate recovery codes (password-confirmed)                         |
| `useSendTwoFactorEmailEnrollmentCode` | hook     | Send email enrollment code to begin the email-OTP factor               |
| `useEnableTwoFactorEmail`             | hook     | Enable the email-OTP factor with an enrollment code                    |
| `useDisableTwoFactorEmail`            | hook     | Disable the email-OTP factor (password-confirmed)                      |
| `useExternalLogins`                   | hook     | `GET /external-logins` — linked OAuth/OIDC providers                   |
| `useChallengeExternalLogin`           | hook     | Initiate an OAuth challenge; `error` is an `HttpError` (400 / 500)     |
| `useExternalLoginStartUrl`            | hook     | Builder for the challenge start URL (top-level navigation, not XHR)    |
| `useCompleteExternalRegistration`     | hook     | Finish a profile-completion external registration (`HttpError` codes)  |
| `useUnlinkExternalLogin`              | hook     | Unlink a provider; invalidates external logins                         |
| `usePasskeys`                         | hook     | `GET /passkeys` — registered WebAuthn credentials                      |
| `useBeginPasskeyRegistration`         | hook     | Begin registration; resolves to raw WebAuthn options JSON              |
| `useCompletePasskeyRegistration`      | hook     | Complete registration; invalidates passkeys                            |
| `useRenamePasskey`                    | hook     | Rename a passkey via `{ id, request }`; invalidates passkeys           |
| `useDeletePasskey`                    | hook     | Delete a passkey by id; invalidates passkeys                           |
| `RenamePasskeyVariables`              | type     | `{ id, request }` mutation input                                       |
| `useSessionHeartbeat`                 | hook     | `POST /session/heartbeat` — keep the session alive                     |
| `useBackToImpersonator`               | hook     | Exit impersonation, returning the original admin session               |
| `useChangeEmail`                      | hook     | `POST /change-email` — request an email change                         |
| `useConfirmEmailChange`               | hook     | Confirm the email change via the emailed token                         |
| `useDeleteAccount`                    | hook     | `POST /delete` — request account deletion (GDPR Art. 17)               |

All request/response **types** (`AccountProfileResponse`, `AccountRegisterRequest`,
`AccountTwoFactorStatusResponse`, `ExternalLoginProvider`, …) are owned by and
re-exported from [`@granit/account`](../account) — import domain types from there.

### Testing subpath — `@granit/react-account/testing`

Stateful MSW handlers and mock fixtures for component / hook tests (requires the
optional `msw` peer):

| Symbol                  | Kind  | Purpose                                                   |
| ----------------------- | ----- | --------------------------------------------------------- |
| `createAccountHandlers` | fn    | Stateful MSW handlers for all `/account/*` routes         |
| `mockProfile`           | const | Profile fixture                                           |
| `mockAccountSettings`   | const | Settings fixture (self-registration + external providers) |
| `mockTwoFactorStatus`   | const | Two-factor status fixture                                 |
| `mockPasskeys`          | const | Passkey list fixture                                      |
| `mockExternalLogins`    | const | Linked external-login fixture                             |

`createAccountHandlers(baseUrl?, options?)` mutates in-memory state, so writes are
reflected by subsequent reads. `options.unavailableProviders` makes named providers
return `500` on challenge (configured-but-unregistered handler); `options.externalProviders`
overrides the `GET /config` provider list (pass `[]` for the empty state).

## Caveats

- **Provider input shape.** `AccountProvider` takes a single `config` prop
  (`<AccountProvider config={{ client, basePath }}>`), not flat `client` / `basePath`
  props. The provider memoizes the resolved config and **throws synchronously** if no
  Axios client can be found.
- **Fail-closed settings.** `useAccountSettings` does not retry and caches forever;
  treat `data?.allowSelfRegistration ?? false` so a failed config fetch disables
  registration by default rather than opening it.
- **External logins are navigations, not fetches.** Use `useExternalLoginStartUrl`
  with `window.location.assign(...)` / an `<a href>` for the OAuth start; the
  builder returns a URL string and performs no XHR.
- **Passkey registration returns raw options.** `useBeginPasskeyRegistration` resolves
  to the WebAuthn options as a raw JSON **string** — hand it to the WebAuthn ceremony,
  do not assume a parsed object.
- **External provider list is backend-owned.** There is no hardcoded provider
  registry; `useAvailableExternalProviders` returns an empty list until `GET /config`
  resolves so UIs render no buttons rather than a flash of static fallbacks.
- **Security boundary.** These hooks drive a user's *own* account self-service; the
  .NET backend remains the only authority. Client state (2FA status, linked logins,
  passkeys) is a UX hint — never an access-control decision.

## License

Apache-2.0
