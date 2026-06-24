# @granit/react-ui-authentication-local

End-user **authentication UI** for the Granit local (OpenIddict) identity
provider — the ready-to-mount login (credentials, passkey, two-factor),
registration, forgot/reset password, email-confirmation and change-email pages
for an app's public auth area. This is the **react-ui admin/feature-kit layer**:
it renders shadcn-based screens by composing the headless data layers with the
foundation UI packages. It owns no HTTP calls and no React Query keys — every
fetch flows through the hooks it consumes.

The pages are **provider-agnostic**: the host mounts `LocalAuthProvider` (from
[`@granit/react-authentication-local`](../react-authentication-local)) and
`AccountProvider` (from [`@granit/react-account`](../react-account)) — which carry
the Axios client — and these pages only call the hooks below them. The post-login
OIDC redirect is owned by `useLoginWithRedirect`, so no app current-user context
is needed. Form validation is derived from spec-style constraints fed to
`createConstraintsResolver` from [`@granit/react-validation`](../react-validation),
not hand-rolled Zod.

The split is four data packages over the .NET `Granit.Identity.Local` backend
(login / passkey / two-factor; contract `contracts/openapi/identity-local.json`)
and `Granit.Identity` (account self-service; contract
`contracts/openapi/identity.json`), with this kit on top:

- [`@granit/authentication-local`](../authentication-local) +
  [`@granit/account`](../account) — framework-agnostic cores: DTOs + Axios calls.
- [`@granit/react-authentication-local`](../react-authentication-local) +
  [`@granit/react-account`](../react-account) — React Query hooks + providers.
- `@granit/react-ui-authentication-local` (this package) — the rendered pages and
  reusable form components.

External-provider ("Continue with …") buttons share the
[`@granit/react-ui-authentication-federated`](../react-ui-authentication-federated)
flow; the challenge here is issued through `@granit/react-account`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- [`@granit/react-authentication-local`](../react-authentication-local) +
  [`@granit/authentication-local`](../authentication-local) — login / passkey /
  two-factor hooks and their DTOs.
- [`@granit/react-account`](../react-account) +
  [`@granit/account`](../account) — registration / password / email / external-
  login hooks and their DTOs.
- `@granit/react-ui` — the shadcn foundation (`Form`, `Input`, `Button`, `Alert`,
  `toast`, …) every page is built from.
- `@granit/react-validation` + `@granit/validation` — `createConstraintsResolver`
  and the `SchemaConstraints` type the form constraints satisfy.
- `@granit/react-localization` — `useTranslation`; the host registers the bundled
  `Auth.*` resources (see i18n).
- `@granit/api-client` — `isAxiosError` / `HttpError` for status-code branching;
  also the Axios client the providers resolve.
- `@granit/logger` and `@granit/utils` — diagnostics logging and shared helpers.
- `lucide-react` (`^1.21`), `react-hook-form` (`^7.80`), `react-router-dom`
  (`^7.18`), and `react` / `react-dom` (`^19`).

## Quick start

Wire both providers once, register the bundled translations, then route the
pages. The pages read `userId` / `token` / `returnUrl` / `error` from the URL
query string themselves.

```tsx
import { LocalAuthProvider } from '@granit/react-authentication-local';
import { AccountProvider } from '@granit/react-account';
import { useGranitClient } from '@granit/react-api-client';
import { Route, Routes } from 'react-router-dom';
import {
  LocalLoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ConfirmEmailPage,
  authLocalTranslationsEn,
} from '@granit/react-ui-authentication-local';

function AuthArea() {
  const client = useGranitClient();
  return (
    <LocalAuthProvider config={{ client }}>
      <AccountProvider config={{ client }}>
        <Routes>
          <Route path="/login" element={<LocalLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        </Routes>
      </AccountProvider>
    </LocalAuthProvider>
  );
}

// Register the bundled resources into your i18next instance (host owns i18n):
// i18n.addResourceBundle('en', 'translation', authLocalTranslationsEn, true, true);
```

`LocalLoginPage` renders the full headless login flow (credentials, passkey,
two-factor, and any backend-configured external providers). It accepts an optional
`onAuthenticated?: () => void` for hosts that need an app-level notification once
the user is signed in — the redirect happens regardless. To assemble a custom
login screen instead of using the page, compose the reusable form components
directly — they call the same hooks:

```tsx
import { CredentialForm, TwoFactorForm, PublicLayout } from '@granit/react-ui-authentication-local';
import { useState } from 'react';

function CustomLogin() {
  const [error, setError] = useState<string | null>(null);
  const [methods, setMethods] = useState<readonly string[] | undefined>();
  const [step, setStep] = useState<'credentials' | 'two-factor'>('credentials');

  return (
    <PublicLayout>
      {step === 'credentials' ? (
        <CredentialForm
          serverError={error}
          setServerError={setError}
          onTwoFactorRequired={(m) => {
            setMethods(m); // the server's opt-in factors — never assume a method
            setStep('two-factor');
          }}
        />
      ) : (
        <TwoFactorForm
          methods={methods}
          serverError={error}
          setServerError={setError}
          onBack={() => setStep('credentials')}
        />
      )}
    </PublicLayout>
  );
}
```

## Public API

| Symbol                    | Kind      | Purpose                                                                       |
| ------------------------- | --------- | ----------------------------------------------------------------------------- |
| `LocalLoginPage`          | component | Self-hosted login page (credentials + passkey + 2FA + external providers)     |
| `RegisterPage`            | component | Registration page, gated on `allowSelfRegistration`; 202 → "check your inbox" |
| `ForgotPasswordPage`      | component | Request a password-reset email (rate-limited; 429 handled)                    |
| `ResetPasswordPage`       | component | Set a new password from a `userId` + `token` link                             |
| `ConfirmEmailPage`        | component | Confirm a new account's email on mount; resend-confirmation control           |
| `ConfirmEmailChangePage`  | component | Confirm an email change (`userId` + `newEmail` + `token`) on mount            |
| `ChangeEmailPage`         | component | Authenticated change-email form (renders in host chrome, not the layout)      |
| `CredentialForm`          | component | Login/passkey form; `onTwoFactorRequired(methods?)` escalates to 2FA          |
| `TwoFactorForm`           | component | Second-factor step (Authenticator / Email code / RecoveryCode)                |
| `ExternalLoginButtons`    | component | One OAuth-challenge button per backend provider (`sign-in` / `link` variant)  |
| `ExternalProviderIcon`    | component | Monochrome brand glyph by scheme; key-glyph fallback for unknown schemes      |
| `HeadlessLoginForm`       | component | The composed multi-step login flow `LocalLoginPage` wraps                     |
| `PublicLayout`            | component | Centered card chrome for unauthenticated pages (host owns the product name)   |
| `TokenConfirmationResult` | component | Shared loading/success/error display for token-confirmation flows             |
| `ConfirmationStatus`      | type      | `'loading' \| 'success' \| 'error'`                                           |
| `*Constraints`            | const     | `SchemaConstraints` for each form (login, register, reset, change-email, …)   |
| `*FormValues`             | type      | React Hook Form value shapes (`LoginFormValues`, `RegisterFormValues`, …)     |
| `fromBase64Url`           | fn        | base64url → `Uint8Array` for WebAuthn challenge/credential ids                |
| `toBase64Url`             | fn        | `ArrayBuffer` → base64url for serializing a passkey assertion                 |
| `authLocalTranslationsEn` | const     | English `Auth.*` i18next bundle (flat keys, `translation` ns)                 |
| `authLocalTranslationsFr` | const     | French `Auth.*` i18next bundle                                                |
| `AuthLocalTranslations`   | type      | Shape of a translation bundle                                                 |

The `*Constraints` exports are `loginConstraints`, `registerConstraints`,
`forgotPasswordConstraints`, `resetPasswordConstraints`, `changeEmailConstraints`,
and `twoFactorConstraints`; each pairs with the matching `*FormValues` type.

## i18n

Ships flat `Auth.*` keys in the `translation` namespace via
`authLocalTranslationsEn` / `authLocalTranslationsFr`. Register them in the host
i18n instance with `addResourceBundle(lng, 'translation', bundle, true, true)`.
The lookup runs with `keySeparator` / `nsSeparator` disabled, so these are flat
string keys, not namespace traversals. The host owns the `Common.*` and
`Account.TwoFactor.*` keys; `PublicLayout` reads the host-owned `Common.AppName`
and `Auth.LoginPage.PlatformTitle` for its branding header.

## Validation

The forms derive their validation from spec-style constraints
(`loginConstraints`, `registerConstraints`, `forgotPasswordConstraints`,
`resetPasswordConstraints`, `changeEmailConstraints`, `twoFactorConstraints`) fed
to `createConstraintsResolver(…, t, { labelResolver })` from
`@granit/react-validation`. The Identity login endpoint uses a distinct validation
pipeline, so these constraints are hand-written (typed as `SchemaConstraints` from
`@granit/validation`) rather than generated from OpenAPI.

## Out of scope / caveats

- **No data layer.** HTTP transport, DTOs, providers, and React Query hooks live
  in [`@granit/react-authentication-local`](../react-authentication-local) /
  [`@granit/account`](../account) and siblings; this package only renders. It
  exposes no `/testing` subpath and pulls no `msw` peer — mock at the hook layer
  using those packages' fixtures.
- **Host owns the providers and i18n.** Pages assume `LocalAuthProvider` +
  `AccountProvider` are mounted above them and the `Auth.*` / `Common.AppName`
  resource keys are registered on the host's i18next instance. Locale/theme
  switchers go around `PublicLayout`, not inside it.
- **Open-redirect hardening (CWE-601).** `returnUrl` is validated before any
  `location.href` assignment — only single-leading-slash same-origin relative
  paths are accepted; absolute, protocol-relative (`//evil.tld`), and non-http(s)
  schemes (`javascript:`, `data:`) fall back to the default. Reuse this guard for
  any host-side redirect that consumes the same query param.
- **Anti-enumeration is deliberate.** The login mutation surfaces invalid-
  credentials, locked-out, and not-allowed as a single generic `401` message;
  forgot-password always shows the "email sent" state regardless of whether the
  address exists. Do not "improve" these into distinguishable messages.
- **Second factors are opt-in, never assumed.** `TwoFactorForm.methods` is the
  exact set the server reported for that user; the UI offers only those (and falls
  back to authenticator-only when the list is omitted). Do not surface a method the
  server did not advertise.
- **`DirectLoginDemo` is a demo.** `HeadlessLoginForm` includes a small section
  exercising the non-redirect `useLogin` path for illustration; production login
  goes through the redirect flow (`useLoginWithRedirect`).

## License

Apache-2.0
