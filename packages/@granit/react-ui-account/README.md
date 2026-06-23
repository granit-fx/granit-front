# @granit/react-ui-account

Self-service **Account** UI — the signed-in user managing their own account:

- **Profile** (`ProfilePage`) — view / edit first and last name, see email and
  confirmation status.
- **Account deletion** (`DeleteAccountPage`) — password-confirmed danger-zone
  deletion; calls back to the host to sign the user out.
- **Sessions & devices** (`SessionsPage`, `MySessionsCard`, `MyDevicesCard`) —
  the caller's own active sessions and grouped devices, with revoke actions.
- **Password** (`PasswordPage`) — change the account password.
- **Two-factor** (`TwoFactorPage`) — authenticator-app TOTP enrolment, recovery
  codes, and the opt-in email one-time-code factor.
- **Passkeys** (`PasskeysPage`) — register / rename / remove WebAuthn passkeys.
- **External logins** (`ExternalLoginsPage`, `ExternalLoginButtons`,
  `ExternalProviderIcon`) — link / unlink OAuth providers.
- **Sign-in review** (`SecurityReviewPage`) — the anonymous, token-protected
  "Was this you?" page reached from a security-alert email CTA.

The **visual** layer for account self-service: it composes the headless
[`@granit/react-account`](../react-account) and
[`@granit/react-identity`](../react-identity) (providers + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-identity`](../react-ui-identity)) and stays
auth-pattern-agnostic — the host injects everything pattern-specific.

## Usage

```tsx
import { ProfilePage, accountTranslationsEn } from '@granit/react-ui-account';

i18n.addResourceBundle('en', 'translation', accountTranslationsEn, true, true);

// Mount under an AccountProvider (from @granit/react-account) and a router:
<Route path="/account/profile" element={<ProfilePage />} />;
```

## Injection

The package is decoupled from the host's auth pattern. The host wires:

- **Session tracking** — `SessionsPage` (and `MySessionsCard` / `MyDevicesCard`)
  take `sessionTrackingEnabled: boolean`. Session listing/revocation only works
  behind a cookie/BFF (or mock) session, so the host computes
  `isBffMode || isMockMode` and passes it; the cards hide themselves when false.
  The package never references BFF / mock / auth-mode.
- **Sign-out callback** — `DeleteAccountPage` takes `onDeleted?: () => void`; the
  host passes its `useAuth().logout`. The package does not depend on the auth
  feature.
- **Layout slot** — `SecurityReviewPage` takes
  `layout?: React.ComponentType<{ readonly children: React.ReactNode }>`
  (defaults to a passthrough); the host passes its `PublicLayout`.
- **API client** — resolved from a `GranitClientProvider` / `AccountProvider` /
  `IdentityProvider` higher in the tree. No client baked in.
- **Routing** — `SecurityReviewPage` uses `react-router-dom`
  (`Link` / `useSearchParams`); mount it under a router.
- **i18n** — ships its `Account.*`, `Auth.ExternalLogin.*`,
  `Auth.SessionReview.*` and `Auth.HeadlessLogin.BackToLogin` strings
  (`accountTranslationsEn/Fr`); the host registers them.
