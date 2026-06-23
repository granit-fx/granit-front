// Pages — self-service account
export { ProfilePage } from './profile-page';
export { DeleteAccountPage } from './delete-account-page';
export { SessionsPage } from './sessions-page';

// Pages — security
export { PasswordPage } from './security/password-page';
export { TwoFactorPage } from './security/two-factor-page';
export { PasskeysPage } from './security/passkeys-page';
export { ExternalLoginsPage } from './security/external-logins-page';
export { SecurityReviewPage } from './security/security-review-page';

// Components
export { MySessionsCard } from './components/my-sessions-card';
export { MyDevicesCard } from './components/my-devices-card';
export { ExternalLoginButtons } from './security/external-login-buttons';
export { ExternalProviderIcon } from './security/external-provider-icon';

// Hooks / utilities
export {
  useAvailableExternalProviders,
  type AvailableExternalProviders,
  type ExternalLoginProvider,
} from './security/use-available-external-providers';
export { getDefaultPasskeyName } from './security/passkey-device-name';

// i18n bundles
export { accountTranslationsEn, accountTranslationsFr } from './locales';
