# @granit/react-ui-authentication-local

End-user authentication UI for the **local (OpenIddict)** provider — the
self-hosted login (credentials, passkey, two-factor), registration,
forgot/reset password, email confirmation and change-email pages. Pairs the
headless `@granit/react-authentication-local` (`LocalAuthProvider`,
`useLoginWithRedirect`, passkey + two-factor hooks) and `@granit/react-account`
(`AccountProvider`, registration / password / email hooks) with the foundation
UI packages.

## Usage

The host app supplies the providers (which carry the Axios API client); these
pages only consume the hooks. The login flow's post-login redirect is owned by
`useLoginWithRedirect`, so no app current-user context is required.

```tsx
import { AccountProvider } from '@granit/react-account';
import { LocalAuthProvider } from '@granit/react-authentication-local';
import { LocalLoginPage, RegisterPage } from '@granit/react-ui-authentication-local';

<AccountProvider config={{ client }}>
  <LocalAuthProvider config={{ client }}>
    <LocalLoginPage />
  </LocalAuthProvider>
</AccountProvider>;
```

Pages exported: `LocalLoginPage`, `RegisterPage`, `ForgotPasswordPage`,
`ResetPasswordPage`, `ConfirmEmailPage`, `ConfirmEmailChangePage`,
`ChangeEmailPage`. Reusable building blocks are also exported (`HeadlessLoginForm`,
`CredentialForm`, `TwoFactorForm`, `TokenConfirmationResult`,
`ExternalLoginButtons`, `ExternalProviderIcon`, `PublicLayout`).

`LocalLoginPage` accepts an optional `onAuthenticated?: () => void` for hosts
that need an app-level notification once the user is signed in.

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
`resetPasswordConstraints`, `changeEmailConstraints`, `twoFactorConstraints`)
fed to `createConstraintsResolver(…, t, { labelResolver })` from
`@granit/react-validation`. The Identity login endpoint uses a distinct
validation pipeline, so these constraints are hand-written (typed as
`SchemaConstraints` from `@granit/validation`) rather than generated from OpenAPI.
