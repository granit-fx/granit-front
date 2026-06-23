// @granit/react-ui-authentication-local — end-user authentication UI for the
// local (OpenIddict) provider. Composes the headless @granit/react-authentication-local
// (LocalAuthProvider + login/passkey/two-factor hooks) and @granit/react-account
// (AccountProvider + registration/password/email hooks) with the foundation UI
// packages. Pages are provider-agnostic: the host supplies LocalAuthProvider and
// AccountProvider (which resolve an API client); these pages only call the hooks.
// The login flow's post-login redirect is owned by useLoginWithRedirect. Form
// validation derives from spec-style constraints via createConstraintsResolver
// from @granit/react-validation.

// Pages
export { ChangeEmailPage } from './change-email-page';
export { ConfirmEmailChangePage } from './confirm-email-change-page';
export { ConfirmEmailPage } from './confirm-email-page';
export { ForgotPasswordPage } from './forgot-password-page';
export { LocalLoginPage } from './local-login-page';
export { RegisterPage } from './register-page';
export { ResetPasswordPage } from './reset-password-page';

// Reusable form components (compose your own login experience)
export { CredentialForm } from './credential-form';
export { ExternalLoginButtons } from './external-login-buttons';
export { ExternalProviderIcon } from './external-provider-icon';
export { HeadlessLoginForm } from './headless-login-form';
export { PublicLayout } from './public-layout';
export { TokenConfirmationResult, type ConfirmationStatus } from './token-confirmation-result';
export { TwoFactorForm } from './two-factor-form';

// Spec-style validation constraints + form value types
export {
  changeEmailConstraints,
  forgotPasswordConstraints,
  loginConstraints,
  registerConstraints,
  resetPasswordConstraints,
  twoFactorConstraints,
  type ChangeEmailFormValues,
  type ForgotPasswordFormValues,
  type LoginFormValues,
  type RegisterFormValues,
  type ResetPasswordFormValues,
  type TwoFactorFormValues,
} from './validation';

// i18next resource bundles (flat keys, "translation" ns). Owns the `Auth.*` keys
// for the end-user local authentication flow.
export { authLocalTranslationsEn, authLocalTranslationsFr } from './locales/index';
export type { AuthLocalTranslations } from './locales/index';

// WebAuthn base64url helpers (used by the host passkeys UI).
export { fromBase64Url, toBase64Url } from './login-helpers';
