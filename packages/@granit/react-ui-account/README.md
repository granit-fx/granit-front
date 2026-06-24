# @granit/react-ui-account

Self-service **Account** admin feature kit — the visual layer for a signed-in user
managing their *own* account: profile, account deletion, password, two-factor,
passkeys, external logins, the anonymous "was this you?" sign-in review, and the
caller's own sessions/devices cards. This is the **react-ui** layer: ready-to-mount
pages and cards that compose the headless hooks/providers from
[`@granit/react-account`](../react-account) and [`@granit/react-identity`](../react-identity)
with the foundation UI ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-identity`](../react-ui-identity)). It holds no Axios calls and no
DTOs of its own — only rendering, local form state, and host-injected slots.

The account routes are part of the .NET `Granit.Identity` module: profile / password /
two-factor / passkeys / external-logins under `/account/*`
(`contracts/openapi/identity-local.json`), and sessions / devices / sign-in-review under
`/sessions`, `/devices`, `/sessions/review` (`contracts/openapi/identity.json`). The
sibling split is two domains, each three layers deep:

- account self-service: [`@granit/account`](../account) (core DTOs + Axios) →
  [`@granit/react-account`](../react-account) (hooks/providers) →
  `@granit/react-ui-account` (this kit).
- sessions / devices / review: [`@granit/identity`](../identity) →
  [`@granit/react-identity`](../react-identity) →
  [`@granit/react-ui-identity`](../react-ui-identity), whose `SessionsCard` / `DevicesCard`
  this kit re-skins for the *self* audience.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published for
app consumption through a public registry. A consumer must declare these peers:

- `@granit/react-account` + `@granit/account` — headless account hooks and their DTOs.
- `@granit/react-identity` + `@granit/identity` — sessions/devices/review hooks and DTOs.
- `@granit/react-ui` — the shadcn/ui foundation (`Card`, `Button`, `Dialog`, `toast`, …).
- `@granit/react-ui-identity` — `SessionsCard` / `DevicesCard` and their label hooks.
- `@granit/react-ui-authentication-local` — `fromBase64Url` for WebAuthn challenge decoding.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/api-client` — `isAxiosError` / `HttpError` for error routing; supplies the
  Axios client resolved from a provider higher in the tree.
- `@granit/logger` — `createLogger`, the package's logging seam.
- `react` / `react-dom` (`^19`) and `react-router-dom` (`^7`) — `SecurityReviewPage` reads
  the token from the URL.
- `lucide-react` (`^1.21`) — icons; `qrcode.react` (`^4.2`) — the 2FA enrolment QR.

## Quick start

Mount the pages under the host's `AccountProvider` / `IdentityProvider` and a router,
and register the i18n bundles. The Axios client and the auth pattern are host-injected
(see Injection) — nothing pattern-specific is baked in.

```tsx
import {
  ProfilePage,
  PasswordPage,
  TwoFactorPage,
  PasskeysPage,
  ExternalLoginsPage,
  DeleteAccountPage,
  SessionsPage,
  SecurityReviewPage,
  accountTranslationsEn,
} from '@granit/react-ui-account';
import { useAuth } from '@granit/react-authentication';
import { Route, Routes } from 'react-router-dom';

i18n.addResourceBundle('en', 'translation', accountTranslationsEn, true, true);

function AccountRoutes({ sessionTrackingEnabled }: { sessionTrackingEnabled: boolean }) {
  const { logout } = useAuth(); // host's auth feature — lifted to a prop below
  return (
    <Routes>
      <Route path="profile" element={<ProfilePage />} />
      <Route path="security/password" element={<PasswordPage />} />
      <Route path="security/two-factor" element={<TwoFactorPage />} />
      <Route path="security/passkeys" element={<PasskeysPage />} />
      <Route path="security/external-logins" element={<ExternalLoginsPage />} />
      {/* Host computes `isBffMode || isMockMode`; the cards hide when false. */}
      <Route path="sessions" element={<SessionsPage sessionTrackingEnabled={sessionTrackingEnabled} />} />
      <Route path="delete" element={<DeleteAccountPage onDeleted={logout} />} />
    </Routes>
  );
}

// Anonymous, token-only — mounted on the PUBLIC shell, no AccountProvider needed
// (SecurityReviewPage carries its own IdentityProvider):
//   <Route path="/account/security/review" element={<SecurityReviewPage layout={PublicLayout} />} />
```

The pages are self-contained: each owns its loading/empty/error states and surfaces
mutation failures through the global `MutationCache.onError` toast (WebAuthn aborts and
`HttpError` challenge failures, which are *not* Axios errors, are toasted locally).

## Injection

The kit is decoupled from the host's auth pattern. The host wires four seams:

- **Session tracking** — `SessionsPage` / `MySessionsCard` / `MyDevicesCard` take
  `sessionTrackingEnabled: boolean`. Listing/revocation only works behind a cookie/BFF
  (or mock) session, so the host computes `isBffMode || isMockMode` and passes it; the
  cards render `null` when false. The package never references BFF / mock / auth-mode.
- **Sign-out callback** — `DeleteAccountPage` takes `onDeleted?: () => void`; the host
  passes its `useAuth().logout`. The package does not depend on the auth feature.
- **Layout slot** — `SecurityReviewPage` takes
  `layout?: React.ComponentType<{ readonly children: React.ReactNode }>` (defaults to a
  passthrough); the host passes its public/anonymous shell.
- **API client** — resolved from a `GranitClientProvider` / `AccountProvider` /
  `IdentityProvider` higher in the tree. No client is baked in.

## Public API

| Symbol                          | Kind      | Purpose                                                                      |
| ------------------------------- | --------- | ---------------------------------------------------------------------------- |
| `ProfilePage`                   | component | View / edit first & last name; shows email + confirmation status             |
| `DeleteAccountPage`             | component | Password-confirmed danger-zone deletion; `onDeleted` signs the host out      |
| `SessionsPage`                  | component | The caller's own sessions + devices; gated by `sessionTrackingEnabled`       |
| `PasswordPage`                  | component | Change the account password (current + new, with show/hide)                  |
| `TwoFactorPage`                 | component | Authenticator TOTP enrolment, recovery codes, opt-in email-OTP factor        |
| `PasskeysPage`                  | component | Register (WebAuthn) / rename / remove passkeys                               |
| `ExternalLoginsPage`            | component | List / unlink linked providers; link a new one                               |
| `SecurityReviewPage`            | component | Anonymous token-protected "Was this you?" page (`?token=`)                   |
| `MySessionsCard`                | component | Self sessions card over `react-ui-identity` `SessionsCard`                   |
| `MyDevicesCard`                 | component | Self devices card over `react-ui-identity` `DevicesCard`                     |
| `ExternalLoginButtons`          | component | One OAuth challenge button per available provider (`sign-in` / `link`)       |
| `ExternalProviderIcon`          | component | Monochrome brand glyph keyed by scheme; key-glyph fallback for unknown       |
| `useAvailableExternalProviders` | hook      | Re-export: providers advertised by `GET /account/config`                     |
| `getDefaultPasskeyName`         | fn        | Best-effort `"{browser} - {os}"` label suggestion for a new passkey          |
| `AvailableExternalProviders`    | type      | Return shape of `useAvailableExternalProviders` (re-export)                  |
| `ExternalLoginProvider`         | type      | One advertised provider (`name` / `type` / `displayName`) (re-export)        |
| `accountTranslationsEn`         | const     | English `Account.*` / `Auth.ExternalLogin.*` / `Auth.SessionReview.*` bundle |
| `accountTranslationsFr`         | const     | French counterpart of the same bundle                                        |

`useAvailableExternalProviders` / `AvailableExternalProviders` / `ExternalLoginProvider`
are re-exported from [`@granit/react-account`](../react-account) and
[`@granit/account`](../account); there is no hardcoded provider registry in the front —
button labels come from the backend `displayName`, icons are keyed by the provider
`type`, and the scheme `name` is what travels to the challenge endpoint.

## Caveats

- **External-login challenge is a seam.** A live backend answers
  `POST /account/external-logins/challenge/{name}` with a `302` to the identity provider —
  the browser navigation is what starts the OAuth dance. Under MSW there is no IdP, so a
  successful challenge shows an informational toast instead of navigating. `HttpError`
  `400` (provider not configured) and `500` (configured but its auth handler is not
  registered on the host — defence in depth) surface as scoped toasts here; the global
  mutation handler ignores them because an `HttpError` is not an Axios error.
- **Passkey names are privacy-limited.** Browsers never expose the real machine hostname
  and WebAuthn returns no device identity, so `getDefaultPasskeyName` derives only a
  best-effort `"{browser} – {os}"` label (UA Client Hints, falling back to UA parsing).
  It returns `""` under SSR or a locked-down UA. The value is a *suggestion* the user
  edits before saving.
- **Step-up auth on teardown.** Disabling 2FA, disabling the email factor, deleting the
  account, and regenerating recovery codes all re-prompt for the current password — the
  password field is flagged invalid on a server rejection rather than parsed from the
  error body.
- **Recovery codes are shown once.** `TwoFactorPage` renders freshly generated recovery
  codes inline (copy-all) and never refetches them; regenerating invalidates all prior
  codes. They are not persisted client-side.
- **`SecurityReviewPage` is unauthenticated.** It carries its own `IdentityProvider` and
  treats the URL token as the only credential; a `400` from either review endpoint means
  the token is invalid or expired (rendered as a generic "invalid or expired" state, not
  the underlying detail).

## Out of scope

- **DTOs and HTTP transport** — owned by [`@granit/account`](../account) /
  [`@granit/identity`](../identity) (mirrors of `Granit.Identity`); this kit only renders.
- **React Query hooks and providers** — owned by [`@granit/react-account`](../react-account)
  and [`@granit/react-identity`](../react-identity); this kit only composes them.
- **Authentication / login** — issuing and refreshing tokens is `@granit/authentication`
  and the BFF; the headless-login screens live in
  [`@granit/react-ui-authentication-local`](../react-ui-authentication-local). This kit
  consumes the already-authenticated client.
- **Admin user management** — managing *other* users' sessions/devices/security is the
  admin audience in [`@granit/react-ui-identity`](../react-ui-identity); this kit is the
  *self* audience only.

## License

Apache-2.0
